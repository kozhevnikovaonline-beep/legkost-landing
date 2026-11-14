/**
 * Все изменения состояния пользователя — через действия (actions).
 * Один и тот же редьюсер выполняется на клиенте (оптимистично) и на сервере
 * (авторитетно), поэтому правила начисления не расходятся.
 */
import {
  applyDiscount,
  applyTaps,
  buyBoost,
  buyWithFeathers,
  claimDaily,
  claimTask,
  fullRecharge,
  maxDiscountRub,
  type EconomyError,
} from "./economy.ts";
import { BUNDLES, catalogById, FREE_LEAD_MAGNET, minPriceRub } from "./catalog.ts";
import type { BoostKind, UserState } from "./types.ts";

export const LESSON_IDS = ["lesson-1", "lesson-2", "lesson-3"] as const;

export type Action =
  | { type: "onboard" }
  | { type: "taps"; count: number; sinceTs: number }
  | { type: "boost"; kind: BoostKind }
  | { type: "recharge" }
  | { type: "daily" }
  | { type: "task"; id: string }
  | { type: "lesson"; id: string }
  | { type: "checklist"; id: string; items: number[] }
  | { type: "quiz"; id: string; result: string }
  | { type: "buyFeathers"; itemId: string }
  | { type: "discount"; productId: string; rub: number };

export type ActionError = EconomyError | "bad_request" | "locked";

export type ActionResult =
  | { ok: true; state: UserState; reward?: number; accepted?: number }
  | { ok: false; error: ActionError };

const BOOSTS: BoostKind[] = ["tap", "energy", "regen"];

/** Открыт ли урок: первый — всегда, следующий — после завершения предыдущего */
export function isLessonUnlocked(s: UserState, id: string): boolean {
  const idx = LESSON_IDS.indexOf(id as (typeof LESSON_IDS)[number]);
  if (idx < 0) return false;
  return idx === 0 || s.progress.lessonsCompleted.includes(LESSON_IDS[idx - 1]!);
}

export function reduce(s: UserState, a: Action, now: number): ActionResult {
  const touch = (state: UserState): UserState => ({ ...state, updatedAt: now });
  switch (a.type) {
    case "onboard": {
      if (s.progress.onboarded) return { ok: true, state: s };
      const owned = [...new Set([...s.progress.owned, ...FREE_LEAD_MAGNET])];
      return { ok: true, state: touch({ ...s, progress: { ...s.progress, onboarded: true, owned } }) };
    }
    case "taps": {
      if (!Number.isFinite(a.count) || a.count <= 0 || a.count > 5000) return { ok: false, error: "bad_request" };
      const r = applyTaps(s.game, a.count, now, { sinceTs: a.sinceTs });
      return { ok: true, state: touch({ ...s, game: r.game }), reward: r.earned, accepted: r.accepted };
    }
    case "boost": {
      if (!BOOSTS.includes(a.kind)) return { ok: false, error: "bad_request" };
      const r = buyBoost(s.game, a.kind, now);
      return r.ok ? { ok: true, state: touch({ ...s, game: r.value }) } : r;
    }
    case "recharge": {
      const r = fullRecharge(s.game, now);
      return r.ok ? { ok: true, state: touch({ ...s, game: r.value }) } : r;
    }
    case "daily": {
      const r = claimDaily(s.game, now);
      return r.ok ? { ok: true, state: touch({ ...s, game: r.value.game }), reward: r.value.reward } : r;
    }
    case "task": {
      const r = claimTask(s, a.id);
      return r.ok ? { ok: true, state: touch(r.value.state), reward: r.value.reward } : r;
    }
    case "lesson": {
      if (!isLessonUnlocked(s, a.id)) return { ok: false, error: "locked" };
      if (s.progress.lessonsCompleted.includes(a.id)) return { ok: true, state: s };
      const lessonsCompleted = [...s.progress.lessonsCompleted, a.id];
      let owned = s.progress.owned;
      // Бонус лид-магнита: после 3-го урока открывается эфир «Питание при гормональных сбоях»
      if (LESSON_IDS.every((l) => lessonsCompleted.includes(l)) && !owned.includes("bonus-hormones")) {
        owned = [...owned, "bonus-hormones"];
      }
      return { ok: true, state: touch({ ...s, progress: { ...s.progress, lessonsCompleted, owned } }) };
    }
    case "checklist": {
      if (typeof a.id !== "string" || a.id.length > 64 || !Array.isArray(a.items)) return { ok: false, error: "bad_request" };
      const items = [...new Set(a.items.filter((i) => Number.isInteger(i) && i >= 0 && i < 100))].sort((x, y) => x - y);
      return { ok: true, state: touch({ ...s, progress: { ...s.progress, checklists: { ...s.progress.checklists, [a.id]: items } } }) };
    }
    case "quiz": {
      if (!/^[a-z0-9-]{1,32}$/.test(a.id) || !/^[a-z0-9-]{1,32}$/.test(a.result)) return { ok: false, error: "bad_request" };
      return { ok: true, state: touch({ ...s, progress: { ...s.progress, quizResults: { ...s.progress.quizResults, [a.id]: a.result } } }) };
    }
    case "buyFeathers": {
      const item = catalogById.get(a.itemId);
      if (!item || item.kind !== "guide" || !item.priceFeathers) return { ok: false, error: "bad_request" };
      const r = buyWithFeathers(s, item.id, item.priceFeathers);
      return r.ok ? { ok: true, state: touch(r.value) } : r;
    }
    case "discount": {
      const item = catalogById.get(a.productId);
      if (!item || item.kind === "free" || item.plans.length === 0) return { ok: false, error: "bad_request" };
      const r = applyDiscount(s, item.id, minPriceRub(item), a.rub);
      return r.ok ? { ok: true, state: touch(r.value) } : r;
    }
  }
}

/** Отметить оплаченный продукт (вызывается сервером после успешной оплаты или демо-оплатой) */
export function grantPurchase(s: UserState, productId: string, now: number): UserState {
  const owned = new Set([...s.progress.owned, productId, ...(BUNDLES[productId] ?? [])]);
  const coupons = { ...s.progress.coupons };
  delete coupons[productId]; // скидка израсходована
  return { ...s, updatedAt: now, progress: { ...s.progress, owned: [...owned], coupons } };
}

/** Итоговая цена с учётом скидки пёрышками */
export function finalPrice(s: UserState, productId: string, planPriceRub: number): number {
  const coupon = s.progress.coupons[productId] ?? 0;
  return Math.max(0, planPriceRub - Math.min(coupon, maxDiscountRub(planPriceRub)));
}
