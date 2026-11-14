import { DAILY_REWARDS, dailyStatus } from "../../shared/economy.ts";
import { BRAND } from "../content/brand";
import { lessonById } from "../content/lessons";
import { quizById } from "../content/quizzes";
import { Feather, Img, Progress, TopBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { appStore, useUserState } from "../store/appStore";
import { claimableTasks, lessonsProgress } from "../store/selectors";
import { fmt, greeting } from "../lib/format";
import { navigate } from "../lib/router";
import { getUser } from "../telegram/sdk";
import { Hint } from "../components/Hint";

export function Home() {
  const s = useUserState();
  const lp = lessonsProgress(s);
  const nextLesson = lp.next ? lessonById(lp.next) : null;
  const daily = dailyStatus(s.game, Date.now());
  const tasks = claimableTasks(s).length;
  const typeResult = s.progress.quizResults["type"];
  const typeQuiz = quizById("type")!;
  const typeRes = typeQuiz.results.find((r) => r.id === typeResult);

  return (
    <main className="screen">
      <TopBar balance={s.game.balance} />

      <section className="hello">
        <div className="muted small">{greeting()},</div>
        <div className="hello__name">{getUser().first_name} 💗</div>
      </section>

      {/* Следующий урок / завершённый курс */}
      {nextLesson ? (
        <button className="hero-card card--pressable" style={{ width: "100%", textAlign: "left", marginTop: 10 }} onClick={() => navigate({ name: "lesson", id: nextLesson.id })}>
          <Img src={nextLesson.cover} alt="" className="hero-card__img" />
          <span className="chip chip--dark" style={{ alignSelf: "flex-start", marginBottom: "auto" }}>
            Бесплатно · урок {nextLesson.number} из 3
          </span>
          <div style={{ marginTop: 60 }}>
            <h2 className="h2">{nextLesson.title}</h2>
            <p style={{ opacity: 0.85, fontSize: 13.5, marginTop: 6 }}>{nextLesson.summary}</p>
            <div className="row" style={{ marginTop: 14 }}>
              <div className="grow">
                <Progress value={lp.done / lp.total} />
              </div>
              <span className="btn btn-primary btn-sm">{lp.done === 0 ? "Начать" : "Продолжить"} →</span>
            </div>
          </div>
        </button>
      ) : (
        <div className="card card--ink grain has-hint" style={{ marginTop: 10 }}>
          <Hint title="Мини-курс" text="Вы прошли все бесплатные уроки. Здесь — следующий шаг: онлайн-программа «ЛЁГКОСТЬ» на 31 день и бонус-эфир про гормоны." />
          <div className="eyebrow">Мини-курс пройден 🏆</div>
          <h2 className="h2">А что <em>дальше?</em></h2>
          <p className="muted" style={{ marginTop: 6 }}>Вы узнали, почему вес стоит, и сделали первые шаги. Теперь важно не остановиться — покажу, как за 31 день дойти до результата.</p>
          <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn btn-sm btn-lime" onClick={() => navigate({ name: "next" })}>
              Что дальше →
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate({ name: "guide", id: "bonus-hormones" })}>
              Бонус-эфир
            </button>
          </div>
        </div>
      )}

      {/* Ежедневная награда: тёмная, пока есть что забрать; белая, когда получена */}
      <section className="section">
        <div className={`card has-hint${daily.claimedToday ? "" : " card--ink grain"}`}>
          <Hint title="Ежедневный подарок" text="Заходите каждый день и забирайте награду. Чем длиннее серия, тем больше: с 100 до 2 500 за 7-й день. Пропустили день — серия начнётся заново." />
          <div className="row">
            <div className="grow">
              <div className="h3">{daily.claimedToday ? "Награда получена ✓" : "Ежедневный подарок"}</div>
              <p className="muted small" style={{ marginTop: 4 }}>
                {daily.claimedToday ? `Серия: ${daily.streak} дн. Возвращайтесь завтра!` : `День ${daily.nextStreak} подряд · +${fmt(daily.reward)} лепестков`}
              </p>
            </div>
            {!daily.claimedToday && (
              <button className="btn btn-sm btn-lime" onClick={() => void appStore.run({ type: "daily" }, (r) => `+${fmt(r ?? 0)} лепестков — так держать!`)}>
                Забрать
              </button>
            )}
          </div>
          <div className="daily" aria-hidden>
            {DAILY_REWARDS.map((r, i) => {
              const dayN = i + 1;
              const done = daily.claimedToday ? dayN <= daily.streak : dayN < daily.nextStreak;
              const today = !daily.claimedToday && dayN === Math.min(daily.nextStreak, 7);
              return (
                <div key={i} className={`daily__day${done ? " daily__day--done" : ""}${today ? " daily__day--today" : ""}`}>
                  <b>{r >= 1000 ? `${r / 1000}K` : r}</b>
                  д{dayN}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Быстрые действия */}
      <section className="section stack">
        {tasks > 0 && (
          <button className="card card--pressable row" style={{ textAlign: "left" }} onClick={() => navigate({ name: "tap" })}>
            <span className="task__icon">🎁</span>
            <div className="grow">
              <b>Награды ждут: {tasks}</b>
              <div className="muted small">Заберите лепестки за выполненные задания</div>
            </div>
            <IconChevron width={18} />
          </button>
        )}
        <button className="card card--fuchsia grain card--pressable row" style={{ textAlign: "left", padding: 18 }} onClick={() => navigate({ name: "quiz", id: "type" })}>
          <span className="task__icon">{typeRes?.emoji ?? "🧭"}</span>
          <div className="grow">
            <b className="h3">{typeRes ? `Ваш тип: ${typeRes.title.toLowerCase()}` : "Узнайте свой тип набора веса"}</b>
            <div className="muted small" style={{ marginTop: 4 }}>{typeRes ? "Пройти ещё раз или посмотреть советы" : "5 вопросов · 1 минута · +500 лепестков"}</div>
          </div>
          <IconChevron width={20} />
        </button>
      </section>

      {/* Обмен лепестков */}
      <section className="section">
        <button className="card card--pressable row" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "shop" })}>
          <Feather size="lg" />
          <div className="grow">
            <b>Обменяйте лепестки на гайды</b>
            <div className="muted small" style={{ marginTop: 2 }}>ПП-десерты, меню на 14 дней, кортизол и другие</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      {/* Автор */}
      <section className="section">
        <button className="card card--pressable row" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "author" })}>
          <Img src={BRAND.authorPhoto} alt={BRAND.author} className="avatar" />
          <div className="grow">
            <div className="eyebrow" style={{ marginBottom: 6 }}>Автор системы</div>
            <b>{BRAND.author}</b>
            <div className="muted small" style={{ marginTop: 2 }}>{BRAND.authorRole}</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      <p className="disclaimer">{BRAND.disclaimer}</p>
    </main>
  );
}
