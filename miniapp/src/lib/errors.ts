import { ApiError } from "../api/types";

const TEXTS: Record<string, string> = {
  not_enough_feathers: "Не хватает пёрышек. Потапайте ещё или выполните задания",
  max_level: "Это максимальный уровень",
  already_claimed: "Награда уже получена",
  no_recharges: "Восстановления на сегодня закончились — завтра будут новые",
  energy_full: "Энергия и так полная",
  unknown_task: "Задание не найдено",
  not_eligible: "Сначала выполните задание",
  already_owned: "Этот материал уже у вас",
  discount_limit: "Пёрышками можно оплатить не больше 30% цены",
  bad_request: "Что-то пошло не так. Попробуйте ещё раз",
  locked: "Сначала завершите предыдущий урок",
  network: "Нет соединения. Проверьте интернет и попробуйте снова",
  unauthorized: "Откройте приложение из Telegram-бота",
  server: "Сервер временно недоступен. Попробуйте через минуту",
};

export function errorText(e: unknown): string {
  if (e instanceof ApiError) return TEXTS[e.code] ?? e.message;
  return TEXTS.server!;
}
