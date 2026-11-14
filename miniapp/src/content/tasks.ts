import type { TaskId } from "../../shared/economy.ts";
import type { Route } from "../lib/router";

export interface TaskMeta {
  id: TaskId;
  title: string;
  hint: string;
  emoji: string;
  /** Куда отправить, если условие ещё не выполнено */
  go?: Route;
  /** Внешнее действие (подписка на канал, разрешение уведомлений) */
  external?: "channel" | "notifications";
}

export const TASKS: TaskMeta[] = [
  { id: "welcome", title: "Подарок за старт", hint: "Спасибо, что вы здесь", emoji: "🎀" },
  { id: "lesson-1", title: "Пройти урок 1", hint: "7 скрытых причин", emoji: "▶️", go: { name: "lesson", id: "lesson-1" } },
  { id: "lesson-2", title: "Пройти урок 2", hint: "Тарелка без голода", emoji: "🍽", go: { name: "lesson", id: "lesson-2" } },
  { id: "lesson-3", title: "Пройти урок 3", hint: "Плоский живот дома", emoji: "💪", go: { name: "lesson", id: "lesson-3" } },
  { id: "all-lessons", title: "Пройти все 3 урока", hint: "+ бонус-эфир про гормоны", emoji: "🏆", go: { name: "lessons" } },
  { id: "quiz-type", title: "Узнать свой тип набора веса", hint: "Квиз на 1 минуту", emoji: "🧭", go: { name: "quiz", id: "type" } },
  { id: "quiz-format", title: "Подобрать свой формат", hint: "Группа, 1:1 или «СИСТЕМА»", emoji: "🎯", go: { name: "quiz", id: "format" } },
  { id: "channel", title: "Подписаться на канал Алёны", hint: "Рецепты и эфиры", emoji: "📣", external: "channel" },
  { id: "notifications", title: "Включить напоминания", hint: "Бот напомнит об уроке", emoji: "🔔", external: "notifications" },
  { id: "first-guide", title: "Открыть первый гайд за пёрышки", hint: "Загляните в магазин", emoji: "📘", go: { name: "shop" } },
];
