import { useState } from "react";
import { isLessonUnlocked } from "../../shared/actions.ts";
import { TASK_REWARDS, type TaskId } from "../../shared/economy.ts";
import { lessonById, LESSONS } from "../content/lessons";
import { guideById } from "../content/guides";
import { Blocks, Checklist } from "../components/Blocks";
import { Empty, Feather, Img, MainAction, SubBar } from "../components/ui";
import { IconChevron, IconPlayFill } from "../components/Icons";
import { appStore, useUserState } from "../store/appStore";
import { toast } from "../store/toastStore";
import { navigate } from "../lib/router";
import { toVideoSource } from "../lib/video";
import { config } from "../config";
import { haptic, openLink } from "../telegram/sdk";

export function Lesson({ id }: { id: string }) {
  const s = useUserState();
  const lesson = lessonById(id);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);

  if (!lesson) {
    return (
      <main className="screen screen--sub">
        <SubBar title="Урок" />
        <Empty icon="🔎" title="Урок не найден" text="Возможно, ссылка устарела." action={<button className="btn btn-primary" onClick={() => navigate({ name: "lessons" })}>Все уроки</button>} />
      </main>
    );
  }

  const unlocked = isLessonUnlocked(s, lesson.id);
  const done = s.progress.lessonsCompleted.includes(lesson.id);
  const next = LESSONS[lesson.number];
  const video = toVideoSource(lesson.videoUrl);

  if (!unlocked) {
    return (
      <main className="screen screen--sub">
        <SubBar title={`Урок ${lesson.number}`} />
        <Empty
          icon="🔒"
          title="Урок пока закрыт"
          text={`Сначала пройдите урок ${lesson.number - 1} — так материал ляжет по порядку.`}
          action={<button className="btn btn-primary" onClick={() => navigate({ name: "lesson", id: LESSONS[lesson.number - 2]!.id }, { replace: true })}>К уроку {lesson.number - 1}</button>}
        />
      </main>
    );
  }

  const complete = async () => {
    setBusy(true);
    try {
      await appStore.dispatch({ type: "lesson", id: lesson.id });
      const { reward } = await appStore.dispatch({ type: "task", id: lesson.id as TaskId });
      haptic.success();
      toast.success(`Урок ${lesson.number} пройден! +${reward} пёрышек`);
      if (lesson.number === LESSONS.length) {
        const r = await appStore.dispatch({ type: "task", id: "all-lessons" });
        toast.success(`Курс пройден! +${r.reward} пёрышек и бонус-эфир 🎁`);
        navigate({ name: "guide", id: "bonus-hormones" }, { replace: true });
      } else if (next) {
        navigate({ name: "lesson", id: next.id }, { replace: true });
      }
    } catch {
      toast.error("Не удалось сохранить прогресс. Попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  };

  const mainText = !done
    ? `Урок пройден · +${TASK_REWARDS[lesson.id]} пёрышек`
    : next
      ? `Дальше: урок ${next.number}`
      : "Подобрать мой формат";
  const mainClick = !done ? complete : next ? () => navigate({ name: "lesson", id: next.id }, { replace: true }) : () => navigate({ name: "quiz", id: "format" });

  return (
    <main className="screen screen--sub">
      <SubBar title={`Урок ${lesson.number} из ${LESSONS.length}`} />

      <div className="lesson-hero">
        {video && playing ? (
          video.kind === "file" ? (
            <video src={video.src} controls autoPlay playsInline />
          ) : (
            <iframe src={video.src} title={lesson.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
          )
        ) : (
          <>
            <Img src={lesson.cover} alt="" />
            {video && (
              <button className="play" onClick={() => setPlaying(true)} aria-label="Смотреть видео">
                <IconPlayFill />
              </button>
            )}
            <div className="lesson-hero__overlay">
              <span className="chip chip--dark" style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                {video ? `Видео · ${lesson.duration}` : `Конспект урока · ${lesson.duration}`}
              </span>
              <h1 className="h2">{lesson.title}</h1>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <Blocks blocks={lesson.blocks} />
      </div>

      {lesson.materials.length > 0 && (
        <section className="section">
          <div className="eyebrow">Материалы урока</div>
          <div className="stack">
            {lesson.materials.map((m) => {
              const g = guideById(m);
              if (!g) return null;
              return (
                <button key={m} className="card card--pressable row" style={{ textAlign: "left" }} onClick={() => navigate({ name: "guide", id: m })}>
                  <span className="task__icon">{g.emoji}</span>
                  <div className="grow">
                    <b>{g.title}</b>
                    <div className="muted small">{g.readMinutes} мин · бесплатно</div>
                  </div>
                  <IconChevron width={18} />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="section">
        <div className="eyebrow">Домашнее задание</div>
        <Checklist id={lesson.homework.id} items={lesson.homework.items} />
        {lesson.id === "lesson-1" && (
          <button className="btn btn-soft btn-block" style={{ marginTop: 10 }} onClick={() => openLink(`https://t.me/${config.botUsername}?start=plate`)}>
            Отправить фото тарелки в бот
          </button>
        )}
      </section>

      {done && (
        <div className="card row" style={{ marginTop: 20 }}>
          <Feather size="lg" />
          <div className="grow small">
            <b>Урок пройден</b>
            <div className="muted">Пёрышки начислены. Можно вернуться к материалам в любое время.</div>
          </div>
        </div>
      )}

      <MainAction text={mainText} onClick={() => void mainClick()} loading={busy} shine={!done} />
    </main>
  );
}
