/**
 * Безопасный разбор сохранённого состояния. Данные из CloudStorage,
 * localStorage или тела запроса считаются недоверенными: всё, что не прошло
 * проверку, заменяется значениями по умолчанию.
 */
import { createInitialState, ECONOMY } from "./economy.ts";
import type { UserState } from "./types.ts";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
const int = (v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER) => Math.floor(num(v, def, min, max));
const str = (v: unknown, def: string | null, maxLen = 64) =>
  typeof v === "string" && v.length <= maxLen ? v : def;
const strArr = (v: unknown, maxItems = 200) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && x.length <= 64))].slice(0, maxItems) : [];

export function parseUserState(raw: unknown, now = Date.now()): UserState {
  const def = createInitialState(now);
  if (!isObj(raw) || raw.version !== 1) return def;
  const g = isObj(raw.game) ? raw.game : {};
  const p = isObj(raw.progress) ? raw.progress : {};
  const boosts = isObj(g.boosts) ? g.boosts : {};
  const rech = isObj(g.recharges) ? g.recharges : {};
  const daily = isObj(g.daily) ? g.daily : {};
  const lvl = (v: unknown) => int(v, 1, 1, ECONOMY.maxBoostLevel);

  const checklists: Record<string, number[]> = {};
  if (isObj(p.checklists)) {
    for (const [k, v] of Object.entries(p.checklists).slice(0, 50)) {
      if (Array.isArray(v)) checklists[k.slice(0, 64)] = v.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < 100);
    }
  }
  const quizResults: Record<string, string> = {};
  if (isObj(p.quizResults)) {
    for (const [k, v] of Object.entries(p.quizResults).slice(0, 20)) {
      const s = str(v, null);
      if (s) quizResults[k.slice(0, 64)] = s;
    }
  }
  const coupons: Record<string, number> = {};
  if (isObj(p.coupons)) {
    for (const [k, v] of Object.entries(p.coupons).slice(0, 50)) coupons[k.slice(0, 64)] = int(v, 0, 0, 1_000_000);
  }

  return {
    version: 1,
    updatedAt: int(raw.updatedAt, now),
    game: {
      balance: int(g.balance, 0),
      totalEarned: int(g.totalEarned, 0),
      taps: int(g.taps, 0),
      energy: num(g.energy, def.game.energy, 0, 100_000),
      energyUpdatedAt: int(g.energyUpdatedAt, now, 0, now),
      boosts: { tap: lvl(boosts.tap), energy: lvl(boosts.energy), regen: lvl(boosts.regen) },
      recharges: { day: str(rech.day, def.game.recharges.day, 10)!, used: int(rech.used, 0, 0, 100) },
      daily: { lastClaimDay: str(daily.lastClaimDay, null, 10), streak: int(daily.streak, 0, 0, 10_000) },
    },
    progress: {
      onboarded: p.onboarded === true,
      lessonsCompleted: strArr(p.lessonsCompleted),
      checklists,
      quizResults,
      tasksClaimed: strArr(p.tasksClaimed),
      owned: strArr(p.owned),
      coupons,
      referrals: int(p.referrals, 0, 0, 100_000),
    },
  };
}
