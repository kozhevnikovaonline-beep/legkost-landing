/** Настройки сервера из переменных окружения (см. server/.env.example) */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Простейшая загрузка .env без зависимостей
const envPath = resolve(import.meta.dirname, "../.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1]! in process.env)) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[config] Не задана переменная ${name}. Скопируйте server/.env.example в server/.env и заполните.`);
    process.exit(1);
  }
  return v;
}

export const env = {
  botToken: required("BOT_TOKEN"),
  webAppUrl: required("WEBAPP_URL"),
  port: Number(process.env.PORT ?? 8080),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? new URL(required("WEBAPP_URL")).origin,
  /** Токен платёжного провайдера из BotFather (ЮKassa и др.). Пусто — оплата отключена */
  paymentToken: process.env.PAYMENT_PROVIDER_TOKEN ?? "",
  /** 1 — разрешить демо-оплату (только для тестов!) */
  demoPayments: process.env.DEMO_PAYMENTS === "1",
  dataDir: resolve(import.meta.dirname, "..", process.env.DATA_DIR ?? "data"),
  /** Включить long polling бота (для вебхука выключите и настройте прокси) */
  polling: process.env.BOT_POLLING !== "0",
};
