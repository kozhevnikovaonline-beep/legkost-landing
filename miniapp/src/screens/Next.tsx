/**
 * «Что дальше» — экран после бесплатного мини-курса: почему трёх уроков мало →
 * онлайн-программа «Лёгкость» → этапы → как проходит → результаты → форматы → бонус.
 */
import { catalogById, minPriceRub } from "../../shared/catalog.ts";
import { ECONOMY, maxDiscountRub } from "../../shared/economy.ts";
import { BRAND, PILLARS } from "../content/brand";
import { PROGRAM } from "../content/program";
import { FormatCards, Included, NotSure, Proof, Stages } from "../components/Program";
import { Feather, Img, MainAction, SubBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { useUserState } from "../store/appStore";
import { fmt, rub } from "../lib/format";
import { navigate } from "../lib/router";
import { config } from "../config";
import { openLink } from "../telegram/sdk";

export function Next() {
  const s = useUserState();
  const groupPrice = minPriceRub(catalogById.get("group")!);
  const discountAvailable = Math.min(Math.floor(s.game.balance / ECONOMY.feathersPerRub), maxDiscountRub(groupPrice));

  return (
    <main className="screen screen--sub">
      <SubBar title="Что дальше" />

      <h1 className="h1">
        Почему трёх уроков <em>мало</em>
      </h1>
      <div className="prose" style={{ marginTop: 14 }}>
        <p>
          Три урока дают понимание и первый результат. Но привычки меняются не за три вечера: без плана и поддержки через 2–3 недели большинство возвращается к старому режиму — и вес тоже.
        </p>
      </div>

      <div className="guide-hero" style={{ minHeight: 260, marginTop: 18 }}>
        <Img src={BRAND.heroPhoto} alt="" />
        <span className="chip chip--dark" style={{ alignSelf: "flex-start", marginBottom: 12 }}>31 день · онлайн</span>
        <h2 className="h2">{PROGRAM.title}</h2>
        <p style={{ opacity: 0.88, marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>{PROGRAM.short}</p>
        <button className="btn btn-sm btn-lime" style={{ marginTop: 16, alignSelf: "flex-start" }} onClick={() => navigate({ name: "formats" })}>
          Записаться →
        </button>
      </div>

      <section className="section">
        <div className="eyebrow">Метод «3 опоры»</div>
        <div className="card pillars">
          {PILLARS.map((p) => (
            <div className="pillar" key={p.n}>
              <span className="pillar__n">{p.n}</span>
              <div>
                <b>{p.title}</b>
                <p className="muted small" style={{ marginTop: 2, lineHeight: 1.5 }}>{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Программа на 31 день</div>
        <Stages />
      </section>

      <section className="section">
        <div className="eyebrow">Как проходит обучение</div>
        <Included />
      </section>

      <section className="section">
        <Proof />
      </section>

      <section className="section">
        <div className="eyebrow">Выберите формат</div>
        <FormatCards />
        <div style={{ marginTop: 14 }}>
          <NotSure />
        </div>
      </section>

      <section className="section">
        <div className="card card--fuchsia grain">
          <div className="eyebrow">Бонус выпускнице мини-курса</div>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <Feather size="lg" />
            <div className="grow">
              <b className="h3" style={{ display: "block" }}>Ваши лепестки = скидка</b>
              <p className="muted small" style={{ marginTop: 6, lineHeight: 1.55 }}>
                У вас {fmt(s.game.balance)} лепестков. Обменяйте их на скидку до 20% на любой формат
                {discountAvailable > 0 ? ` — например, до ${rub(discountAvailable)} на групповой формат.` : ". Потапайте — и скидка вырастет."}
              </p>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate({ name: "guide", id: "bonus-hormones" })}>
            🎁 Бонус-эфир про гормоны
          </button>
        </div>
      </section>

      <section className="section">
        <button className="card card--pressable row" style={{ textAlign: "left", width: "100%" }} onClick={() => openLink(config.curatorUrl)}>
          <Img src={BRAND.authorPhoto} alt={BRAND.author} className="avatar" />
          <div className="grow">
            <b>Остались вопросы?</b>
            <div className="muted small" style={{ marginTop: 2 }}>{BRAND.curator}, куратор Алёны, поможет выбрать формат</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      <p className="disclaimer">{BRAND.disclaimer}</p>

      <MainAction text="Записаться на программу" onClick={() => navigate({ name: "formats" })} shine />
    </main>
  );
}
