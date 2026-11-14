import type { Action, ActionError } from "../../shared/actions.ts";
import type { UserState } from "../../shared/types.ts";

export type { Action, ActionError };

export interface DispatchResponse {
  state: UserState;
  reward?: number;
  accepted?: number;
}

export interface CheckoutResponse {
  /** invoice — ссылка Telegram Payments (openInvoice); url — внешняя оплата; demo — демо-оплата прошла */
  kind: "invoice" | "url" | "demo";
  url?: string;
  state?: UserState;
}

/**
 * Контракт бэкенда. Две реализации:
 *  - mockApi — локально (CloudStorage + localStorage), работает без сервера;
 *  - httpApi — настоящий сервер из папки server/ (VITE_API_URL).
 */
export interface Api {
  readonly mode: "demo" | "server";
  load(startParam: string | null): Promise<UserState>;
  dispatch(action: Action): Promise<DispatchResponse>;
  checkout(productId: string, planId: string): Promise<CheckoutResponse>;
  /** Перечитать состояние (после оплаты через invoice) */
  refresh(): Promise<UserState>;
}

export class ApiError extends Error {
  readonly code: ActionError | "network" | "unauthorized" | "server";
  constructor(code: ApiError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
  }
}
