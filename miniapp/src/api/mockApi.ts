/**
 * Демо-бэкенд: та же бизнес-логика (shared/actions.ts), что и на сервере,
 * но выполняется в браузере. Заменяется на httpApi одной переменной VITE_API_URL.
 */
import { grantPurchase, reduce } from "../../shared/actions.ts";
import { catalogById } from "../../shared/catalog.ts";
import type { UserState } from "../../shared/types.ts";
import { confirmDialog } from "../telegram/sdk";
import { loadState, saveState } from "../storage/stateStorage";
import { ApiError, type Action, type Api, type CheckoutResponse, type DispatchResponse } from "./types";

export function createMockApi(): Api {
  let state: UserState | null = null;
  // Очередь: действия применяются строго по порядку
  let chain: Promise<unknown> = Promise.resolve();
  const queue = <T>(fn: () => Promise<T> | T): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  };

  const current = async () => (state ??= await loadState());

  return {
    mode: "demo",

    load: () =>
      queue(async () => {
        state = await loadState();
        return state;
      }),

    refresh: () => queue(current),

    dispatch: (action: Action) =>
      queue(async (): Promise<DispatchResponse> => {
        const s = await current();
        const r = reduce(s, action, Date.now());
        if (!r.ok) throw new ApiError(r.error);
        state = r.state;
        saveState(state);
        return { state, reward: r.reward, accepted: r.accepted };
      }),

    checkout: (productId: string, planId: string) =>
      queue(async (): Promise<CheckoutResponse> => {
        const item = catalogById.get(productId);
        const plan = item?.plans.find((p) => p.id === planId);
        if (!item || !plan) throw new ApiError("bad_request");
        const ok = await confirmDialog(
          "Демо-режим: настоящая оплата подключается на сервере (ЮKassa / Prodamus / Telegram Stars). Отметить продукт как оплаченный для проверки сценария?",
        );
        if (!ok) throw new ApiError("bad_request", "cancelled");
        const s = await current();
        state = grantPurchase(s, productId, Date.now());
        saveState(state);
        return { kind: "demo", state };
      }),
  };
}
