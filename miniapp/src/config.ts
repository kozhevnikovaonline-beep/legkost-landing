/** Настройки из переменных окружения (см. .env.example). */

const env = import.meta.env;

const clean = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);

export const config = {
  apiUrl: clean(env.VITE_API_URL, "").replace(/\/$/, ""),
  botUsername: clean(env.VITE_BOT_USERNAME, "legkost_guide_bot").replace(/^@/, ""),
  appShortName: clean(env.VITE_APP_SHORTNAME, "app"),
  channelUrl: clean(env.VITE_CHANNEL_URL, "https://t.me/legkost_vetrova"),
  curatorUrl: clean(env.VITE_CURATOR_URL, "https://t.me/legkost_guide_bot"),
  siteUrl: "https://kozhevnikovaonline-beep.github.io/legkost-landing/",
  privacyUrl: "https://kozhevnikovaonline-beep.github.io/legkost-landing/privacy.html",
} as const;

export const isDemoBackend = !config.apiUrl;

/** Реферальная ссылка: открывает Mini App сразу на весь экран и передаёт id пригласившей */
export function referralLink(userId: number): string {
  return `https://t.me/${config.botUsername}/${config.appShortName}?startapp=ref_${userId}&mode=fullscreen`;
}
