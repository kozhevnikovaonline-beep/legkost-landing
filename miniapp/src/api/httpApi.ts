/**
 * Клиент настоящего бэкенда (папка server/). Каждый запрос подписан initData:
 * сервер проверяет HMAC-подпись Telegram и только после этого узнаёт пользователя.
 */
import { parseUserState } from "../../shared/validate.ts";
import type { UserState } from "../../shared/types.ts";
import { getInitData } from "../telegram/sdk";
import { ApiError, type Action, type Api, type CheckoutResponse, type DispatchResponse } from "./types";

const TIMEOUT_MS = 12_000;

export function createHttpApi(baseUrl: string): Api {
  async function request<T>(path: string, body?: unknown): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Authorization: `tma ${getInitData()}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch {
      throw new ApiError("network", "Нет соединения с сервером");
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 401) throw new ApiError("unauthorized", "Откройте приложение из Telegram");
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* пустой ответ */
    }
    if (!res.ok) {
      const code = (data as { error?: string } | null)?.error;
      throw new ApiError((code as ApiError["code"]) ?? "server");
    }
    return data as T;
  }

  const withState = <T extends { state: unknown }>(r: T) => ({ ...r, state: parseUserState(r.state) });

  return {
    mode: "server",
    load: async (startParam) => parseUserState((await request<{ state: unknown }>(`/api/state${startParam ? `?start=${encodeURIComponent(startParam)}` : ""}`)).state),
    refresh: async () => parseUserState((await request<{ state: unknown }>("/api/state")).state),
    dispatch: async (action: Action): Promise<DispatchResponse> =>
      withState(await request<{ state: unknown; reward?: number; accepted?: number }>("/api/action", action)),
    checkout: async (productId, planId): Promise<CheckoutResponse> => {
      const r = await request<{ kind: CheckoutResponse["kind"]; url?: string; state?: unknown }>("/api/checkout", { productId, planId });
      return { kind: r.kind, url: r.url, state: r.state ? (parseUserState(r.state) as UserState) : undefined };
    },
  };
}
