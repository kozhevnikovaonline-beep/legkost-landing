import { isLessonUnlocked, LESSON_IDS } from "../../shared/actions.ts";
import { dailyStatus, isTaskEligible, TASK_REWARDS, type TaskId } from "../../shared/economy.ts";
import type { UserState } from "../../shared/types.ts";
import { LESSONS } from "../content/lessons";

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

/** Урок, к которому привязан бесплатный материал (материалы открываются вместе со своим уроком) */
export function materialLesson(id: string): { id: string; number: number } | null {
  const lesson = LESSONS.find((l) => l.materials.includes(id));
  return lesson ? { id: lesson.id, number: lesson.number } : null;
}

/** Бесплатный материал доступен, только когда открыт его урок */
export function isMaterialUnlocked(s: UserState, id: string): boolean {
  const lesson = materialLesson(id);
  return !lesson || (s.progress.onboarded && isLessonUnlocked(s, lesson.id));
}
