import { useEffect } from "react";
import { guideById } from "../content/guides";
import { BRAND } from "../content/brand";
import { productById } from "../content/products";
import { Blocks } from "../components/Blocks";
import { Empty, Img, SubBar } from "../components/ui";
import { useUserState } from "../store/appStore";
import { isOwned } from "../store/selectors";
import { navigate } from "../lib/router";

export function Guide({ id }: { id: string }) {
  const s = useUserState();
  const g = guideById(id);
  const owned = isOwned(s, id);

  useEffect(() => {
    // Закрытый платный гайд — показываем карточку продукта вместо содержимого
    if (g && !owned && productById(id)) navigate({ name: "product", id }, { replace: true });
  }, [g, owned, id]);

  if (!g) {
    return (
      <main className="screen screen--sub">
        <SubBar title="Гайд" />
        <Empty icon="📘" title="Гайд не найден" text="Возможно, ссылка устарела." action={<button className="btn btn-primary" onClick={() => navigate({ name: "materials" })}>Мои материалы</button>} />
      </main>
    );
  }

  if (!owned) {
    return (
      <main className="screen screen--sub">
        <SubBar title={g.title} />
        <Empty
          icon="🔒"
          title="Материал пока закрыт"
          text={id === "bonus-hormones" ? "Бонус откроется после прохождения всех 3 уроков." : "Он откроется после приветствия в приложении."}
          action={<button className="btn btn-primary" onClick={() => navigate({ name: "lessons" })}>К урокам</button>}
        />
      </main>
    );
  }

  return (
    <main className="screen screen--sub" style={{ paddingBottom: "calc(var(--safe-bottom) + 40px)" }}>
      <SubBar title={g.title} />
      <div className="guide-hero">
        <Img src={g.cover} alt="" />
        <span className="chip chip--dark" style={{ alignSelf: "flex-start", marginBottom: 10 }}>
          {g.emoji} Гайд · {g.readMinutes} мин
        </span>
        <h1 className="h2">{g.title}</h1>
        <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>{g.subtitle}</p>
      </div>
      <div style={{ marginTop: 22 }}>
        <Blocks blocks={g.blocks} />
      </div>
      <div className="card row" style={{ marginTop: 28 }}>
        <Img src={BRAND.authorPhoto} alt={BRAND.author} className="avatar" />
        <div className="grow small">
          <span className="hand" style={{ fontSize: 26 }}>С любовью, Алёна</span>
          <div className="muted">Есть вопрос по гайду? Напишите куратору — ответим в течение дня.</div>
        </div>
      </div>
      <p className="disclaimer">{BRAND.disclaimer}</p>
    </main>
  );
}
