/**
 * Хранение состояния в демо-режиме: localStorage (мгновенно) + Telegram CloudStorage
 * (синхронизация между устройствами пользователя). Побеждает более свежая копия.
 */
import { parseUserState } from "../../shared/validate.ts";
import type { UserState } from "../../shared/types.ts";
import { cloudGet, cloudSet, getUser } from "../telegram/sdk";

const CLOUD_LIMIT = 4096; // лимит значения CloudStorage
const key = () => `legkost_state_v1_${getUser().id}`;

function readLocal(): unknown {
  try {
    const raw = localStorage.getItem(key());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loadState(now = Date.now()): Promise<UserState> {
  const local = readLocal();
  let cloud: unknown = null;
  try {
    const raw = await cloudGet(key());
    cloud = raw ? JSON.parse(raw) : null;
  } catch {
    cloud = null;
  }
  const a = local ? parseUserState(local, now) : null;
  const b = cloud ? parseUserState(cloud, now) : null;
  if (a && b) return a.updatedAt >= b.updatedAt ? a : b;
  return a ?? b ?? parseUserState(null, now);
}

let cloudTimer: ReturnType<typeof setTimeout> | undefined;

export function saveState(state: UserState): void {
  const json = JSON.stringify(state);
  try {
    localStorage.setItem(key(), json);
  } catch {
    /* приватный режим / переполнено — останется CloudStorage */
  }
  // CloudStorage ограничен по частоте запросов — пишем не чаще раза в 3 секунды
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    if (json.length <= CLOUD_LIMIT) void cloudSet(key(), json);
  }, 3000);
}

export function clearState(): void {
  try {
    localStorage.removeItem(key());
  } catch {
    /* ignore */
  }
  void cloudSet(key(), "");
}
