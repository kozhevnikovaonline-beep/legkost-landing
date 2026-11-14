import { GUIDES } from "../content/guides";
import { PRODUCTS } from "../content/products";
import { Empty, SubBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { useUserState } from "../store/appStore";
import { navigate } from "../lib/router";
import { config } from "../config";
import { openLink } from "../telegram/sdk";

export function Materials() {
  const s = useUserState();
  const guides = GUIDES.filter((g) => s.progress.owned.includes(g.id));
  const programs = PRODUCTS.filter((p) => p.category !== "guides" && s.progress.owned.includes(p.id));

  return (
    <main className="screen screen--sub" style={{ paddingBottom: "calc(var(--safe-bottom) + 40px)" }}>
      <SubBar title="Мои материалы" />

      {programs.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div className="eyebrow">Мои программы</div>
          <div className="stack">
            {programs.map((p) => (
              <div key={p.id} className="card row">
                <span className="task__icon">{p.emoji}</span>
                <div className="grow">
                  <b>{p.title}</b>
                  <div className="muted small">{p.delivery}</div>
                </div>
                <button className="btn btn-soft btn-sm" onClick={() => openLink(config.curatorUrl)}>Куратор</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="eyebrow">Гайды и бонусы</div>
      {guides.length === 0 ? (
        <Empty
          icon="📘"
          title="Пока пусто"
          text="Начните с бесплатных уроков — материалы к ним появятся здесь. А гайды можно открыть за лепестки."
          action={<button className="btn btn-primary" onClick={() => navigate({ name: "shop" })}>В магазин</button>}
        />
      ) : (
        <div className="stack">
          {guides.map((g) => (
            <button key={g.id} className="card card--pressable row" style={{ textAlign: "left" }} onClick={() => navigate({ name: "guide", id: g.id })}>
              <span className="task__icon">{g.emoji}</span>
              <div className="grow">
                <b>{g.title}</b>
                <div className="muted small">{g.readMinutes} мин чтения</div>
              </div>
              <IconChevron width={18} />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
