import { useState } from "react";
import { Hint } from "../components/Hint";
import { programMinPrice } from "../components/Program";
import { PROGRAM } from "../content/program";
import { BRAND } from "../content/brand";
import { finalPrice } from "../../shared/actions.ts";
import { catalogById, minPriceRub } from "../../shared/catalog.ts";
import { CATEGORY_TITLES, PRODUCTS, productById, type Product, type ProductCategory } from "../content/products";
import { quizById } from "../content/quizzes";
import { Feather, Img, SectionHead, TopBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { useUserState } from "../store/appStore";
import { isOwned } from "../store/selectors";
import { compact, fmt, rub } from "../lib/format";
import { navigate } from "../lib/router";
import { ECONOMY } from "../../shared/economy.ts";

type Filter = "all" | ProductCategory;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Всё" },
  { id: "guides", label: "Гайды" },
  { id: "courses", label: "Курсы" },
];

export function Shop() {
  const s = useUserState();
  const [filter, setFilter] = useState<Filter>("all");
  const formatRes = s.progress.quizResults["format"];
  const recommended = formatRes ? productById(formatRes) : null;
  const formatQuizResult = quizById("format")!.results.find((r) => r.id === formatRes);

  const show = (c: ProductCategory) => filter === "all" || filter === c;

  return (
    <main className="screen">
      <TopBar balance={s.game.balance} />
      <SectionHead eyebrow="Магазин" title={<>Тратьте <em>лепестки</em> с пользой</>} />

      <div className="card shop-hero has-hint">
        <Hint title="Ваш баланс" text="Лепестки копятся за тапы, уроки, тесты и ежедневные визиты. Гайды можно открыть целиком за лепестки, а на программы — получить скидку до 30%." />
        <Feather size="lg" />
        <div className="grow small">
          <b>{fmt(s.game.balance)} лепестков</b>
          <div className="muted">Гайды — целиком за лепестки. На программы — скидка до 30% ({ECONOMY.feathersPerRub} лепестков = 1 ₽).</div>
        </div>
      </div>

      <div className="tabs-switch" style={{ marginTop: 14 }} role="group" aria-label="Категории">
        {FILTERS.map((f) => (
          <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {recommended && filter === "all" && (
        <section className="section">
          <div className="eyebrow">Рекомендация Алёны для вас</div>
          <ProductCard p={recommended} note={formatQuizResult?.text} />
        </section>
      )}
      {!formatRes && filter !== "guides" && (
        <button className="card card--lime card--pressable row" style={{ textAlign: "left", width: "100%", marginTop: 16, padding: 18 }} onClick={() => navigate({ name: "quiz", id: "format" })}>
          <span className="task__icon">🎯</span>
          <div className="grow">
            <b className="h3">Не знаете, что выбрать?</b>
            <div className="muted small" style={{ marginTop: 2 }}>6 вопросов — и Алёна подскажет формат · +500 лепестков</div>
          </div>
          <IconChevron width={20} />
        </button>
      )}

      {show("guides") && (
        <section className="section">
          <SectionHead title={CATEGORY_TITLES.guides} />
          <div className="guide-grid">
            {PRODUCTS.filter((p) => p.category === "guides").map((p) => {
              const item = catalogById.get(p.id)!;
              const owned = isOwned(s, p.id);
              const canAfford = s.game.balance >= (item.priceFeathers ?? Infinity);
              return (
                <button key={p.id} className="card card--pressable guide-tile" onClick={() => navigate({ name: "product", id: p.id })}>
                  <span className="guide-tile__img">
                    <Img src={p.cover} alt="" />
                    <span className="guide-tile__emoji">{p.emoji}</span>
                  </span>
                  <span className="guide-tile__title">{p.title}</span>
                  <span className="muted small" style={{ lineHeight: 1.35 }}>{p.short}</span>
                  <span style={{ marginTop: "auto" }}>
                    {owned ? (
                      <span className="chip chip--lime">✓ Открыт</span>
                    ) : (
                      <span className={`chip${canAfford ? " chip--lime" : ""}`}>
                        <Feather /> {compact(item.priceFeathers!)} · {rub(item.plans[0]!.priceRub)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {show("courses") && (
        <section className="section">
          <SectionHead title={CATEGORY_TITLES.courses} />
          <div className="stack">
            <ProgramCard />
            {PRODUCTS.filter((p) => p.category === "courses").map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/** Онлайн-программа «Лёгкость» — первая в курсах, открывает описание с форматами */
function ProgramCard() {
  return (
    <button className="card card--pressable product-card" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "program" })}>
      <div className="product-card__img">
        <Img src={BRAND.heroPhoto} alt="" />
        <div className="product-card__badges">
          <span className="chip chip--dark">31 день</span>
        </div>
        <span className="product-card__emoji">🌸</span>
      </div>
      <div className="product-card__body">
        <b className="h3">{PROGRAM.title} за 31 день</b>
        <span className="muted small" style={{ lineHeight: 1.5 }}>Групповой формат или личное сопровождение 1:1</span>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
          <div className="price">
            <span className="muted small">от</span>
            <b>{rub(programMinPrice())}</b>
          </div>
          <span className="btn btn-primary btn-sm">Подробнее</span>
        </div>
      </div>
    </button>
  );
}

function ProductCard({ p, note }: { p: Product; note?: string }) {
  const s = useUserState();
  const item = catalogById.get(p.id)!;
  const base = minPriceRub(item);
  const price = finalPrice(s, p.id, base);
  const owned = isOwned(s, p.id);
  return (
    <button className="card card--pressable product-card" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "product", id: p.id })}>
      <div className="product-card__img">
        <Img src={p.cover} alt="" />
        <div className="product-card__badges">
          {p.badge && <span className="chip chip--dark">{p.badge}</span>}
          {owned && <span className="chip chip--lime">✓ Оплачено</span>}
        </div>
        <span className="product-card__emoji">{p.emoji}</span>
      </div>
      <div className="product-card__body">
        <b className="h3">{p.title}</b>
        <span className="muted small">{note ?? p.short}</span>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="price">
            {item.plans.length > 1 && <span className="muted small">от</span>}
            <b>{rub(price)}</b>
            {price < base && <s>{rub(base)}</s>}
          </div>
          <span className="btn btn-soft btn-sm">Подробнее</span>
        </div>
      </div>
    </button>
  );
}
