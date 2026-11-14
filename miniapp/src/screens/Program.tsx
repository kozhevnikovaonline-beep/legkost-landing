/** Описание онлайн-программы «ЛЁГКОСТЬ» с форматами и ценами */
import { BRAND, PILLARS } from "../content/brand";
import { PROGRAM } from "../content/program";
import { FormatCards, Included, NotSure, Proof, Stages, programMinPrice } from "../components/Program";
import { Img, MainAction, SubBar } from "../components/ui";
import { rub } from "../lib/format";
import { navigate } from "../lib/router";

export function Program() {
  return (
    <main className="screen screen--sub">
      <SubBar title="Онлайн-программа" />

      <div className="guide-hero" style={{ minHeight: 240 }}>
        <Img src={BRAND.heroPhoto} alt="" />
        <span className="chip chip--dark" style={{ alignSelf: "flex-start", marginBottom: 12 }}>31 день · от {rub(programMinPrice())}</span>
        <h1 className="h2">{PROGRAM.title}</h1>
        <p style={{ opacity: 0.88, marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>{PROGRAM.short}</p>
      </div>

      <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.6 }}>{PROGRAM.intro}</p>

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
        <div className="eyebrow">Форматы и стоимость</div>
        <FormatCards />
        <div style={{ marginTop: 14 }}>
          <NotSure />
        </div>
      </section>

      <p className="disclaimer">{BRAND.disclaimer}</p>

      <MainAction text="Записаться на программу" onClick={() => navigate({ name: "formats" })} shine />
    </main>
  );
}
