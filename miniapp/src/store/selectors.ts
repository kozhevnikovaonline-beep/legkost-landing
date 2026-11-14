import { isLessonUnlocked, LESSON_IDS } from "../../shared/actions.ts";
import { dailyStatus, isTaskEligible, TASK_REWARDS, type TaskId } from "../../shared/economy.ts";
import type { UserState } from "../../shared/types.ts";

export const isOwned = (s: UserState, id: string) => s.progress.owned.includes(id);

export function lessonsProgress(s: UserState) {
  const done = LESSON_IDS.filter((l) => s.progress.lessonsCompleted.includes(l)).length;
  const next = LESSON_IDS.find((l) => !s.progress.lessonsCompleted.includes(l) && isLessonUnlocked(s, l)) ?? null;
  return { done, total: LESSON_IDS.length, next };
}

/** Задания, награду за которые можно забрать прямо сейчас */
export function claimableTasks(s: UserState): TaskId[] {
  return (Object.keys(TASK_REWARDS) as TaskId[]).filter(
    (t) => !s.progress.tasksClaimed.includes(t) && isTaskEligible(t, s.progress) && t !== "channel" && t !== "notifications",
  );
}

export function hasDailyReward(s: UserState, now = Date.now()) {
  return !dailyStatus(s.game, now).claimedToday;
}
