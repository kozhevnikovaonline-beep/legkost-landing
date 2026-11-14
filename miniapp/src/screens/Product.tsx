import { useState } from "react";
import { Hint } from "../components/Hint";
import { finalPrice } from "../../shared/actions.ts";
import { catalogById, minPriceRub, BUNDLES } from "../../shared/catalog.ts";
import { ECONOMY, maxDiscountRub } from "../../shared/economy.ts";
import { productById } from "../content/products";
import { guideById } from "../content/guides";
import { BRAND } from "../content/brand";
import { Empty, Feather, Img, MainAction, Sheet, SubBar } from "../components/ui";
import { IconCheck } from "../components/Icons";
import { appStore, useUserState } from "../store/appStore";
import { isOwned } from "../store/selectors";
import { fmt, rub } from "../lib/format";
import { navigate } from "../lib/router";
import { config, isDemoBackend } from "../config";
import { haptic, openLink } from "../telegram/sdk";

export function Product({ id }: { id: string }) {
  const s = useUserState();
  const p = productById(id);
  const item = catalogById.get(id);
  const [planId, setPlanId] = useState(item?.plans[0]?.id ?? "base");
  const [busy, setBusy] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);

  if (!p || !item) {
    return (
      <main className="screen screen--sub">
        <SubBar title="Магазин" />
        <Empty icon="🛍" title="Продукт не найден" text="Возможно, он больше не продаётся." action={<button className="btn btn-primary" onClick={() => navigate({ name: "shop" })}>В магазин</button>} />
      </main>
    );
  }

  const owned = isOwned(s, id);
  const plan = item.plans.find((x) => x.id === planId) ?? item.plans[0]!;
  const price = finalPrice(s, id, plan.priceRub);
  const coupon = s.progress.coupons[id] ?? 0;
  const isGuide = item.kind === "guide";
  const featherPrice = item.priceFeathers ?? 0;
  const bundle = BUNDLES[id]?.map((g) => guideById(g)?.title).filter(Boolean) ?? [];

  const buyWithFeathers = async () => {
    setBusy(true);
    const ok = await appStore.run({ type: "buyFeathers", itemId: id }, () => "Гайд открыт! Приятного чтения 💗");
    if (ok) {
      await appStore.dispatch({ type: "task", id: "first-guide" }).catch(() => undefined);
      navigate({ name: "guide", id }, { replace: true });
    }
    setBusy(false);
  };

  const pay = async () => {
    setBusy(true);
    const ok = await appStore.checkout(id, plan.id);
    setBusy(false);
    if (ok && p.guideId) navigate({ name: "guide", id: p.guideId }, { replace: true });
  };

  let main: { text: string; onClick: () => void; disabled?: boolean } | null;
  if (owned) {
    main = p.guideId
      ? { text: "Открыть гайд", onClick: () => navigate({ name: "guide", id: p.guideId! }) }
      : { text: "Написать куратору", onClick: () => openLink(config.curatorUrl) };
  } else if (isGuide) {
    main =
      s.game.balance >= featherPrice
        ? { text: `Открыть за ${fmt(featherPrice)} лепестков`, onClick: () => void buyWithFeathers() }
        : { text: `Купить за ${rub(price)}`, onClick: () => void pay() };
  } else {
    main = { text: `Оплатить ${rub(price)}`, onClick: () => void pay() };
  }

  return (
    <main className="screen screen--sub">
      <SubBar title={p.category === "guides" ? "Гайд" : "Продукт"} />

      <div className="guide-hero">
        <Img src={p.cover} alt="" />
        {p.badge && <span className="chip chip--dark" style={{ alignSelf: "flex-start", marginBottom: 10 }}>{p.badge}</span>}
        <h1 className="h2">{p.title}</h1>
        <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>{p.short}</p>
      </div>

      <section className="section stack">
        <div className="card">
          <div className="eyebrow">Кому подойдёт</div>
          <p>{p.forWhom}</p>
        </div>
        <div className="card stack">
          <div className="eyebrow" style={{ marginBottom: 0 }}>Что внутри</div>
          {p.includes.map((i) => (
            <div className="include" key={i}>
              <IconCheck />
              <span>{i}</span>
            </div>
          ))}
          {bundle.length > 0 && <p className="small muted">После оплаты сразу откроются гайды: {bundle.join(", ")}.</p>}
        </div>
      </section>

      {!owned && item.plans.length > 1 && (
        <section className="section">
          <div className="eyebrow">Выберите срок</div>
          <div className="plan-list" role="radiogroup">
            {item.plans.map((pl) => (
              <button key={pl.id} className="plan" role="radio" aria-checked={pl.id === planId} onClick={() => { haptic.select(); setPlanId(pl.id); }}>
                <span className="row">
                  <span className="plan__radio" />
                  <b>{pl.label}</b>
                </span>
                <span className="price">
                  <b style={{ fontSize: 18 }}>{rub(finalPrice(s, id, pl.priceRub))}</b>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!owned && (
        <section className="section">
          <div className="card stack has-hint">
            <Hint title="Цена и скидка" text="Лепестки можно обменять на скидку: 100 лепестков = 1 ₽, максимум 30% цены. Гайды можно открыть целиком за лепестки или купить за рубли." />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">Цена</span>
              <span className="price">
                <b>{rub(price)}</b>
                {price < plan.priceRub && <s>{rub(plan.priceRub)}</s>}
              </span>
            </div>
            {isGuide ? (
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="muted">или за лепестки</span>
                <span className="chip"><Feather /> {fmt(featherPrice)}</span>
              </div>
            ) : (
              <button className="btn btn-soft btn-block" onClick={() => setDiscountOpen(true)}>
                <Feather /> {coupon > 0 ? `Скидка ${rub(coupon)} активна · увеличить` : "Обменять лепестки на скидку"}
              </button>
            )}
            {isGuide && s.game.balance < featherPrice && (
              <p className="small muted">
                Не хватает {fmt(featherPrice - s.game.balance)} лепестков.{" "}
                <button className="link-btn" onClick={() => navigate({ name: "tap" })}>Натапать →</button>
              </p>
            )}
            <p className="small muted">{p.delivery}.{isDemoBackend ? " Сейчас включена демо-оплата." : ""}</p>
          </div>
        </section>
      )}

      {owned && (
        <div className="card row" style={{ marginTop: 20 }}>
          <span style={{ fontSize: 30 }}>💗</span>
          <div className="grow small">
            <b>У вас уже есть этот продукт</b>
            <div className="muted">Если остались вопросы — {BRAND.curator}, куратор Алёны, ответит в Telegram.</div>
          </div>
        </div>
      )}

      {isGuide && !owned && s.game.balance >= featherPrice && (
        <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => void pay()}>
          Или купить за {rub(price)}
        </button>
      )}

      {main && <MainAction text={main.text} onClick={main.onClick} loading={busy} disabled={main.disabled} shine={!owned} visible={!discountOpen} />}

      <Sheet open={discountOpen} onClose={() => setDiscountOpen(false)} label="Скидка за лепестки">
        <DiscountSheet productId={id} onDone={() => setDiscountOpen(false)} />
      </Sheet>
    </main>
  );
}

function DiscountSheet({ productId, onDone }: { productId: string; onDone: () => void }) {
  const s = useUserState();
  const item = catalogById.get(productId)!;
  const limit = maxDiscountRub(minPriceRub(item));
  const already = s.progress.coupons[productId] ?? 0;
  const affordable = Math.floor(s.game.balance / ECONOMY.feathersPerRub);
  const maxAdd = Math.max(0, Math.min(limit - already, affordable));
  const [rubAmount, setRub] = useState(maxAdd);

  return (
    <div className="discount">
      <div>
        <div className="eyebrow">Скидка за лепестки</div>
        <h2 className="h2">{fmt(ECONOMY.feathersPerRub)} лепестков = 1 ₽</h2>
        <p className="muted small" style={{ marginTop: 6 }}>
          Можно оплатить до 30% цены — до {rub(limit)}. Уже активировано: {rub(already)}.
        </p>
      </div>
      {maxAdd <= 0 ? (
        <div className="card small">
          {already >= limit ? "Максимальная скидка уже активирована 🎉" : "Пока не хватает лепестков даже на 1 ₽ скидки. Потапайте и возвращайтесь!"}
        </div>
      ) : (
        <>
          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">Скидка</span>
              <b className="price"><b>{rub(rubAmount)}</b></b>
            </div>
            <input className="range" type="range" min={1} max={maxAdd} value={rubAmount} onChange={(e) => setRub(Number(e.target.value))} aria-label="Размер скидки" />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">Спишется</span>
              <span className="chip"><Feather /> {fmt(rubAmount * ECONOMY.feathersPerRub)}</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={async () => {
              const ok = await appStore.run({ type: "discount", productId, rub: rubAmount }, () => `Скидка ${rub(rubAmount)} активирована`);
              if (ok) onDone();
            }}
          >
            Активировать скидку
          </button>
        </>
      )}
    </div>
  );
}
