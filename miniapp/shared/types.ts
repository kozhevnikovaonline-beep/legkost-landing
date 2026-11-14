/**
 * Общие типы клиента и сервера. Сервер импортирует этот файл напрямую
 * (Node ≥ 22.18 умеет запускать .ts без сборки), поэтому здесь — только типы
 * и чистые данные, без зависимостей от браузера.
 */

export type BoostKind = "tap" | "energy" | "regen";

export interface GameState {
  /** Текущий баланс «пёрышек» */
  balance: number;
  /** Сколько заработано за всё время (для уровня) */
  totalEarned: number;
  /** Всего тапов */
  taps: number;
  /** Энергия на момент energyUpdatedAt */
  energy: number;
  energyUpdatedAt: number;
  boosts: Record<BoostKind, number>;
  /** Бесплатные полные восстановления энергии в сутки */
  recharges: { day: string; used: number };
  daily: { lastClaimDay: string | null; streak: number };
}

export interface ProgressState {
  onboarded: boolean;
  /** id завершённых уроков */
  lessonsCompleted: string[];
  /** Отмеченные пункты чек-листов: ключ — id чек-листа, значение — индексы */
  checklists: Record<string, number[]>;
  /** Результаты квизов: id квиза → id результата */
  quizResults: Record<string, string>;
  /** Полученные награды за задания */
  tasksClaimed: string[];
  /** Открытые материалы и купленные продукты */
  owned: string[];
  /** Активированные скидки за пёрышки: id продукта → скидка в ₽ */
  coupons: Record<string, number>;
  /** Сколько друзей пришло по приглашению (считает только сервер) */
  referrals: number;
}

export interface UserState {
  version: 1;
  game: GameState;
  progress: ProgressState;
  updatedAt: number;
}

export interface TelegramUserLite {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}
