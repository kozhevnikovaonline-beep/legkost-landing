import { isLessonUnlocked } from "../../shared/actions.ts";
import { LESSONS } from "../content/lessons";
import { guideById } from "../content/guides";
import { Empty, Img, Progress, SectionHead, TopBar } from "../components/ui";
import { IconChevron, IconLock } from "../components/Icons";
import { useUserState } from "../store/appStore";
import { isOwned, lessonsProgress } from "../store/selectors";
import { navigate } from "../lib/router";
import { Hint } from "../components/Hint";
import { toast } from "../store/toastStore";
import { haptic } from "../telegram/sdk";
import { FREE_LEAD_MAGNET } from "../../shared/catalog.ts";

export function Lessons() {
  const s = useUserState();
  const lp = lessonsProgress(s);
  const bonusOpen = isOwned(s, "bonus-hormones");

  return (
    <main className="screen">
      <TopBar balance={s.game.balance} />
      <SectionHead eyebrow="Бесплатно · 3 видеоурока" title={<>Мини-курс <em>от Алёны</em></>} />
      <p className="muted" style={{ marginTop: -4 }}>За 3 вечера вы поймёте, почему вес стоит, соберёте сытную тарелку и сделаете первую тренировку дома.</p>

      {lp.done === lp.total && (
        <button className="card card--ink grain card--pressable row" style={{ textAlign: "left", width: "100%", marginTop: 16 }} onClick={() => navigate({ name: "next" })}>
          <span style={{ fontSize: 30 }}>🏆</span>
          <div className="grow">
            <div className="eyebrow" style={{ marginBottom: 4 }}>Мини-курс пройден</div>
            <b className="h3">А что дальше? Онлайн-программа на 31 день</b>
          </div>
          <IconChevron width={20} />
        </button>
      )}

      <div className="card has-hint" style={{ marginTop: 16 }}>
        <Hint title="Как проходят уроки" text="Уроки открываются по очереди: следующий станет доступен, когда вы отметите предыдущий пройденным. Закрытые уроки показаны бледными. За каждый урок — 1 000 лепестков." />
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <b>Ваш прогресс</b>
          <span className="chip">{lp.done} из {lp.total}</span>
        </div>
        <Progress value={lp.done / lp.total} />
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        {LESSONS.map((l) => {
          const unlocked = isLessonUnlocked(s, l.id);
          const done = s.progress.lessonsCompleted.includes(l.id);
          const current = unlocked && !done;
          return (
            <button
              key={l.id}
              className={`card card--pressable lesson-card${unlocked ? "" : " lesson-card--locked"}${current ? " lesson-card--current" : ""}`}
              style={{ textAlign: "left" }}
              aria-disabled={!unlocked}
              onClick={() => {
                if (unlocked) return navigate({ name: "lesson", id: l.id });
                haptic.warning();
                toast.info(`Урок ${l.number} откроется после урока ${l.number - 1}`);
              }}
              aria-label={`Урок ${l.number}: ${l.title}${done ? ", пройден" : unlocked ? "" : ", закрыт"}`}
            >
              <div className="lesson-card__thumb">
                <Img src={l.cover} alt="" />
                <span className="lesson-card__num">{l.number}</span>
                {(done || !unlocked) && <span className="lesson-card__state">{done ? "✅" : <IconLock width={24} color="#fff" />}</span>}
              </div>
              <div className="grow">
                <div className="row" style={{ gap: 8 }}>
                  <span className="muted small" style={{ fontWeight: 700 }}>Урок {l.number} · {l.duration}</span>
                  {current && <span className="chip chip--lime" style={{ padding: "3px 8px" }}>Сейчас</span>}
                </div>
                <div style={{ fontWeight: 800, lineHeight: 1.25, margin: "2px 0 4px" }}>{l.title}</div>
                <div className="muted small" style={{ lineHeight: 1.4 }}>{unlocked ? l.summary : `Откроется после урока ${l.number - 1}`}</div>
              </div>
              <IconChevron width={18} style={{ color: "var(--text-3)", flex: "none" }} />
            </button>
          );
        })}

        <button
          className={`card bonus-card card--pressable${bonusOpen ? "" : " lesson-card--locked"}`}
          style={{ textAlign: "left" }}
          onClick={() => (bonusOpen ? navigate({ name: "guide", id: "bonus-hormones" }) : undefined)}
          disabled={!bonusOpen}
        >
          <span style={{ fontSize: 30 }}>{bonusOpen ? "🎁" : "🔒"}</span>
          <div className="grow">
            <b>Бонус-эфир «Питание при гормональных сбоях»</b>
            <div className="muted small">{bonusOpen ? "Открыт — смотрите конспект" : "Откроется после 3-го урока"}</div>
          </div>
        </button>
      </div>

      <section className="section">
        <SectionHead eyebrow="Материалы к урокам" title="Забирайте себе" />
        {s.progress.onboarded ? (
          <div className="stack">
            {FREE_LEAD_MAGNET.map((id) => {
              const g = guideById(id)!;
              return (
                <button key={id} className="card card--pressable row" style={{ textAlign: "left" }} onClick={() => navigate({ name: "guide", id })}>
                  <span className="task__icon">{g.emoji}</span>
                  <div className="grow">
                    <b>{g.title}</b>
                    <div className="muted small">{g.subtitle}</div>
                  </div>
                  <IconChevron width={18} />
                </button>
              );
            })}
          </div>
        ) : (
          <Empty icon="🎁" title="Материалы откроются после старта" text="Пройдите приветствие, чтобы получить подарки." />
        )}
      </section>
    </main>
  );
}
