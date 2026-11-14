/**
 * Telegram-бот: выдача лид-магнита (/start → кнопка Mini App), меню-кнопка,
 * приём оплат (pre_checkout_query / successful_payment). Long polling без зависимостей.
 */
import { grantPurchase } from "../../shared/actions.ts";
import type { Db } from "./db.ts";

type Json = Record<string, unknown>;

export class TelegramApi {
  private token: string;
  constructor(token: string) {
    this.token = token;
  }

  async call<T = unknown>(method: string, body: Json = {}): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!data.ok) throw new Error(`${method}: ${data.description}`);
    return data.result as T;
  }
}

const WELCOME = (name: string) =>
  `Привет, ${name}! 💗 Я Алёна Ветрова.\n\n` +
  `Как обещала — открываю тебе <b>3 бесплатных урока</b>:\n` +
  `▶️ Урок 1. Почему вес стоит: 7 скрытых причин\n` +
  `🍽 Урок 2. Тарелка без голода + меню на 3 дня\n` +
  `💪 Урок 3. Плоский живот: тренировка дома\n\n` +
  `🎁 Внутри ещё гайд «Тарелка», чек-лист отёков и бонус-эфир про гормоны.\n` +
  `А пока смотришь — копи <b>пёрышки</b> и обменивай их на гайды 🪶`;

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

/** Ссылка на Mini App с параметром запуска (deep link) */
function appUrl(base: string, startParam?: string) {
  if (!startParam) return base;
  const u = new URL(base);
  u.searchParams.set("startapp", startParam);
  return u.toString();
}

export async function setupBot(api: TelegramApi, webAppUrl: string) {
  await api.call("setChatMenuButton", { menu_button: { type: "web_app", text: "Уроки", web_app: { url: webAppUrl } } });
  await api.call("setMyCommands", {
    commands: [
      { command: "start", description: "Открыть 3 бесплатных урока" },
      { command: "help", description: "Связаться с куратором" },
    ],
  });
  await api.call("setMyDescription", {
    description: "3 бесплатных урока от Алёны Ветровой: как худеть без диет, голодовок и запретов. Система «ЛЁГКОСТЬ» — питание, движение и образ жизни.",
  });
}

export async function handleUpdate(update: Json, api: TelegramApi, db: Db, webAppUrl: string) {
  const msg = update.message as Json | undefined;

  // Подтверждение перед списанием: проверяем, что продукт существует
  const pcq = update.pre_checkout_query as Json | undefined;
  if (pcq) {
    const payload = String(pcq.invoice_payload ?? "");
    const ok = /^[a-z0-9-]+:[a-z0-9]+:\d+$/.test(payload);
    await api.call("answerPreCheckoutQuery", ok ? { pre_checkout_query_id: pcq.id, ok: true } : { pre_checkout_query_id: pcq.id, ok: false, error_message: "Продукт не найден" });
    return;
  }

  if (!msg) return;
  const chatId = (msg.chat as Json).id as number;
  const from = msg.from as Json | undefined;

  const payment = msg.successful_payment as Json | undefined;
  if (payment) {
    const [productId, planId, userIdStr] = String(payment.invoice_payload).split(":");
    const userId = Number(userIdStr);
    const user = db.get(userId);
    if (user && productId && planId) {
      user.state = grantPurchase(user.state, productId, Date.now());
      user.payments.push({ productId, planId, amount: Number(payment.total_amount) / 100, chargeId: String(payment.telegram_payment_charge_id), at: Date.now() });
      db.save();
    }
    await api.call("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: "Оплата прошла, спасибо! 💗\n\nЯ уже получила вашу заявку и скоро напишу лично. Материалы открыты в приложении → «Профиль» → «Мои материалы».",
      reply_markup: { inline_keyboard: [[{ text: "Открыть приложение", web_app: { url: webAppUrl } }]] },
    });
    return;
  }

  const text = typeof msg.text === "string" ? msg.text : "";
  if (text.startsWith("/start")) {
    const payload = text.split(" ")[1]?.slice(0, 64);
    const name = escapeHtml(String(from?.first_name ?? "красавица"));
    await api.call("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: WELCOME(name),
      reply_markup: {
        inline_keyboard: [
          [{ text: "▶️ Открыть 3 урока бесплатно", web_app: { url: appUrl(webAppUrl, payload && /^[a-z0-9_-]+$/i.test(payload) ? payload : undefined) } }],
        ],
      },
    });
    return;
  }

  if (text.startsWith("/help")) {
    await api.call("sendMessage", { chat_id: chatId, text: "Напишите вопрос прямо сюда — куратор Мария ответит в течение дня 💬" });
    return;
  }

  // Фото тарелки (задание урока 1) и любые сообщения — подтверждаем получение
  if (msg.photo) {
    await api.call("sendMessage", { chat_id: chatId, text: "Получила вашу тарелку! 🍽 Разберу её в ближайшем эфире. А пока — загляните в урок 2 😉" });
  }
}

export async function startPolling(api: TelegramApi, db: Db, webAppUrl: string) {
  let offset = 0;
  await api.call("deleteWebhook", { drop_pending_updates: false });
  console.log("[bot] long polling запущен");
  for (;;) {
    try {
      const updates = await api.call<Json[]>("getUpdates", { offset, timeout: 30, allowed_updates: ["message", "pre_checkout_query"] });
      for (const u of updates) {
        offset = (u.update_id as number) + 1;
        await handleUpdate(u, api, db, webAppUrl).catch((e) => console.error("[bot] update error", e));
      }
    } catch (e) {
      console.error("[bot] polling error", (e as Error).message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
