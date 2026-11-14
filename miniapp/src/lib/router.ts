/**
 * Маленький hash-роутер: #/tab или #/screen/param.
 * Hash не требует настроек сервера (GitHub Pages) и не конфликтует
 * с параметрами запуска Telegram (#tgWebAppData=… читается SDK до старта приложения).
 */
import { useSyncExternalStore } from "react";

export type Tab = "home" | "lessons" | "tap" | "shop" | "profile";
export const TABS: Tab[] = ["home", "lessons", "tap", "shop", "profile"];

export type Route =
  | { name: Tab }
  | { name: "lesson"; id: string }
  | { name: "guide"; id: string }
  | { name: "product"; id: string }
  | { name: "quiz"; id: string }
  | { name: "materials" }
  | { name: "author" }
  | { name: "next" };

function parse(hash: string): Route {
  const [, a, b] = hash.replace(/^#/, "").split("/");
  if (a && (TABS as string[]).includes(a)) return { name: a as Tab };
  if (b && (a === "lesson" || a === "guide" || a === "product" || a === "quiz")) return { name: a, id: decodeURIComponent(b) };
  if (a === "materials" || a === "author" || a === "next") return { name: a };
  return { name: "home" };
}

export function toPath(r: Route): string {
  return "id" in r ? `#/${r.name}/${encodeURIComponent(r.id)}` : `#/${r.name}`;
}

let depth = 0; // сколько экранов открыто поверх вкладки — чтобы «Назад» не вывел из приложения
let current = parse(location.hash.startsWith("#/") ? location.hash : "");
const listeners = new Set<() => void>();

window.addEventListener("hashchange", () => {
  current = parse(location.hash);
  listeners.forEach((l) => l());
  window.scrollTo({ top: 0 });
});

export function navigate(r: Route, opts: { replace?: boolean } = {}) {
  const isTab = (TABS as string[]).includes(r.name);
  const path = toPath(r);
  if (opts.replace || isTab) {
    depth = isTab ? 0 : depth;
    history.replaceState(null, "", path);
    current = parse(path);
    listeners.forEach((l) => l());
    window.scrollTo({ top: 0 });
    return;
  }
  depth += 1;
  location.hash = path;
  window.scrollTo({ top: 0 });
}

export function back(fallback: Tab = "home") {
  if (depth > 0) {
    depth -= 1;
    history.back();
  } else {
    navigate({ name: fallback });
  }
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
