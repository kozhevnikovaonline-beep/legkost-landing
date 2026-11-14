import { describe, expect, it } from "vitest";
import { signInitData, validateInitData } from "../server/src/telegramAuth.ts";

const TOKEN = "123456:TEST-token";
const now = Date.parse("2026-11-14T09:00:00Z");
const fields = {
  auth_date: String(Math.floor(now / 1000) - 60),
  query_id: "AAE",
  user: JSON.stringify({ id: 42, first_name: "Ирина", username: "irina" }),
  start_param: "ref_7",
};

describe("validateInitData", () => {
  it("принимает корректную подпись", () => {
    const r = validateInitData(signInitData(fields, TOKEN), TOKEN, 86_400, now);
    expect(r.ok && r.user.id).toBe(42);
    expect(r.ok && r.startParam).toBe("ref_7");
  });

  it("отклоняет подделку данных", () => {
    const tampered = signInitData(fields, TOKEN).replace("42", "43");
    expect(validateInitData(tampered, TOKEN, 86_400, now)).toEqual({ ok: false, reason: "bad_hash" });
  });

  it("отклоняет подпись чужим токеном", () => {
    expect(validateInitData(signInitData(fields, "999:other"), TOKEN, 86_400, now).ok).toBe(false);
  });

  it("отклоняет устаревшие данные", () => {
    const old = signInitData({ ...fields, auth_date: String(Math.floor(now / 1000) - 200_000) }, TOKEN);
    expect(validateInitData(old, TOKEN, 86_400, now)).toEqual({ ok: false, reason: "expired" });
  });

  it("отклоняет пустой initData", () => {
    expect(validateInitData("", TOKEN)).toEqual({ ok: false, reason: "missing" });
  });
});
