import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
}

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(kind: Toast["kind"], text: string, ttl = 2800) {
  const t = { id: ++seq, kind, text };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, ttl);
}

export const toast = {
  success: (text: string) => push("success", text),
  error: (text: string) => push("error", text, 3600),
  info: (text: string) => push("info", text),
};

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
  );
}
