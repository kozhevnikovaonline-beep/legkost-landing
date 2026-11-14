/**
 * Проверка initData Telegram Mini App по официальному алгоритму:
 * secret = HMAC_SHA256(key="WebAppData", data=bot_token)
 * hash   = hex(HMAC_SHA256(key=secret, data=data_check_string))
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { TelegramUserLite } from "../../shared/types.ts";

export type AuthResult =
  | { ok: true; user: TelegramUserLite; startParam: string | null; authDate: number }
  | { ok: false; reason: "missing" | "bad_hash" | "expired" | "no_user" };

export function validateInitData(initData: string, botToken: string, maxAgeSec = 86_400, now = Date.now()): AuthResult {
  if (!initData) return { ok: false, reason: "missing" };
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) return { ok: false, reason: "bad_hash" };
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "bad_hash" };

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || now / 1000 - authDate > maxAgeSec) return { ok: false, reason: "expired" };

  let user: TelegramUserLite | null = null;
  try {
    const u = JSON.parse(params.get("user") ?? "null");
    if (u && Number.isInteger(u.id) && typeof u.first_name === "string") user = u;
  } catch {
    user = null;
  }
  if (!user) return { ok: false, reason: "no_user" };
  return { ok: true, user, startParam: params.get("start_param"), authDate };
}

/** Для тестов: подписать initData так же, как это делает Telegram */
export function signInitData(fields: Record<string, string>, botToken: string): string {
  const dcs = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secret).update(dcs).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}
