# Админка со сквозной аналитикой «ЛЁГКОСТЬ · Аналитика» — шаг 1: структура и типы

Статус: структура согласована. Шаг 2 (генератор, `metrics.ts`, тесты) готов — репозиторий https://github.com/kozhevnikovaonline-beep/legkost-analytics, локально — папка `legkost-analytics/` (в .gitignore этого репозитория).

## Решения

| Вопрос | Решение |
|---|---|
| Продукты и цены | Как в Mini App (`miniapp/shared/catalog.ts`), без «СИСТЕМЫ» (её убрали из приложения) |
| Репозиторий | Отдельный `legkost-analytics`, деплой на GitHub Pages |
| Вход | Без логина, бейдж «Демо-данные» |
| Палитра | Как в приложении: тёмный градиент первого экрана сайта, розовый `#FF2E8A` / `#DB1068`, салатовый `#C6FF4A`, шрифты Unbounded / Manrope. Сетка и плотность — как в Power BI. Светлая и тёмная темы |
| Устройства | Компьютер (от 1280 px) и планшет; на телефоне — просмотр |
| План/факт | Генерируется: месячный план ≈ факт прошлого месяца +15% |
| Лид | Пользовательница прошла приветствие в Web App (получила доступ к урокам) |
| Воронка | Шаги приложения + **дожимные посты бота** на каждом этапе: где остановилась и какой пост вернул |
| Экспорт XLSX | `exceljs` |

## Продукты (из приложения)

| Категория | Продукт | Цена, ₽ | Рассрочка |
|---|---|---|---|
| Лид-магнит | 3 бесплатных урока + материалы | 0 | — |
| Трипваер | Гайды: ПП-десерты / мышцы тазового дна / осанка / целлюлит / кортизол / меню на 14 дней | 290 / 390 / 390 / 390 / 490 / 590 | — |
| Трипваер | Марафон «Минус отёки за 7 дней» | 990 | — |
| Подписка | Клуб «ЛЁГКОСТЬ» | 990 / мес | — (повторные оплаты каждый месяц) |
| Курс | Плоский живот и осанка / Сушка / Тело после родов и КС / Гормоны и кортизол 40+ | 1 490 / 1 990 / 2 490 / 2 990 | — |
| Курс | Онлайн-программа «Лёгкость», групповой формат | 1 990 / 3 490 / 4 790 (1–3 мес.) | 3 мес. — да |
| Наставничество | Личное сопровождение 1:1 | 7 900 / 12 500 / 18 900 / 26 600 / 40 500 (1–6 мес.) | от 3 мес. — да |

Скидка лепестками — до 20% цены курса или формата: она уменьшает выручку заказа (`Order.discountRub`).

## Воронка и дожимные посты

Шаги:

```
клик (utm) → старт бота → открытие Web App → лид (прошла приветствие)
  → урок 1 → урок 2 → урок 3 → заказ (открыла оплату) → оплата → повторная оплата
```

**Точка остановки** — последний шаг, после которого клиент дальше не пошёл. Для неё бот отправляет серию дожимных постов. Пример сценария (тексты и задержки потом будут в настройках):

| Где остановилась | Пост | Через |
|---|---|---|
| Старт бота, Web App не открыт | «Уроки уже ждут» | 1 ч, 24 ч |
| Лид, урок 1 не пройден | «7 причин, почему вес стоит» | 3 ч, 24 ч |
| Урок 1, урок 2 не пройден | «Тарелка без голода + меню» | 24 ч, 48 ч |
| Урок 2, урок 3 не пройден | «Плоский живот за 20 минут» | 24 ч, 48 ч |
| Урок 3, нет заказа | «Почему трёх уроков мало» → оффер, отзывы, дедлайн скидки лепестками | 2 ч, 24 ч, 72 ч |
| Заказ без оплаты | «Место за вами» / «Помочь с оплатой?» | 30 мин, 24 ч |

Что можно измерить (ограничения Telegram учтены):

- **отправлено / не доставлено / бот заблокирован** — по ответу Bot API (403 = заблокировала);
- **клик по кнопке поста** — кнопка открывает Web App с меткой `startapp=nurture_<id>`;
- **конверсия поста** — клиент перешёл на следующий шаг в течение 72 ч после поста (атрибуция последнему посту);
- «прочитано» Telegram ботам **не отдаёт** — этой метрики не будет.

На странице «Воронка» появится блок «Где остановились»:
- сколько человек застряло на каждом шаге сейчас;
- сколько дожимных постов получили;
- сколько вернулось после каждого поста, с CR поста и временем возврата.

В карточке клиента — хронология с постами.

## Структура папок (`legkost-analytics/`)

```
legkost-analytics/
├─ .github/workflows/pages.yml        сборка + тесты + деплой на GitHub Pages
├─ index.html
├─ vite.config.ts  tsconfig.json  components.json (shadcn)  .env.example (VITE_DATA_SOURCE=mock)
├─ src/
│  ├─ main.tsx
│  ├─ app/            App.tsx, router.tsx (hash-роутинг для Pages), providers.tsx (Query, Theme)
│  ├─ types/
│  │  ├─ domain.ts    User, Touchpoint, Event, Lead, Order, Payment, AdCost, Product, Manager, Nurture*
│  │  ├─ filters.ts   Filters, DatePreset, Attribution, CompareMode
│  │  └─ dto.ts       ответы DataSource: KpiSet, FunnelData, TrafficRow, CohortMatrix, ClientCard…
│  ├─ data/
│  │  ├─ DataSource.ts            интерфейс (контракт для UI)
│  │  ├─ index.ts                 выбор реализации по VITE_DATA_SOURCE
│  │  ├─ mock/
│  │  │  ├─ rng.ts                seed-генератор (mulberry32)
│  │  │  ├─ config.ts             источники: CTR, CPC, конверсии, сезонность, рост
│  │  │  ├─ catalog.ts            продукты = цены из приложения
│  │  │  ├─ generate.ts           180 дней: касания → события → лиды → заказы → оплаты, дожимы
│  │  │  ├─ db.ts                 сгенерированные таблицы в памяти + индексы
│  │  │  └─ MockDataSource.ts     реализация: фильтрует db и считает через lib/metrics
│  │  └─ api/ApiDataSource.ts     заглушка: fetch на REST-эндпоинты (TODO)
│  ├─ lib/
│  │  ├─ metrics.ts       чистые функции формул (CTR, CPC, CPM, CPL, CR, CAC, ROMI, ROAS, ARPU, ARPPU, LTV, Churn…)
│  │  ├─ attribution.ts   первый клик / последний клик / линейная
│  │  ├─ aggregate.ts     группировки по дню/неделе/месяцу, сравнение периодов
│  │  ├─ dates.ts         периоды и пресеты в Europe/Moscow (date-fns)
│  │  ├─ format.ts        Intl: ₽, %, числа, даты
│  │  └─ export.ts        CSV и XLSX (exceljs)
│  ├─ store/
│  │  ├─ filters.ts       Zustand: слайсеры + кросс-фильтры + синхронизация с URL
│  │  ├─ views.ts         сохранённые представления (localStorage)
│  │  └─ theme.ts
│  ├─ hooks/              useKpis, useFunnel, useTraffic… (TanStack Query, ключ = фильтры)
│  ├─ components/
│  │  ├─ ui/              shadcn (button, card, select, popover, calendar, dialog, tabs, tooltip, badge…)
│  │  ├─ layout/          Sidebar, Topbar, PageHeader, ThemeToggle
│  │  ├─ filters/         FilterBar (слайсеры), FilterChips (активные фильтры со сбросом), SavedViews
│  │  ├─ widgets/         KpiCard, ChartCard, DataTable, MetricTooltip (формула), Sparkline, PlanFact, EmptyState, Skeletons
│  │  └─ charts/          echarts-тема (светлая/тёмная), LineBar, Funnel, Heatmap, Donut, Bar — с кликом для кросс-фильтра
│  ├─ pages/
│  │  ├─ Summary/  Marketing/  Funnel/  Sales/  Cohorts/  Clients/  ClientCard/
│  └─ styles/globals.css  (Tailwind + CSS-переменные палитры «Лёгкости»)
├─ tests/
│  ├─ metrics.test.ts      формулы + деление на ноль
│  ├─ attribution.test.ts  три модели на одном пути клиента
│  └─ generator.test.ts    детерминизм seed, объёмы (~15 000 визитов, ~3 000 лидов, ~400 оплат), один убыточный источник
└─ README.md               запуск, архитектура, схема PostgreSQL, эндпоинты, план интеграций
```

## Типы домена (`src/types/domain.ts`)

```ts
export type ID = string;
/** Момент времени в ISO 8601 (UTC). В интерфейсе показывается в Europe/Moscow */
export type ISODateTime = string;
/** Календарный день в Europe/Moscow, YYYY-MM-DD */
export type ISODate = string;
/** Рубли, целое число */
export type Rub = number;

// ── Маркетинг ──────────────────────────────────────────────
export type SourceId = "yandex_direct" | "vk_ads" | "tg_ads" | "tg_seeding" | "organic" | "referral";

export interface Source {
  id: SourceId;
  name: string;            // «Яндекс Директ», «Посевы в TG-каналах»…
  isPaid: boolean;         // органика и рефералы — без расхода
}

export interface Campaign {
  id: ID;
  sourceId: SourceId;
  name: string;
  utmCampaign: string;
  startDate: ISODate;
  endDate: ISODate | null;
}

export interface Ad {
  id: ID;
  campaignId: ID;
  name: string;            // объявление / креатив / пост в канале
  utmContent: string;
}

/** Расход по объявлению за день (выгрузка из рекламных кабинетов) */
export interface AdCost {
  date: ISODate;
  adId: ID;
  impressions: number;
  clicks: number;
  spend: Rub;
}

// ── Пользователи и касания ─────────────────────────────────
export interface User {
  id: ID;
  tgUserId: number;
  firstName: string;
  username: string | null;
  createdAt: ISODateTime;  // первый старт бота
  managerId: ID | null;
  referrerId: ID | null;   // кто пригласил (реферальная программа приложения)
  tags: string[];          // «тип: стресс», «мама», «40+», «VIP»…
  botBlockedAt: ISODateTime | null;
}

export interface Utm {
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
}

/** Касание: клик по рекламе / переход из поста / органика / реферальная ссылка */
export interface Touchpoint {
  id: ID;
  visitorId: ID;           // до старта бота пользователь анонимен
  userId: ID | null;       // проставляется после старта бота
  at: ISODateTime;
  sourceId: SourceId;
  campaignId: ID | null;
  adId: ID | null;
  utm: Utm;
}

// ── События воронки и приложения ───────────────────────────
export type FunnelStep =
  | "click" | "bot_start" | "webapp_open" | "lead"
  | "lesson_1" | "lesson_2" | "lesson_3"
  | "order" | "payment" | "repeat_payment";

/** События с типизированной нагрузкой (дискриминированное объединение) */
export type Event =
  | EventBase<"bot_start", { startParam: string | null }>
  | EventBase<"webapp_open", { startParam: string | null; platform: "ios" | "android" | "tdesktop" | "web" }>
  | EventBase<"onboarded", Record<string, never>>                     // = лид
  | EventBase<"lesson_completed", { lesson: 1 | 2 | 3 }>
  | EventBase<"quiz_completed", { quiz: "type" | "format"; result: string }>
  | EventBase<"guide_unlocked", { productId: ID; paidWith: "petals" | "rub" }>
  | EventBase<"checkout_opened", { orderId: ID }>
  | EventBase<"nurture_clicked", { deliveryId: ID }>
  | EventBase<"bot_blocked", Record<string, never>>;

interface EventBase<T extends string, P> {
  id: ID;
  userId: ID;
  at: ISODateTime;
  type: T;
  payload: P;
}

// ── Лиды, продукты, заказы, оплаты ─────────────────────────
export type LeadStatus = "new" | "warming" | "offer_sent" | "won" | "lost";

export interface Lead {
  id: ID;
  userId: ID;
  createdAt: ISODateTime;
  status: LeadStatus;
  managerId: ID | null;
  lostReason: string | null;
}

export type ProductCategory = "lead_magnet" | "tripwire" | "subscription" | "course" | "mentorship";

export interface PricePlan {
  id: ID;                  // "1m", "3m", "base"
  label: string;           // «3 месяца»
  priceRub: Rub;
  installmentMonths: number | null; // доступна рассрочка на N мес.
}

export interface Product {
  id: ID;                  // как в приложении: "group", "personal", "guide-menu14"…
  name: string;
  category: ProductCategory;
  plans: PricePlan[];
}

export type OrderStatus = "created" | "paid" | "installment" | "refunded" | "cancelled";

export interface Order {
  id: ID;
  userId: ID;
  leadId: ID | null;
  productId: ID;
  planId: ID;
  managerId: ID | null;
  createdAt: ISODateTime;
  listPrice: Rub;
  discountRub: Rub;        // скидка лепестками (до 20%)
  amount: Rub;             // к оплате = listPrice − discountRub
  status: OrderStatus;
  installmentMonths: number | null;
  isRepeat: boolean;       // повторная покупка клиента
}

export type PaymentKind = "full" | "installment" | "subscription" | "refund";

export interface Payment {
  id: ID;
  orderId: ID;
  userId: ID;
  at: ISODateTime;
  amount: Rub;             // возврат — отрицательная сумма
  kind: PaymentKind;
  installmentNo: number | null;
  provider: "yookassa" | "telegram_stars";
}

export interface Manager {
  id: ID;
  name: string;
  role: "curator" | "sales";
  monthlyPlanRub: Rub;
}

// ── Дожимные посты бота ────────────────────────────────────
/** Шаг воронки, на котором клиент остановился и для которого пишется дожим */
export type StallStep = Exclude<FunnelStep, "click" | "payment" | "repeat_payment">;

export interface NurtureMessage {
  id: ID;
  stallStep: StallStep;
  order: number;           // 1-й, 2-й, 3-й пост серии
  delayMinutes: number;    // через сколько после остановки
  title: string;
  cta: "open_app" | "lesson" | "offer" | "pay" | "reviews";
}

export interface NurtureDelivery {
  id: ID;
  messageId: ID;
  userId: ID;
  sentAt: ISODateTime;
  status: "sent" | "failed" | "blocked";
  clickedAt: ISODateTime | null;     // нажала кнопку поста
  convertedAt: ISODateTime | null;   // дошла до следующего шага ≤ 72 ч после поста
}

// ── План ───────────────────────────────────────────────────
export interface PlanTarget {
  month: string;           // "2026-11"
  metric: "revenue" | "leads" | "sales";
  value: number;
}
```

## Фильтры (`src/types/filters.ts`)

```ts
export type DatePreset = "today" | "7d" | "30d" | "90d" | "custom";
export type Attribution = "first_click" | "last_click" | "linear";
export type CompareMode = "previous_period" | "none";

export interface Filters {
  preset: DatePreset;
  from: ISODate;
  to: ISODate;
  compare: CompareMode;
  attribution: Attribution;
  sourceIds: SourceId[];
  campaignIds: ID[];
  adIds: ID[];
  productIds: ID[];
  managerIds: ID[];
  funnelStep: FunnelStep | null;   // кросс-фильтр по клику на шаг воронки
}
```

## Контракт DataSource (`src/data/DataSource.ts`)

```ts
export interface DataSource {
  getFilterOptions(): Promise<FilterOptions>;                 // источники, кампании, продукты, менеджеры
  getKpis(f: Filters): Promise<KpiSet>;                       // значения + прошлый период + спарклайны
  getRevenueSpendSeries(f: Filters): Promise<DailyPoint[]>;   // выручка и расход по дням
  getPlanFact(f: Filters): Promise<PlanFactRow[]>;
  getTopSources(f: Filters): Promise<SourceRomiRow[]>;
  getTrafficTable(f: Filters, level: "source" | "campaign" | "ad"): Promise<TrafficRow[]>;
  getFunnel(f: Filters, by?: "source"): Promise<FunnelData>;  // шаги, CR, потери, время между шагами
  getStalls(f: Filters): Promise<StallReport>;                // где остановились + эффективность дожимов
  getSales(f: Filters): Promise<SalesReport>;                 // gross/net, возвраты, рассрочки, по продуктам
  getManagers(f: Filters): Promise<ManagerRow[]>;
  getCohorts(f: Filters, metric: "retention" | "ltv"): Promise<CohortMatrix>;
  getLeads(f: Filters, adId: ID): Promise<LeadRow[]>;         // drill-down: объявление → лиды
  getClients(f: Filters, q: ClientQuery): Promise<Page<ClientRow>>;
  getClientById(id: ID): Promise<ClientCard | null>;          // касания, события, дожимы, покупки, LTV, теги
}
```

UI знает только этот интерфейс. Чтобы перейти на реальные данные, достаточно `VITE_DATA_SOURCE=api` и реализации `ApiDataSource`: каждый метод соответствует одному REST-эндпоинту (таблица будет в README).
