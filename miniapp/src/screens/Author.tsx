import { AUTHOR_QUOTE, AUTHOR_STATS, AUTHOR_STORY, BRAND } from "../content/brand";
import { Img, MainAction, SubBar } from "../components/ui";
import { navigate } from "../lib/router";

export function Author() {
  return (
    <main className="screen screen--sub">
      <SubBar title="Об авторе" />
      <div className="author-photo">
        <Img src={BRAND.authorPhoto} alt={`${BRAND.author} на тренировке`} />
        <span className="hand">Алёна ♥</span>
      </div>
      <div style={{ marginTop: 20 }}>
        <div className="eyebrow">Автор системы</div>
        <h1 className="h1">{BRAND.author}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{BRAND.authorRole}</p>
      </div>
      <div className="prose" style={{ marginTop: 18 }}>
        {AUTHOR_STORY.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <blockquote className="quote" style={{ margin: 0 }}>
          <p>{AUTHOR_QUOTE}</p>
        </blockquote>
      </div>
      <div className="stats-row" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 18 }}>
        {AUTHOR_STATS.map((s) => (
          <div className="stat" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <MainAction text="Подобрать формат работы с Алёной" onClick={() => navigate({ name: "quiz", id: "format" })} />
    </main>
  );
}
