/**
 * Экономика «лепестков»: энергия, тапы, бусты, ежедневные награды, задания, скидки.
 * Чистые функции без побочных эффектов — одна и та же логика работает
 * на клиенте (мгновенный отклик) и на сервере (защита от накрутки).
 */
import type { BoostKind, GameState, ProgressState, UserState } from "./types.ts";

export const ECONOMY = {
  maxBoostLevel: 10,
  /** Энергии на 1 уровне и прирост за уровень буста «Запас сил» */
  energyBase: 500,
  energyPerLevel: 250,
  /** Восстановление энергии в секунду на 1 уровне и прирост за уровень */
  regenBase: 1,
  regenPerLevel: 0.5,
  /** Бесплатных полных восстановлений в сутки */
  rechargesPerDay: 3,
  /** Физический предел скорости тапов (для проверки на сервере) */
  maxTapsPerSecond: 20,
  /** Сколько лепестков = 1 ₽ скидки */
  feathersPerRub: 1,
  /** Максимальная доля цены, которую можно оплатить лепестками */
  maxDiscountShare: 0.3,
  /** Часовой пояс для смены суток (МСК) */
  tzOffsetMinutes: 180,
} as const;

export const BOOST_BASE_COST: Record<BoostKind, number> = {
  tap: 2000,
  energy: 1500,
  regen: 1500,
};

/** Награды за ежедневный вход: 1-й, 2-й … 7-й день подряд (дальше — как 7-й) */
export const DAILY_REWARDS = [100, 250, 400, 700, 1000, 1500, 2500] as const;

/** Задания и награды. Тексты — в src/content/tasks.ts */
export const TASK_REWARDS = {
  welcome: 500,
  notifications: 300,
  "lesson-1": 300,
  "lesson-2": 300,
  "lesson-3": 300,
  "all-lessons": 1500,
  "quiz-type": 500,
  "quiz-format": 500,
  channel: 700,
  "first-guide": 300,
} as const;
export type TaskId = keyof typeof TASK_REWARDS;
export const REFERRAL_REWARD = 2000;

export const LEVELS = [
  { min: 0, title: "Первый шаг" },
  { min: 3000, title: "В процессе" },
  { min: 10000, title: "Без срывов" },
  { min: 25000, title: "В тонусе" },
  { min: 50000, title: "Лёгкая" },
  { min: 100000, title: "Сияющая" },
  { min: 250000, title: "Амбассадор" },
] as const;

/* ------------------------------------------------------------------ */

export function dayKey(ts: number, tz = ECONOMY.tzOffsetMinutes): string {
  return new Date(ts + tz * 60_000).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export const tapPower = (g: GameState) => g.boosts.tap;
export const energyMax = (g: GameState) => ECONOMY.energyBase + (g.boosts.energy - 1) * ECONOMY.energyPerLevel;
export const regenPerSecond = (g: GameState) => ECONOMY.regenBase + (g.boosts.regen - 1) * ECONOMY.regenPerLevel;

export function boostCost(kind: BoostKind, level: number): number {
  return Math.round(BOOST_BASE_COST[kind] * 2 ** (level - 1));
}

export function levelOf(totalEarned: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (totalEarned >= l.min) idx = i;
  });
  const current = LEVELS[idx]!;
  const next = LEVELS[idx + 1];
  const progress = next ? (totalEarned - current.min) / (next.min - current.min) : 1;
  return { index: idx, title: current.title, next, progress: Math.max(0, Math.min(1, progress)) };
}

/** Энергия на момент now с учётом восстановления */
export function currentEnergy(g: GameState, now: number): number {
  const elapsed = Math.max(0, now - g.energyUpdatedAt) / 1000;
  return Math.min(energyMax(g), g.energy + elapsed * regenPerSecond(g));
}

export function settleEnergy(g: GameState, now: number): GameState {
  return { ...g, energy: currentEnergy(g, now), energyUpdatedAt: now };
}

function earn(g: GameState, amount: number): GameState {
  return { ...g, balance: g.balance + amount, totalEarned: g.totalEarned + amount };
}

/**
 * Применить пачку тапов. Возвращает, сколько тапов принято:
 * не больше, чем хватает энергии, и (если задан sinceTs) не быстрее физического предела.
 */
export function applyTaps(
  g: GameState,
  count: number,
  now: number,
  opts: { sinceTs?: number } = {},
): { game: GameState; accepted: number; earned: number } {
  const settled = settleEnergy(g, now);
  const power = tapPower(settled);
  let limit = Math.floor(settled.energy / power);
  if (opts.sinceTs !== undefined) {
    const seconds = Math.max(1, (now - opts.sinceTs) / 1000);
    limit = Math.min(limit, Math.ceil(seconds * ECONOMY.maxTapsPerSecond));
  }
  const accepted = Math.max(0, Math.min(Math.floor(count), limit));
  const earned = accepted * power;
  const game = earn({ ...settled, energy: settled.energy - earned, taps: settled.taps + accepted }, earned);
  return { game, accepted, earned };
}

export type EconomyError =
  | "not_enough_feathers"
  | "max_level"
  | "already_claimed"
  | "no_recharges"
  | "energy_full"
  | "unknown_task"
  | "not_eligible"
  | "already_owned"
  | "discount_limit";

export type Result<T> = { ok: true; value: T } | { ok: false; error: EconomyError };

export function buyBoost(g: GameState, kind: BoostKind, now: number): Result<GameState> {
  const level = g.boosts[kind];
  if (level >= ECONOMY.maxBoostLevel) return { ok: false, error: "max_level" };
  const cost = boostCost(kind, level + 1);
  if (g.balance < cost) return { ok: false, error: "not_enough_feathers" };
  const settled = settleEnergy(g, now);
  return {
    ok: true,
    value: { ...settled, balance: settled.balance - cost, boosts: { ...settled.boosts, [kind]: level + 1 } },
  };
}

export function rechargesLeft(g: GameState, now: number): number {
  const today = dayKey(now);
  return g.recharges.day === today ? Math.max(0, ECONOMY.rechargesPerDay - g.recharges.used) : ECONOMY.rechargesPerDay;
}

export function fullRecharge(g: GameState, now: number): Result<GameState> {
  if (rechargesLeft(g, now) <= 0) return { ok: false, error: "no_recharges" };
  if (currentEnergy(g, now) >= energyMax(g)) return { ok: false, error: "energy_full" };
  const today = dayKey(now);
  const used = g.recharges.day === today ? g.recharges.used + 1 : 1;
  return { ok: true, value: { ...g, energy: energyMax(g), energyUpdatedAt: now, recharges: { day: today, used } } };
}

/** Состояние ежедневной награды на сегодня */
export function dailyStatus(g: GameState, now: number) {
  const today = dayKey(now);
  const last = g.daily.lastClaimDay;
  const claimedToday = last === today;
  const continues = last !== null && daysBetween(last, today) === 1;
  const nextStreak = claimedToday ? g.daily.streak : continues ? g.daily.streak + 1 : 1;
  const reward = DAILY_REWARDS[Math.min(nextStreak, DAILY_REWARDS.length) - 1]!;
  return { claimedToday, nextStreak, reward, streak: claimedToday ? g.daily.streak : continues ? g.daily.streak : 0 };
}

export function claimDaily(g: GameState, now: number): Result<{ game: GameState; reward: number }> {
  const s = dailyStatus(g, now);
  if (s.claimedToday) return { ok: false, error: "already_claimed" };
  const game = earn({ ...g, daily: { lastClaimDay: dayKey(now), streak: s.nextStreak } }, s.reward);
  return { ok: true, value: { game, reward: s.reward } };
}

/** Условия заданий: награду можно забрать, только если условие выполнено */
export function isTaskEligible(task: TaskId, p: ProgressState): boolean {
  switch (task) {
    case "lesson-1":
    case "lesson-2":
    case "lesson-3":
      return p.lessonsCompleted.includes(task);
    case "all-lessons":
      return ["lesson-1", "lesson-2", "lesson-3"].every((l) => p.lessonsCompleted.includes(l));
    case "quiz-type":
      return Boolean(p.quizResults["type"]);
    case "quiz-format":
      return Boolean(p.quizResults["format"]);
    case "first-guide":
      return p.owned.some((id) => id.startsWith("guide-"));
    case "welcome":
    case "notifications":
    case "channel":
      return true;
  }
}

export function claimTask(s: UserState, task: string): Result<{ state: UserState; reward: number }> {
  if (!(task in TASK_REWARDS)) return { ok: false, error: "unknown_task" };
  const id = task as TaskId;
  if (s.progress.tasksClaimed.includes(id)) return { ok: false, error: "already_claimed" };
  if (!isTaskEligible(id, s.progress)) return { ok: false, error: "not_eligible" };
  const reward = TASK_REWARDS[id];
  return {
    ok: true,
    value: {
      reward,
      state: {
        ...s,
        game: earn(s.game, reward),
        progress: { ...s.progress, tasksClaimed: [...s.progress.tasksClaimed, id] },
      },
    },
  };
}

/** Купить материал целиком за лепестки */
export function buyWithFeathers(s: UserState, itemId: string, price: number): Result<UserState> {
  if (s.progress.owned.includes(itemId)) return { ok: false, error: "already_owned" };
  if (s.game.balance < price) return { ok: false, error: "not_enough_feathers" };
  return {
    ok: true,
    value: {
      ...s,
      game: { ...s.game, balance: s.game.balance - price },
      progress: { ...s.progress, owned: [...s.progress.owned, itemId] },
    },
  };
}

/** Максимальная скидка в ₽ на продукт с ценой priceRub */
export const maxDiscountRub = (priceRub: number) => Math.floor(priceRub * ECONOMY.maxDiscountShare);

/** Обменять лепестки на скидку (накопительно, до 30% цены) */
export function applyDiscount(s: UserState, productId: string, priceRub: number, rub: number): Result<UserState> {
  const already = s.progress.coupons[productId] ?? 0;
  const amount = Math.floor(rub);
  if (amount <= 0 || already + amount > maxDiscountRub(priceRub)) return { ok: false, error: "discount_limit" };
  const cost = amount * ECONOMY.feathersPerRub;
  if (s.game.balance < cost) return { ok: false, error: "not_enough_feathers" };
  return {
    ok: true,
    value: {
      ...s,
      game: { ...s.game, balance: s.game.balance - cost },
      progress: { ...s.progress, coupons: { ...s.progress.coupons, [productId]: already + amount } },
    },
  };
}

export function createInitialState(now: number): UserState {
  return {
    version: 1,
    updatedAt: now,
    game: {
      balance: 0,
      totalEarned: 0,
      taps: 0,
      energy: ECONOMY.energyBase,
      energyUpdatedAt: now,
      boosts: { tap: 1, energy: 1, regen: 1 },
      recharges: { day: dayKey(now), used: 0 },
      daily: { lastClaimDay: null, streak: 0 },
    },
    progress: {
      onboarded: false,
      lessonsCompleted: [],
      checklists: {},
      quizResults: {},
      tasksClaimed: [],
      owned: [],
      coupons: {},
      referrals: 0,
    },
  };
}
