/** «Выберите формат» — после кнопки «Записаться на программу» */
import { BRAND } from "../content/brand";
import { FormatCards, NotSure } from "../components/Program";
import { Img, SubBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { config } from "../config";
import { openLink } from "../telegram/sdk";

export function Formats() {
  return (
    <main className="screen screen--sub" style={{ paddingBottom: "calc(var(--safe-bottom) + 40px)" }}>
      <SubBar title="Запись на программу" />
      <div className="eyebrow">Онлайн-программа «Лёгкость»</div>
      <h1 className="h1">
        Выберите <em>формат</em>
      </h1>
      <p className="muted" style={{ marginTop: 10, lineHeight: 1.55 }}>
        Программа одна — 31 день по шагам. Отличается только то, сколько внимания вы получаете от Алёны.
      </p>

      <section className="section">
        <FormatCards />
      </section>

      <section className="section">
        <NotSure />
      </section>

      <section className="section">
        <button className="card card--pressable row" style={{ textAlign: "left", width: "100%" }} onClick={() => openLink(config.curatorUrl)}>
          <Img src={BRAND.authorPhoto} alt={BRAND.author} className="avatar" />
          <div className="grow">
            <b>Остались вопросы?</b>
            <div className="muted small" style={{ marginTop: 2 }}>{BRAND.curator}, куратор Алёны, поможет с выбором</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>
    </main>
  );
}
