/**
 * Обёртка над Telegram Web Apps API.
 * Вне Telegram (обычный браузер, GitHub Pages) всё продолжает работать:
 * диалоги и ссылки падают на браузерные аналоги, пользователь — демо.
 */
import type { WebApp, WebAppUser } from "./types";

const MOBILE = new Set(["ios", "android", "android_x"]);

export function getWebApp(): WebApp | null {
  const wa = window.Telegram?.WebApp;
  if (!wa) return null;
  // SDK загружается и в обычном браузере, но там нет initData и platform = "unknown"
  if (!wa.initData && wa.platform === "unknown") return null;
  return wa;
}

export const isTelegram = () => getWebApp() !== null;
export const isMobileTelegram = () => MOBILE.has(getWebApp()?.platform ?? "");

/** Подпись initData для бэкенда (заголовок Authorization: tma <initData>) */
export const getInitData = () => getWebApp()?.initData ?? "";

const DEMO_USER: WebAppUser = { id: 0, first_name: "Гостья" };

export function getUser(): WebAppUser {
  return getWebApp()?.initDataUnsafe.user ?? DEMO_USER;
}

/** start_param из ссылки t.me/<bot>/<app>?startapp=... (в браузере — ?startapp=) */
export function getStartParam(): string | null {
  const fromTg = getWebApp()?.initDataUnsafe.start_param;
  if (fromTg) return fromTg;
  const q = new URLSearchParams(window.location.search);
  return q.get("tgWebAppStartParam") ?? q.get("startapp");
}

export type ColorScheme = "dark" | "light";

const BRAND_BG: Record<ColorScheme, string> = { dark: "#0E0B0F", light: "#FFF6F9" };

function applyScheme(scheme: ColorScheme) {
  document.documentElement.dataset.theme = scheme;
  const wa = getWebApp();
  const bg = BRAND_BG[scheme];
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  if (!wa) return;
  try {
    wa.setHeaderColor(bg);
    wa.setBackgroundColor(bg);
    wa.setBottomBarColor?.(bg);
  } catch {
    /* старые клиенты принимают только ключи bg_color/secondary_bg_color — не критично */
  }
}

/**
 * Инициализация: сообщаем Telegram о готовности, раскрываем на весь экран,
 * отключаем свайп-закрытие (мешает тапалке), синхронизируем тему.
 */
export function initTelegram(): void {
  const wa = getWebApp();
  if (!wa) {
    applyScheme(window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.classList.add("is-browser");
    return;
  }
  document.documentElement.classList.add("is-telegram", `tg-${wa.platform}`);
  wa.ready();
  wa.expand();
  if (wa.isVersionAtLeast("8.0") && MOBILE.has(wa.platform) && !wa.isFullscreen) {
    try {
      wa.requestFullscreen?.();
    } catch {
      /* fullscreen недоступен — остаёмся в expanded */
    }
  }
  if (wa.isVersionAtLeast("7.7")) wa.disableVerticalSwipes?.();

  const sync = () => {
    applyScheme(wa.colorScheme === "light" ? "light" : "dark");
    document.documentElement.classList.toggle("is-fullscreen", Boolean(wa.isFullscreen));
  };
  sync();
  wa.onEvent("themeChanged", sync);
  wa.onEvent("fullscreenChanged", sync);
}

/* ---------------- Haptics ---------------- */

let hapticsEnabled = localStorage.getItem("legkost:haptics") !== "off";
export const setHapticsEnabled = (on: boolean) => {
  hapticsEnabled = on;
  localStorage.setItem("legkost:haptics", on ? "on" : "off");
};
export const getHapticsEnabled = () => hapticsEnabled;

function hf() {
  const wa = getWebApp();
  return hapticsEnabled && wa?.isVersionAtLeast("6.1") ? wa.HapticFeedback : null;
}
export const haptic = {
  tap: () => hf()?.impactOccurred("light"),
  medium: () => hf()?.impactOccurred("medium"),
  heavy: () => hf()?.impactOccurred("heavy"),
  select: () => hf()?.selectionChanged(),
  success: () => hf()?.notificationOccurred("success"),
  warning: () => hf()?.notificationOccurred("warning"),
  error: () => hf()?.notificationOccurred("error"),
};

/* ---------------- Dialogs ---------------- */

export function confirmDialog(message: string): Promise<boolean> {
  const wa = getWebApp();
  if (wa?.isVersionAtLeast("6.2")) return new Promise((r) => wa.showConfirm(message, (ok) => r(Boolean(ok))));
  return Promise.resolve(window.confirm(message));
}

export function alertDialog(message: string): Promise<void> {
  const wa = getWebApp();
  if (wa?.isVersionAtLeast("6.2")) return new Promise((r) => wa.showAlert(message, () => r()));
  window.alert(message);
  return Promise.resolve();
}

/* ---------------- Links ---------------- */

export function openLink(url: string) {
  const wa = getWebApp();
  if (/^https:\/\/t\.me\//.test(url)) {
    if (wa) return wa.openTelegramLink(url);
  } else if (wa) {
    return wa.openLink(url);
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openInvoice(url: string): Promise<"paid" | "cancelled" | "failed" | "pending"> {
  const wa = getWebApp();
  if (!wa?.isVersionAtLeast("6.1")) {
    openLink(url);
    return Promise.resolve("pending");
  }
  return new Promise((r) => wa.openInvoice(url, r));
}

/** Разрешение боту писать первым — для напоминаний об уроках */
export function requestWriteAccess(): Promise<boolean> {
  const wa = getWebApp();
  if (!wa?.isVersionAtLeast("6.9") || !wa.requestWriteAccess) return Promise.resolve(false);
  return new Promise((r) => wa.requestWriteAccess!((granted) => r(Boolean(granted))));
}

/* ---------------- CloudStorage ---------------- */

export function cloudGet(key: string): Promise<string | null> {
  const wa = getWebApp();
  if (!wa?.isVersionAtLeast("6.9")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), 2500); // CloudStorage иногда не отвечает в десктоп-клиентах
    wa.CloudStorage.getItem(key, (err, value) => {
      clearTimeout(t);
      resolve(err ? null : (value ?? null));
    });
  });
}

export function cloudSet(key: string, value: string): Promise<boolean> {
  const wa = getWebApp();
  if (!wa?.isVersionAtLeast("6.9")) return Promise.resolve(false);
  return new Promise((resolve) => wa.CloudStorage.setItem(key, value, (err) => resolve(!err)));
}
