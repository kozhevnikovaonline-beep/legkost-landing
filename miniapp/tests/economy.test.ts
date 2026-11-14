import { describe, expect, it } from "vitest";
import { grantPurchase, finalPrice, reduce } from "../shared/actions.ts";
import { createInitialState, currentEnergy, DAILY_REWARDS, ECONOMY, energyMax, TASK_REWARDS } from "../shared/economy.ts";
import { parseUserState } from "../shared/validate.ts";
import type { UserState } from "../shared/types.ts";

const T0 = Date.parse("2026-11-14T09:00:00Z");
const ok = (r: ReturnType<typeof reduce>): UserState => {
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

describe("тапы и энергия", () => {
  it("каждый тап тратит энергию и даёт пёрышки", () => {
    const s = createInitialState(T0);
    const r = reduce(s, { type: "taps", count: 10, sinceTs: T0 - 10_000 }, T0);
    expect(r.ok && r.accepted).toBe(10);
    const st = ok(r);
    expect(st.game.balance).toBe(10);
    expect(Math.round(st.game.energy)).toBe(ECONOMY.energyBase - 10);
  });

  it("нельзя тапнуть больше, чем есть энергии", () => {
    const s = createInitialState(T0);
    const r = reduce(s, { type: "taps", count: 5000, sinceTs: T0 - 3_600_000 }, T0);
    expect(r.ok && r.accepted).toBe(ECONOMY.energyBase);
  });

  it("сервер режет скорость тапов (анти-автокликер)", () => {
    const s = createInitialState(T0);
    const r = reduce(s, { type: "taps", count: 400, sinceTs: T0 - 2000 }, T0);
    expect(r.ok && r.accepted).toBe(ECONOMY.maxTapsPerSecond * 2);
  });

  it("энергия восстанавливается со временем, но не выше максимума", () => {
    const s = ok(reduce(createInitialState(T0), { type: "taps", count: 100, sinceTs: T0 - 60_000 }, T0));
    expect(Math.round(currentEnergy(s.game, T0 + 50_000))).toBe(ECONOMY.energyBase - 100 + 50);
    expect(currentEnergy(s.game, T0 + 10_000_000)).toBe(energyMax(s.game));
  });
});

describe("ежедневная награда", () => {
  it("серия растёт день за днём и сбрасывается при пропуске", () => {
    let s = createInitialState(T0);
    const day = 86_400_000;
    s = ok(reduce(s, { type: "daily" }, T0));
    expect(s.game.balance).toBe(DAILY_REWARDS[0]);
    expect(reduce(s, { type: "daily" }, T0 + 1000).ok).toBe(false);
    s = ok(reduce(s, { type: "daily" }, T0 + day));
    expect(s.game.daily.streak).toBe(2);
    s = ok(reduce(s, { type: "daily" }, T0 + 3 * day));
    expect(s.game.daily.streak).toBe(1);
  });
});

describe("уроки и задания", () => {
  it("уроки открываются по порядку, награду нельзя получить дважды", () => {
    let s = ok(reduce(createInitialState(T0), { type: "onboard" }, T0));
    expect(reduce(s, { type: "lesson", id: "lesson-2" }, T0)).toEqual({ ok: false, error: "locked" });
    expect(reduce(s, { type: "task", id: "lesson-1" }, T0)).toEqual({ ok: false, error: "not_eligible" });
    s = ok(reduce(s, { type: "lesson", id: "lesson-1" }, T0));
    s = ok(reduce(s, { type: "task", id: "lesson-1" }, T0));
    expect(s.game.balance).toBe(TASK_REWARDS["lesson-1"]);
    expect(reduce(s, { type: "task", id: "lesson-1" }, T0)).toEqual({ ok: false, error: "already_claimed" });
  });

  it("после 3-го урока открывается бонус-эфир", () => {
    let s = ok(reduce(createInitialState(T0), { type: "onboard" }, T0));
    for (const id of ["lesson-1", "lesson-2", "lesson-3"]) s = ok(reduce(s, { type: "lesson", id }, T0));
    expect(s.progress.owned).toContain("bonus-hormones");
  });
});

describe("магазин", () => {
  const rich = (): UserState => {
    const s = createInitialState(T0);
    return { ...s, game: { ...s.game, balance: 200_000 } };
  };

  it("гайд покупается за пёрышки по цене каталога", () => {
    const s = ok(reduce(rich(), { type: "buyFeathers", itemId: "guide-desserts" }, T0));
    expect(s.progress.owned).toContain("guide-desserts");
    expect(s.game.balance).toBe(200_000 - 6000);
    expect(reduce(s, { type: "buyFeathers", itemId: "guide-desserts" }, T0)).toEqual({ ok: false, error: "already_owned" });
    expect(reduce(s, { type: "buyFeathers", itemId: "system" }, T0)).toEqual({ ok: false, error: "bad_request" });
  });

  it("скидка пёрышками ограничена 30% цены и сгорает после оплаты", () => {
    let s = ok(reduce(rich(), { type: "discount", productId: "system", rub: 1000 }, T0));
    expect(finalPrice(s, "system", 5690)).toBe(4690);
    expect(reduce(s, { type: "discount", productId: "system", rub: 1000 }, T0)).toEqual({ ok: false, error: "discount_limit" });
    s = grantPurchase(s, "system", T0);
    expect(s.progress.owned).toEqual(expect.arrayContaining(["system", "guide-system", "guide-pelvic"]));
    expect(s.progress.coupons.system).toBeUndefined();
  });
});

describe("валидация сохранённого состояния", () => {
  it("мусор превращается в начальное состояние", () => {
    expect(parseUserState("hack", T0).game.balance).toBe(0);
    expect(parseUserState({ version: 1, game: { balance: -5, boosts: { tap: 999 } } }, T0).game).toMatchObject({ balance: 0, boosts: { tap: ECONOMY.maxBoostLevel } });
  });
});
