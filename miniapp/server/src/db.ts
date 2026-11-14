/**
 * Хранилище пользователей: JSON-файл с атомарной записью.
 * Для старта и сотен пользователей этого достаточно; при росте замените
 * реализацию на PostgreSQL/Redis — интерфейс (get/upsert/all) останется тем же.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createInitialState } from "../../shared/economy.ts";
import { parseUserState } from "../../shared/validate.ts";
import type { UserState } from "../../shared/types.ts";

export interface UserRecord {
  id: number;
  firstName: string;
  username?: string;
  createdAt: number;
  lastSeenAt: number;
  lastTapAt: number;
  referredBy?: number;
  state: UserState;
  /** Оплаты: для сверки с провайдером */
  payments: { productId: string; planId: string; amount: number; chargeId: string; at: number }[];
}

export class Db {
  private users = new Map<number, UserRecord>();
  private file: string;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(dir: string) {
    mkdirSync(dir, { recursive: true });
    this.file = join(dir, "users.json");
    if (existsSync(this.file)) {
      const raw = JSON.parse(readFileSync(this.file, "utf8")) as UserRecord[];
      for (const u of raw) this.users.set(u.id, { ...u, state: parseUserState(u.state) });
    }
  }

  get(id: number) {
    return this.users.get(id);
  }

  getOrCreate(id: number, firstName: string, username?: string): { user: UserRecord; created: boolean } {
    const existing = this.users.get(id);
    const now = Date.now();
    if (existing) {
      existing.firstName = firstName;
      existing.username = username;
      existing.lastSeenAt = now;
      return { user: existing, created: false };
    }
    const user: UserRecord = { id, firstName, username, createdAt: now, lastSeenAt: now, lastTapAt: now, state: createInitialState(now), payments: [] };
    this.users.set(id, user);
    this.save();
    return { user, created: true };
  }

  save() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 500);
  }

  flush() {
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify([...this.users.values()]));
    renameSync(tmp, this.file);
  }

  count() {
    return this.users.size;
  }
}
