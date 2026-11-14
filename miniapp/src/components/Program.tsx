/** Общие блоки онлайн-программы: этапы, что входит, форматы, «Не знаете, что выбрать?» */
import { catalogById, minPriceRub } from "../../shared/catalog.ts";
import { INCLUDED, PROGRAM_FORMATS, STAGES } from "../content/program";
import { REVIEWS } from "../content/brand";
import { useUserState } from "../store/appStore";
import { rub } from "../lib/format";
import { navigate } from "../lib/router";
import { IconChevron } from "./Icons";
import { Img } from "./ui";

/** Минимальная цена программы — «от …» */
export const programMinPrice = () => Math.min(...PROGRAM_FORMATS.map((f) => minPriceRub(catalogById.get(f.id)!)));

export function Stages() {
  return (
    <div className="steps">
      {STAGES.map((st, i) => (
        <div className="step" key={st.days}>
          <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <span className="muted small" style={{ fontWeight: 700, display: "block", marginBottom: 2 }}>{st.days}</span>
            <b>{st.title}</b>
            <p>{st.text}</p>
            <span className="chip chip--lime" style={{ marginTop: 10 }}>✓ {st.result}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Included() {
  return (
    <div className="guide-grid">
      {INCLUDED.map((x) => (
        <div className="card" key={x.title} style={{ padding: 16 }}>
          <div style={{ fontSize: 26 }}>{x.icon}</div>
          <b style={{ display: "block", margin: "8px 0 4px" }}>{x.title}</b>
          <span className="muted small" style={{ display: "block", lineHeight: 1.45 }}>{x.text}</span>
        </div>
      ))}
    </div>
  );
}

export function Proof() {
  const review = REVIEWS[0]!;
  return (
    <>
      <div className="stats-row">
        <div className="stat"><b>2 400+</b><span>учениц прошли систему</span></div>
        <div className="stat"><b>−6,8</b><span>кг в среднем за 31 день</span></div>
        <div className="stat"><b>87%</b><span>удержали вес через полгода</span></div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="review__head">
          <Img src={review.photo} alt={review.name} />
          <div className="grow">
            <b>{review.name}, {review.age}</b>
            <div className="muted small">{review.city}</div>
          </div>
        </div>
        <span className="chip" style={{ marginBottom: 10 }}>{review.result}</span>
        <p className="muted small" style={{ lineHeight: 1.55 }}>«{review.text}»</p>
      </div>
    </>
  );
}

export function FormatCards() {
  const s = useUserState();
  const rec = s.progress.quizResults["format"];
  return (
    <div className="stack" style={{ gap: 14 }}>
      {PROGRAM_FORMATS.map((f) => {
        const item = catalogById.get(f.id)!;
        return (
          <button key={f.id} className={`format-card format-card--${f.tone} grain`} onClick={() => navigate({ name: "product", id: f.id })}>
            <div className="format-card__head">
              <span className="format-card__icon">{f.icon}</span>
              <div className="grow">
                <b className="h3" style={{ display: "block" }}>{f.title}</b>
                {rec === f.id && <span className="chip" style={{ marginTop: 6 }}>Ваш формат</span>}
              </div>
              <IconChevron width={20} />
            </div>
            <p className="muted small" style={{ lineHeight: 1.5 }}>{f.forWhom}</p>
            <ul>
              {f.includes.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <div className="plan-mini">
              {item.plans.map((p) => (
                <span key={p.id}>
                  <b>{rub(p.priceRub)}</b>
                  {p.label}
                </span>
              ))}
            </div>
            <div className="format-card__price">
              <span className="small" style={{ fontWeight: 700 }}>Стоимость</span>
              <span>
                <span className="small">{item.plans.length > 1 ? "от " : ""}</span>
                <b>{rub(minPriceRub(item))}</b>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** «Не знаете, что выбрать?» — белая карточка с тестом */
export function NotSure() {
  return (
    <button className="card card--pressable row" style={{ textAlign: "left", width: "100%", padding: 18 }} onClick={() => navigate({ name: "quiz", id: "format" })}>
      <span className="task__icon">🎯</span>
      <div className="grow">
        <b className="h3" style={{ display: "block" }}>Не знаете, что выбрать?</b>
        <div className="muted small" style={{ marginTop: 4 }}>6 вопросов — и Алёна подскажет формат</div>
      </div>
      <IconChevron width={20} />
    </button>
  );
}
