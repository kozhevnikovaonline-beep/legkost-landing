const nf = new Intl.NumberFormat("ru-RU");

export const fmt = (n: number) => nf.format(Math.floor(n));
export const rub = (n: number) => `${nf.format(Math.round(n))} ₽`;

/** Компактно: 12 500 → 12,5K */
export function compact(n: number): string {
  if (n < 10_000) return fmt(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 100_000 ? 1 : 0).replace(".", ",").replace(",0", "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")}M`;
}

/** Склонение: plural(5, ["пёрышко","пёрышка","пёрышек"]) */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export const feathersWord = (n: number) => plural(n, ["пёрышко", "пёрышка", "пёрышек"]);

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}
