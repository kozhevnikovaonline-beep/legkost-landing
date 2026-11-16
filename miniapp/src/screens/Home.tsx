import { DAILY_REWARDS, dailyStatus, TASK_REWARDS } from "../../shared/economy.ts";
import { BRAND } from "../content/brand";
import { lessonById, LESSONS } from "../content/lessons";
import { quizById } from "../content/quizzes";
import { Feather, Img, Progress, TopBar } from "../components/ui";
import { IconChevron, IconLock } from "../components/Icons";
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
        <span className="hello__greet">{greeting()},</span> <span className="hello__name">{getUser().first_name} 💗</span>
      </section>

      {/* Следующий урок / завершённый курс */}
      {nextLesson ? (
        <div className="card card--ink grain mini-course has-hint" style={{ marginTop: 10 }}>
          <Hint title="Бесплатный мини-курс" text="Три видеоурока от Алёны. Открываются по очереди: следующий — после того, как отметите предыдущий пройденным. За каждый урок — 300 лепестков, а после третьего откроется бонус-эфир про гормоны." />
          <div className="eyebrow">Бесплатный мини-курс</div>
          <h2 className="h2">
            3 урока <em>от Алёны</em>
          </h2>
          <p className="muted small" style={{ marginTop: 8, lineHeight: 1.5 }}>
            Узнаете, почему вес стоит, соберёте сытную тарелку без подсчёта калорий и сделаете первую тренировку дома. За каждый урок — 300 лепестков.
          </p>
          <div className="mini-course__list">
            {LESSONS.map((l) => {
              const isDone = s.progress.lessonsCompleted.includes(l.id);
              const isNext = l.id === nextLesson.id;
              return (
                <div key={l.id} className={`mini-course__item${isDone ? " is-done" : isNext ? " is-next" : " is-locked"}`}>
                  <span className="mini-course__n">{isDone ? "✓" : isNext ? l.number : <IconLock width={14} />}</span>
                  <span className="grow">{l.title}</span>
                </div>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <div className="grow">
              <Progress value={lp.done / lp.total} />
              <div className="muted small" style={{ marginTop: 6 }}>Пройдено {lp.done} из {lp.total}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate({ name: "lesson", id: nextLesson.id })}>
              {lp.done === 0 ? "Начать" : "Продолжить"} →
            </button>
          </div>
        </div>
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

      {/* Ежедневная награда: бесцветный фон, розовый заголовок */}
      <section className="section">
        <div className="card card--clear has-hint">
          <Hint title="Ежедневный подарок" text="Заходите каждый день и забирайте награду. Чем длиннее серия, тем больше: с 100 до 400 за 7-й день. Пропустили день — серия начнётся заново." />
          <div className="row">
            <div className="grow">
              <div className="h3 daily__title">{daily.claimedToday ? "Награда получена ✓" : "Ежедневный подарок"}</div>
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
          <div className="hint-wrap">
          <Hint title="Награды ждут" text="Вы выполнили задания, но ещё не забрали за них лепестки. Нажмите — откроется вкладка «Лепестки», где награду можно забрать." />
          <button className="card card--pressable row has-hint" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "tap" })}>
            <span className="task__icon">🎁</span>
            <div className="grow">
              <b>Награды ждут: {tasks}</b>
              <div className="muted small">Заберите лепестки за выполненные задания</div>
            </div>
            <IconChevron width={18} />
          </button>
          </div>
        )}
        <div className="hint-wrap">
        <Hint tone="light" title="Тест «Ваш тип набора веса»" text={`5 коротких вопросов покажут, почему у вас копится вес: отёки, стресс, гормоны или режим. В конце — советы Алёны и +${TASK_REWARDS["quiz-type"]} лепестков за первое прохождение.`} />
        <button className="card card--fuchsia grain card--pressable row has-hint" style={{ textAlign: "left", padding: 18, width: "100%" }} onClick={() => navigate({ name: "quiz", id: "type" })}>
          <span className="task__icon">{typeRes?.emoji ?? "🧭"}</span>
          <div className="grow">
            <b className="h3">{typeRes ? `Ваш тип: ${typeRes.title.toLowerCase()}` : "Узнайте свой тип набора веса"}</b>
            <div className="muted small" style={{ marginTop: 4 }}>{typeRes ? "Пройти ещё раз или посмотреть советы" : `5 вопросов · 1 минута · +${TASK_REWARDS["quiz-type"]} лепестков`}</div>
          </div>
          <IconChevron width={20} />
        </button>
        </div>
      </section>

      {/* Обмен лепестков */}
      <section className="section hint-wrap">
        <Hint title="Обмен лепестков" text="Лепестки тратятся в Магазине: гайды открываются целиком за лепестки, а на курсы и программы дают скидку до 20% (1 лепесток = 1 ₽)." />
        <button className="card card--pressable row has-hint" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "shop" })}>
          <Feather size="lg" />
          <div className="grow">
            <b>Обменяйте лепестки на гайды</b>
            <div className="muted small" style={{ marginTop: 2 }}>ПП-десерты, меню на 14 дней, кортизол и другие</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      {/* Автор */}
      <section className="section hint-wrap">
        <Hint title="Автор системы" text="Познакомьтесь с Алёной: её история, опыт и подход «за лёгкость, а не за диеты». Нажмите, чтобы открыть страницу автора." />
        <button className="card card--pressable row has-hint" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "author" })}>
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
