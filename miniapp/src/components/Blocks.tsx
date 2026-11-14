import type { Block } from "../content/types";
import { appStore, useUserState } from "../store/appStore";
import { haptic } from "../telegram/sdk";
import { IconCheck } from "./Icons";
import { Img } from "./ui";

/** Чек-лист с сохранением прогресса (CloudStorage / сервер) */
export function Checklist({ id, title, items, result }: { id: string; title?: string; items: string[]; result?: { min: number; text: string }[] }) {
  const state = useUserState();
  const checked = new Set(state.progress.checklists[id] ?? []);
  const toggle = (i: number) => {
    haptic.select();
    const next = new Set(checked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    void appStore.run({ type: "checklist", id, items: [...next] });
  };
  const verdict = result ? [...result].reverse().find((r) => checked.size >= r.min) : undefined;
  return (
    <div className="checklist">
      {title && <p className="h3" style={{ marginBottom: 4 }}>{title}</p>}
      {items.map((text, i) => (
        <button key={i} className="check" role="checkbox" aria-checked={checked.has(i)} onClick={() => toggle(i)}>
          <span className="check__box">
            <IconCheck />
          </span>
          <span>{text}</span>
        </button>
      ))}
      {verdict && (
        <div className="check-result" aria-live="polite">
          {result && result.length > 1 ? `Отмечено ${checked.size} из ${items.length}. ` : ""}
          {verdict.text}
        </div>
      )}
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "h":
      return <h3>{b.text}</h3>;
    case "p":
      return <p>{b.text}</p>;
    case "lead":
      return <p className="lead">{b.text}</p>;
    case "list":
      return b.ordered ? (
        <ol>{b.items.map((i, k) => <li key={k}>{i}</li>)}</ol>
      ) : (
        <ul>{b.items.map((i, k) => <li key={k}>{i}</li>)}</ul>
      );
    case "callout":
      return (
        <div className={`callout${b.tone && b.tone !== "pink" ? ` callout--${b.tone}` : ""}`}>
          {b.title && <b>{b.title}</b>}
          <p>{b.text}</p>
        </div>
      );
    case "quote":
      return (
        <blockquote className="quote" style={{ margin: 0 }}>
          <p>{b.text}</p>
          {b.author && <cite>{b.author}</cite>}
        </blockquote>
      );
    case "checklist":
      return <Checklist id={b.id} title={b.title} items={b.items} result={b.result} />;
    case "steps":
      return (
        <div className="steps">
          {b.items.map((s, i) => (
            <div className="step" key={i}>
              <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <b>{s.title}</b>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "meals":
      return (
        <div className="meals">
          <div className="meals__head">
            <b>{b.title}</b>
            {b.total && <span className="chip">{b.total}</span>}
          </div>
          {b.meals.map((m, i) => (
            <div className="meal" key={i}>
              <span className="meal__time">{m.time}</span>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{m.title}</div>
                {m.text && <div className="muted small">{m.text}</div>}
              </div>
              {m.kcal && <span className="meal__kcal">{m.kcal} ккал</span>}
            </div>
          ))}
        </div>
      );
    case "recipe":
      return (
        <div className="recipe stack">
          <div>
            <p className="h3">{b.title}</p>
            {b.meta && <span className="chip" style={{ marginTop: 8 }}>{b.meta}</span>}
          </div>
          <ul>{b.ingredients.map((i, k) => <li key={k}>{i}</li>)}</ul>
          <ol>{b.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
        </div>
      );
    case "exercises":
      return (
        <div className="stack">
          {b.title && <p className="h3">{b.title}</p>}
          {b.items.map((e, i) => (
            <div className="exercise" key={i}>
              <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
              <div className="grow">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                  <b>{e.name}</b>
                  <span className="exercise__dose">{e.dose}</span>
                </div>
                <p className="small" style={{ marginTop: 4 }}>{e.text}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "image":
      return <Img src={b.src} alt={b.alt} />;
    case "divider":
      return <hr style={{ border: 0, borderTop: "1px solid var(--line)", width: "100%" }} />;
  }
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
    </div>
  );
}
