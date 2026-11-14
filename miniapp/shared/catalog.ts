/**
 * Цены каталога. Это единый источник для клиента и сервера: сервер берёт цену
 * отсюда, а не из запроса, поэтому подменить её на клиенте нельзя.
 * Описания и тексты продуктов — в src/content/products.ts.
 */

export interface PricePlan {
  id: string;
  label: string;
  priceRub: number;
}

export interface CatalogItem {
  id: string;
  /** free — открывается бесплатно; guide — гайд (₽ или лепестки); paid — только ₽ (лепестки дают скидку) */
  kind: "free" | "guide" | "paid";
  /** Цена в лепестках для покупки целиком (только guide) */
  priceFeathers?: number;
  plans: PricePlan[];
}

const one = (priceRub: number, label = "Доступ навсегда"): PricePlan[] => [{ id: "base", label, priceRub }];

export const CATALOG: CatalogItem[] = [
  // Лид-магнит: открывается после онбординга
  { id: "free-plate", kind: "free", plans: [] },
  { id: "free-menu3", kind: "free", plans: [] },
  { id: "free-edema", kind: "free", plans: [] },
  { id: "bonus-hormones", kind: "free", plans: [] },

  // Гайды
  { id: "guide-desserts", kind: "guide", priceFeathers: 6000, plans: one(290) },
  { id: "guide-pelvic", kind: "guide", priceFeathers: 8000, plans: one(390) },
  { id: "guide-posture", kind: "guide", priceFeathers: 8000, plans: one(390) },
  { id: "guide-cellulite", kind: "guide", priceFeathers: 8000, plans: one(390) },
  { id: "guide-cortisol", kind: "guide", priceFeathers: 10000, plans: one(490) },
  { id: "guide-menu14", kind: "guide", priceFeathers: 12000, plans: one(590) },

  // Платные форматы (лепестки → скидка до 30%)
  { id: "marathon-edema", kind: "paid", plans: one(990, "7 дней") },
  { id: "club", kind: "paid", plans: [{ id: "1m", label: "1 месяц", priceRub: 990 }] },
  { id: "course-abs", kind: "paid", plans: one(1490) },
  { id: "course-dry", kind: "paid", plans: one(1990) },
  { id: "course-postpartum", kind: "paid", plans: one(2490) },
  { id: "course-hormones", kind: "paid", plans: one(2990) },
  {
    id: "group",
    kind: "paid",
    plans: [
      { id: "1m", label: "1 месяц", priceRub: 1990 },
      { id: "2m", label: "2 месяца", priceRub: 3490 },
      { id: "3m", label: "3 месяца", priceRub: 4790 },
    ],
  },
  {
    id: "personal",
    kind: "paid",
    plans: [
      { id: "1m", label: "1 месяц", priceRub: 7900 },
      { id: "2m", label: "2 месяца", priceRub: 12500 },
      { id: "3m", label: "3 месяца", priceRub: 18900 },
      { id: "4m", label: "4 месяца", priceRub: 26600 },
      { id: "6m", label: "6 месяцев", priceRub: 40500 },
    ],
  },
  { id: "system", kind: "paid", plans: one(5690, "31 день") },
];

export const catalogById = new Map(CATALOG.map((i) => [i.id, i]));

/** Минимальная цена продукта — от неё считается лимит скидки лепестками */
export const minPriceRub = (item: CatalogItem) => Math.min(...item.plans.map((p) => p.priceRub));

/** Что входит в продукт: при оплате эти материалы открываются автоматически */
export const BUNDLES: Record<string, string[]> = {
  system: ["guide-posture", "guide-pelvic", "guide-desserts"],
  "course-postpartum": ["guide-pelvic"],
  "course-abs": ["guide-posture"],
  "course-hormones": ["guide-cortisol"],
  "marathon-edema": ["free-edema"],
};

export const FREE_LEAD_MAGNET = ["free-plate", "free-menu3", "free-edema"];
