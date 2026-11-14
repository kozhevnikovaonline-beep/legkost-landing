/**
 * Глобальное состояние приложения.
 *
 * Модель «сервер + очередь»: на экране показывается подтверждённое состояние,
 * поверх которого применены ещё не подтверждённые действия. Так интерфейс
 * отвечает мгновенно, а при ошибке сервера действие просто откатывается.
 * Тапы копятся в буфере и отправляются пачкой раз в секунду.
 */
import { useSyncExternalStore } from "react";
import { reduce, type Action } from "../../shared/actions.ts";
import { applyTaps } from "../../shared/economy.ts";
import type { UserState } from "../../shared/types.ts";
import { api, ApiError } from "../api";
import { errorText } from "../lib/errors";
import { getStartParam, haptic, openInvoice, openLink } from "../telegram/sdk";
import { toast } from "./toastStore";

type Status = "loading" | "ready" | "error";

interface Snapshot {
  status: Status;
  error: string | null;
  state: UserState | null;
  syncing: boolean;
}

interface Pending {
  id: number;
  action: Action;
}

const TAP_FLUSH_MS = 1000;

class AppStore {
  private server: UserState | null = null;
  private pending: Pending[] = [];
  private tapBuf = 0;
  private lastFlush = Date.now();
  private seq = 0;
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private listeners = new Set<() => void>();
  private snap: Snapshot = { status: "loading", error: null, state: null, syncing: false };

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  getSnapshot = () => this.snap;

  private emit(patch: Partial<Snapshot> = {}) {
    this.snap = { ...this.snap, ...patch, state: this.computeView(), syncing: this.pending.length > 0 };
    this.listeners.forEach((l) => l());
  }

  private computeView(): UserState | null {
    if (!this.server) return null;
    const now = Date.now();
    let s = this.server;
    for (const p of this.pending) {
      const r = reduce(s, p.action, now);
      if (r.ok) s = r.state;
    }
    if (this.tapBuf > 0) s = { ...s, game: applyTaps(s.game, this.tapBuf, now).game };
    return s;
  }

  async init() {
    this.emit({ status: "loading", error: null });
    try {
      this.server = await api.load(getStartParam());
      this.emit({ status: "ready" });
      this.startFlushLoop();
    } catch (e) {
      this.emit({ status: "error", error: errorText(e) });
    }
  }

  /** Выполнить действие. Возвращает награду (если есть) или бросает ApiError. */
  async dispatch(action: Action): Promise<{ reward?: number }> {
    if (!this.server) throw new ApiError("server");
    // Проверяем локально до отправки: мгновенная ошибка без сетевого запроса
    const view = this.computeView()!;
    const local = reduce(view, action, Date.now());
    if (!local.ok) throw new ApiError(local.error);

    const item: Pending = { id: ++this.seq, action };
    this.pending.push(item);
    this.emit();
    try {
      const res = await api.dispatch(action);
      this.server = res.state;
      return { reward: res.reward };
    } finally {
      this.pending = this.pending.filter((p) => p.id !== item.id);
      this.emit();
    }
  }

  /** То же, что dispatch, но ошибки показываются тостом. */
  async run(action: Action, successText?: (reward?: number) => string): Promise<boolean> {
    try {
      const { reward } = await this.dispatch(action);
      if (successText) {
        haptic.success();
        toast.success(successText(reward));
      }
      return true;
    } catch (e) {
      haptic.error();
      toast.error(errorText(e));
      return false;
    }
  }

  /** Один тап. Возвращает, сколько пёрышек начислено (0 — нет энергии). */
  tap(): number {
    const view = this.computeView();
    if (!view) return 0;
    const r = applyTaps(view.game, 1, Date.now());
    if (r.accepted === 0) return 0;
    this.tapBuf += 1;
    this.emit();
    return r.earned;
  }

  flushTaps = async () => {
    if (this.tapBuf <= 0 || !this.server) return;
    const count = this.tapBuf;
    const sinceTs = this.lastFlush;
    this.tapBuf = 0;
    this.lastFlush = Date.now();
    const item: Pending = { id: ++this.seq, action: { type: "taps", count, sinceTs } };
    this.pending.push(item);
    try {
      const res = await api.dispatch(item.action);
      this.server = res.state;
    } catch {
      // Пачка не принята (сеть/лимит) — тихо откатываем, энергия вернётся в расчёте
    } finally {
      this.pending = this.pending.filter((p) => p.id !== item.id);
      this.emit();
    }
  };

  private startFlushLoop() {
    clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => void this.flushTaps(), TAP_FLUSH_MS);
    const flushNow = () => void this.flushTaps();
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flushNow());
    window.addEventListener("pagehide", flushNow);
  }

  /** Оформление оплаты продукта */
  async checkout(productId: string, planId: string): Promise<boolean> {
    await this.flushTaps();
    try {
      const r = await api.checkout(productId, planId);
      if (r.kind === "demo" && r.state) {
        this.server = r.state;
        this.emit();
        haptic.success();
        toast.success("Готово! Продукт открыт в разделе «Мои материалы»");
        return true;
      }
      if (r.kind === "invoice" && r.url) {
        const status = await openInvoice(r.url);
        if (status === "paid") {
          this.server = await api.refresh();
          this.emit();
          haptic.success();
          toast.success("Оплата прошла! Алёна уже получила вашу заявку 💗");
          return true;
        }
        if (status === "failed") toast.error("Оплата не прошла. Попробуйте ещё раз или напишите куратору");
        return false;
      }
      if (r.kind === "url" && r.url) {
        openLink(r.url);
        return false;
      }
      return false;
    } catch (e) {
      if (e instanceof ApiError && e.message === "cancelled") return false;
      haptic.error();
      toast.error(errorText(e));
      return false;
    }
  }

  /** Принудительно перерисовать (например, для обновления энергии по таймеру) */
  refreshView() {
    this.emit();
  }
}

export const appStore = new AppStore();

export function useApp() {
  return useSyncExternalStore(appStore.subscribe, appStore.getSnapshot);
}

/** Состояние пользователя; использовать только внутри экранов, где status === "ready" */
export function useUserState(): UserState {
  const s = useApp().state;
  if (!s) throw new Error("useUserState вызван до загрузки");
  return s;
}
