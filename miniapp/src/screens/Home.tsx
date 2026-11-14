import { DAILY_REWARDS, dailyStatus } from "../../shared/economy.ts";
import { BRAND, PILLARS, REVIEWS } from "../content/brand";
import { lessonById } from "../content/lessons";
import { quizById } from "../content/quizzes";
import { Feather, Img, Progress, SectionHead, TopBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { appStore, useUserState } from "../store/appStore";
import { claimableTasks, lessonsProgress } from "../store/selectors";
import { fmt, greeting } from "../lib/format";
import { navigate } from "../lib/router";
import { getUser } from "../telegram/sdk";
import { isDemoBackend } from "../config";

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
      {isDemoBackend && !document.documentElement.classList.contains("is-telegram") && (
        <div className="demo-banner">🧪 Демо в браузере. Откройте через Telegram-бота — будет ваше имя и синхронизация.</div>
      )}

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
        <div className="card card--pink grain" style={{ marginTop: 10 }}>
          <div className="eyebrow" style={{ color: "#fff" }}>Мини-курс пройден</div>
          <h2 className="h2">Вы прошли все 3 урока 🏆</h2>
          <p className="muted" style={{ marginTop: 6 }}>Бонус-эфир про гормоны уже открыт. Следующий шаг — подобрать формат, в котором вы дойдёте до результата.</p>
          <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn btn-sm" style={{ background: "#fff", color: "var(--pink-deep)" }} onClick={() => navigate({ name: "guide", id: "bonus-hormones" })}>
              Открыть эфир
            </button>
            <button className="btn btn-sm btn-ghost" style={{ borderColor: "rgba(255,255,255,.5)" }} onClick={() => navigate({ name: "quiz", id: "format" })}>
              Мой формат
            </button>
          </div>
        </div>
      )}

      {/* Ежедневная награда */}
      <section className="section">
        <div className="card card--pink grain">
          <div className="row">
            <div className="grow">
              <div className="h3">{daily.claimedToday ? "Награда получена" : "Ежедневный подарок"}</div>
              <p className="muted small">
                {daily.claimedToday ? `Серия: ${daily.streak} дн. Возвращайтесь завтра!` : `День ${daily.nextStreak} подряд · +${fmt(daily.reward)} пёрышек`}
              </p>
            </div>
            {!daily.claimedToday && (
              <button className="btn btn-sm" style={{ background: "#fff", color: "var(--pink-deep)" }} onClick={() => void appStore.run({ type: "daily" }, (r) => `+${fmt(r ?? 0)} пёрышек — так держать!`)}>
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
              <div className="muted small">Заберите пёрышки за выполненные задания</div>
            </div>
            <IconChevron width={18} />
          </button>
        )}
        <button className="card card--pressable row" style={{ textAlign: "left" }} onClick={() => navigate({ name: "quiz", id: "type" })}>
          <span className="task__icon">{typeRes?.emoji ?? "🧭"}</span>
          <div className="grow">
            <b>{typeRes ? `Ваш тип: ${typeRes.title.toLowerCase()}` : "Узнайте свой тип набора веса"}</b>
            <div className="muted small">{typeRes ? "Пройти ещё раз или посмотреть советы" : "5 вопросов · 1 минута · +500 пёрышек"}</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      {/* Метод */}
      <section className="section">
        <SectionHead eyebrow="Метод «3 опоры»" title={<>Что такое <em>«Лёгкость»</em></>} />
        <div className="card pillars">
          {PILLARS.map((p) => (
            <div className="pillar" key={p.n}>
              <span className="pillar__n">{p.n}</span>
              <div>
                <b>{p.title}</b>
                <p className="muted small">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="stats-row" style={{ marginTop: 12 }}>
          <div className="stat"><b>2 400+</b><span>учениц прошли систему</span></div>
          <div className="stat"><b>−6,8</b><span>кг в среднем за 31 день</span></div>
          <div className="stat"><b>87%</b><span>удержали вес через полгода</span></div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="section">
        <SectionHead eyebrow="Отзывы" title="Они тоже начинали «с понедельника»" />
        <div className="h-scroll">
          {REVIEWS.map((r) => (
            <article className="card review" key={r.name}>
              <div className="review__head">
                <Img src={r.photo} alt={r.name} />
                <div>
                  <b>{r.name}, {r.age}</b>
                  <div className="muted small">{r.city}</div>
                </div>
              </div>
              <span className="chip" style={{ marginBottom: 8 }}>{r.result}</span>
              <p className="muted small">{r.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Автор */}
      <section className="section">
        <button className="card card--pressable row" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "author" })}>
          <Img src={BRAND.authorPhoto} alt={BRAND.author} className="avatar" />
          <div className="grow">
            <div className="eyebrow" style={{ marginBottom: 4 }}>Автор системы</div>
            <b>{BRAND.author}</b>
            <div className="muted small">{BRAND.authorRole}</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      <section className="section">
        <button className="card card--pressable row" style={{ textAlign: "left", width: "100%" }} onClick={() => navigate({ name: "shop" })}>
          <Feather size="lg" />
          <div className="grow">
            <b>Обменяйте пёрышки на гайды</b>
            <div className="muted small">ПП-десерты, меню на 14 дней, кортизол и другие</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      <p className="disclaimer">{BRAND.disclaimer}</p>
    </main>
  );
}
