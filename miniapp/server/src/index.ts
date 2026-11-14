/**
 * Бэкенд Mini App «ЛЁГКОСТЬ». Без внешних зависимостей: Node ≥ 22.18 запускает TypeScript напрямую.
 *   node server/src/index.ts
 *
 * API (все запросы с заголовком Authorization: tma <initData>):
 *   GET  /api/state?start=<start_param>   состояние пользователя (+ учёт реферала)
 *   POST /api/action    { type, ... }      действие (тапы, задания, покупки за лепестки…)
 *   POST /api/checkout  { productId, planId } ссылка на оплату (Telegram Payments)
 *   GET  /health
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { grantPurchase, reduce, finalPrice, type Action } from "../../shared/actions.ts";
import { catalogById } from "../../shared/catalog.ts";
import { REFERRAL_REWARD } from "../../shared/economy.ts";
import { env } from "./config.ts";
import { Db, type UserRecord } from "./db.ts";
import { validateInitData } from "./telegramAuth.ts";
import { setupBot, startPolling, TelegramApi } from "./bot.ts";
import { productTitle } from "./titles.ts";

const db = new Db(env.dataDir);
const tg = new TelegramApi(env.botToken);
const MAX_BODY = 8 * 1024;

/* --- простой лимит частоты: 40 запросов за 10 секунд на пользователя --- */
const hits = new Map<number, number[]>();
function rateLimited(userId: number) {
  const now = Date.now();
  const arr = (hits.get(userId) ?? []).filter((t) => now - t < 10_000);
  arr.push(now);
  hits.set(userId, arr);
  return arr.length > 40;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) throw new Error("too_large");
    chunks.push(c as Buffer);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function auth(req: IncomingMessage) {
  const h = req.headers.authorization ?? "";
  const initData = h.startsWith("tma ") ? h.slice(4) : "";
  return validateInitData(initData, env.botToken);
}

/** Реферал: новая пользовательница пришла по ссылке ref_<id> — награждаем пригласившую */
function applyReferral(user: UserRecord, created: boolean, startParam: string | null) {
  if (!created || !startParam?.startsWith("ref_")) return;
  const refId = Number(startParam.slice(4));
  if (!Number.isInteger(refId) || refId === user.id) return;
  const ref = db.get(refId);
  if (!ref) return;
  user.referredBy = refId;
  const g = ref.state.game;
  ref.state = {
    ...ref.state,
    updatedAt: Date.now(),
    game: { ...g, balance: g.balance + REFERRAL_REWARD, totalEarned: g.totalEarned + REFERRAL_REWARD },
    progress: { ...ref.state.progress, referrals: ref.state.progress.referrals + 1 },
  };
  void tg
    .call("sendMessage", { chat_id: refId, text: `🎉 ${user.firstName} открыла уроки по вашей ссылке! +${REFERRAL_REWARD} лепестков` })
    .catch(() => undefined);
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", env.allowedOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return void res.writeHead(204).end();

  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/health") return send(res, 200, { ok: true, users: db.count() });
  if (!url.pathname.startsWith("/api/")) return send(res, 404, { error: "not_found" });

  const a = auth(req);
  if (!a.ok) return send(res, 401, { error: "unauthorized", reason: a.reason });
  if (rateLimited(a.user.id)) return send(res, 429, { error: "rate_limited" });

  try {
    const { user, created } = db.getOrCreate(a.user.id, a.user.first_name, a.user.username);

    if (req.method === "GET" && url.pathname === "/api/state") {
      applyReferral(user, created, url.searchParams.get("start") ?? a.startParam);
      db.save();
      return send(res, 200, { state: user.state });
    }

    if (req.method === "POST" && url.pathname === "/api/action") {
      const action = (await readBody(req)) as Action;
      if (!action || typeof action !== "object" || typeof action.type !== "string") return send(res, 400, { error: "bad_request" });
      const now = Date.now();
      // Скорость тапов считаем от последней принятой пачки на сервере, а не от времени клиента
      const safe: Action = action.type === "taps" ? { ...action, sinceTs: Math.max(user.lastTapAt, Number(action.sinceTs) || now) } : action;
      const r = reduce(user.state, safe, now);
      if (!r.ok) return send(res, 409, { error: r.error });
      user.state = r.state;
      if (action.type === "taps") user.lastTapAt = now;
      db.save();
      return send(res, 200, { state: user.state, reward: r.reward, accepted: r.accepted });
    }

    if (req.method === "POST" && url.pathname === "/api/checkout") {
      const body = (await readBody(req)) as { productId?: string; planId?: string };
      const item = catalogById.get(String(body.productId));
      const plan = item?.plans.find((p) => p.id === body.planId);
      if (!item || !plan || item.kind === "free") return send(res, 400, { error: "bad_request" });
      if (user.state.progress.owned.includes(item.id)) return send(res, 409, { error: "already_owned" });

      const amount = finalPrice(user.state, item.id, plan.priceRub);
      if (env.paymentToken) {
        const link = await tg.call<string>("createInvoiceLink", {
          title: productTitle(item.id).slice(0, 32),
          description: `${productTitle(item.id)} · ${plan.label}`.slice(0, 255),
          payload: `${item.id}:${plan.id}:${user.id}`,
          provider_token: env.paymentToken,
          currency: "RUB",
          prices: [{ label: plan.label, amount: amount * 100 }],
          need_email: true,
          send_email_to_provider: true,
        });
        return send(res, 200, { kind: "invoice", url: link });
      }
      if (env.demoPayments) {
        user.state = grantPurchase(user.state, item.id, Date.now());
        db.save();
        return send(res, 200, { kind: "demo", state: user.state });
      }
      return send(res, 503, { error: "server", reason: "payments_not_configured" });
    }

    return send(res, 404, { error: "not_found" });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "too_large" || e instanceof SyntaxError) return send(res, 400, { error: "bad_request" });
    console.error("[api]", e);
    return send(res, 500, { error: "server" });
  }
});

server.listen(env.port, () => console.log(`[api] http://localhost:${env.port}`));

setupBot(tg, env.webAppUrl).catch((e) => console.error("[bot] setup", e.message));
if (env.polling) void startPolling(tg, db, env.webAppUrl);

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    db.flush();
    process.exit(0);
  });
}
