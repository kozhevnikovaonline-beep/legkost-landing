/**
 * «А что дальше?» — экран после бесплатного мини-курса.
 * Подводка: что уже сделано → почему важно не остановиться → программа на 31 день
 * → форматы → бонус лепестками → запись на основной курс.
 */
import { catalogById, minPriceRub } from "../../shared/catalog.ts";
import { ECONOMY, maxDiscountRub } from "../../shared/economy.ts";
import { BRAND, REVIEWS } from "../content/brand";
import { productById } from "../content/products";
import { quizById } from "../content/quizzes";
import { Feather, Img, MainAction, SubBar } from "../components/ui";
import { IconCheck, IconChevron } from "../components/Icons";
import { useUserState } from "../store/appStore";
import { lessonsProgress } from "../store/selectors";
import { fmt, rub } from "../lib/format";
import { navigate } from "../lib/router";
import { config } from "../config";
import { openLink } from "../telegram/sdk";

const DONE = [
  "Нашли свои причины, из-за которых вес стоит",
  "Собрали сытную тарелку и попробовали «сладкое после еды»",
  "Сделали первую тренировку на живот дома",
];

const STAGES = [
  { days: "Дни 1–7", title: "Перезагрузка", text: "Разбираем вашу тарелку, налаживаем воду и сон. Уходят отёки.", result: "−1,5–2 кг, лёгкость утром" },
  { days: "Дни 8–14", title: "Без срывов", text: "Убираем вечернюю тягу к сладкому. Учимся есть в гостях без чувства вины.", result: "Сладкое больше не управляет" },
  { days: "Дни 15–21", title: "Тонус", text: "Добавляем силовые на живот и ягодицы. Тело плотнее, осанка ровнее.", result: "−3–5 см в талии" },
  { days: "Дни 22–31", title: "Новая я", text: "Закрепляем привычки и составляем личный план на 3 месяца.", result: "Система, которая остаётся" },
];

const INCLUDED = [
  { icon: "🎬", title: "Уроки по 10–15 минут", text: "Смотрите с телефона в любое время" },
  { icon: "💬", title: "Куратор каждый день", text: "Проверка дневника питания и ответы в Telegram" },
  { icon: "🤍", title: "Чат без стыда", text: "Только девушки, отчёты — по желанию" },
  { icon: "📅", title: "Доступ 6 месяцев", text: "Возвращайтесь к урокам, когда нужно" },
];

const FORMATS = ["group", "personal", "system"] as const;
const FORMAT_HINT: Record<(typeof FORMATS)[number], string> = {
  group: "Поддержка, компания и бюджетный старт",
  personal: "Без марафонов — только вы и Алёна",
  system: "Если диеты не помогали: гормоны, кортизол, отёки",
};

export function Next() {
  const s = useUserState();
  const lp = lessonsProgress(s);
  const formatRes = s.progress.quizResults["format"] as (typeof FORMATS)[number] | undefined;
  const formatTitle = quizById("format")!.results.find((r) => r.id === formatRes)?.title;
  const review = REVIEWS[0]!;
  const systemPrice = minPriceRub(catalogById.get("system")!);
  const discountAvailable = Math.min(Math.floor(s.game.balance / ECONOMY.feathersPerRub), maxDiscountRub(systemPrice));

  const enroll = () => navigate(formatRes ? { name: "product", id: formatRes } : { name: "quiz", id: "format" });

  return (
    <main className="screen screen--sub">
      <SubBar title="Что дальше" />

      <div className="card card--ink grain" style={{ padding: "26px 20px" }}>
        <div className="eyebrow">{lp.done === lp.total ? "Мини-курс пройден 🏆" : `Пройдено уроков: ${lp.done} из ${lp.total}`}</div>
        <h1 className="h1">
          А что <em>дальше?</em>
        </h1>
        <p className="muted" style={{ marginTop: 10 }}>
          За эти дни вы сделали больше, чем 8 из 10 женщин, которые «начинают с понедельника». Самое время не остановиться.
        </p>
      </div>

      <section className="section">
        <div className="eyebrow">Вы уже</div>
        <div className="stack">
          {DONE.map((d) => (
            <div className="include card" key={d} style={{ padding: 14 }}>
              <IconCheck style={{ color: "#8BC21A" }} />
              <span style={{ color: "var(--text)" }}>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="h2">
          Почему одних уроков <em>мало</em>
        </h2>
        <div className="prose" style={{ marginTop: 12 }}>
          <p>
            Три урока дают понимание и первый результат. Но привычки меняются не за три вечера: без плана и поддержки через 2–3 недели большинство возвращается к старому режиму — и вес тоже.
          </p>
          <div className="callout callout--lime">
            <b>Основной курс «ЛЁГКОСТЬ»</b>
            <p>31 день по шагам: питание по тарелке, тренировки по 20 минут, сон и работа с отёками. Каждый день рядом куратор — вы не «сольётесь» на третий день.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Программа на 31 день</div>
        <div className="steps">
          {STAGES.map((st, i) => (
            <div className="step" key={st.days}>
              <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <span className="muted small" style={{ fontWeight: 700 }}>{st.days}</span>
                <b>{st.title}</b>
                <p>{st.text}</p>
                <span className="chip chip--lime" style={{ marginTop: 8 }}>✓ {st.result}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Как проходит обучение</div>
        <div className="guide-grid">
          {INCLUDED.map((x) => (
            <div className="card" key={x.title} style={{ padding: 14 }}>
              <div style={{ fontSize: 26 }}>{x.icon}</div>
              <b style={{ display: "block", margin: "6px 0 2px", lineHeight: 1.25 }}>{x.title}</b>
              <span className="muted small">{x.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="stats-row">
          <div className="stat"><b>2 400+</b><span>учениц прошли систему</span></div>
          <div className="stat"><b>−6,8</b><span>кг в среднем за 31 день</span></div>
          <div className="stat"><b>87%</b><span>удержали вес через полгода</span></div>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <div className="review__head">
            <Img src={review.photo} alt={review.name} />
            <div>
              <b>{review.name}, {review.age}</b>
              <div className="muted small">{review.city}</div>
            </div>
            <span className="chip" style={{ marginLeft: "auto" }}>{review.result}</span>
          </div>
          <p className="muted small">«{review.text}»</p>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Выберите формат</div>
        <div className="stack">
          {FORMATS.map((id) => {
            const p = productById(id)!;
            const price = minPriceRub(catalogById.get(id)!);
            const rec = formatRes === id;
            return (
              <button
                key={id}
                className={`card card--pressable row${rec ? " lesson-card--current" : ""}`}
                style={{ textAlign: "left" }}
                onClick={() => navigate({ name: "product", id })}
              >
                <span className="task__icon">{p.emoji}</span>
                <div className="grow">
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <b>{p.title}</b>
                    {rec && <span className="chip chip--lime" style={{ padding: "3px 8px" }}>Ваш формат</span>}
                  </div>
                  <div className="muted small">{FORMAT_HINT[id]}</div>
                  <div style={{ fontWeight: 800, marginTop: 4 }}>{catalogById.get(id)!.plans.length > 1 ? "от " : ""}{rub(price)}</div>
                </div>
                <IconChevron width={18} />
              </button>
            );
          })}
        </div>
        {!formatRes && (
          <button className="card card--lime card--pressable row" style={{ textAlign: "left", width: "100%", marginTop: 12, padding: 18 }} onClick={() => navigate({ name: "quiz", id: "format" })}>
            <span className="task__icon">🎯</span>
            <div className="grow">
              <b className="h3">Не знаете, что выбрать?</b>
              <div className="muted small">6 вопросов — и Алёна подскажет формат</div>
            </div>
            <IconChevron width={20} />
          </button>
        )}
      </section>

      <section className="section">
        <div className="card card--ink grain">
          <div className="eyebrow">Бонус выпускнице мини-курса</div>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <Feather size="lg" />
            <div className="grow">
              <b className="h3">Ваши лепестки = скидка</b>
              <p className="muted small" style={{ marginTop: 4 }}>
                У вас {fmt(s.game.balance)} лепестков. Обменяйте их на скидку до 30% на любой формат
                {discountAvailable > 0 ? ` — например, до ${rub(discountAvailable)} на «СИСТЕМУ».` : ". Потапайте — и скидка вырастет."}
              </p>
            </div>
          </div>
          <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate({ name: "guide", id: "bonus-hormones" })}>
              🎁 Бонус-эфир про гормоны
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <button className="card card--pressable row" style={{ textAlign: "left", width: "100%" }} onClick={() => openLink(config.curatorUrl)}>
          <Img src={BRAND.authorPhoto} alt={BRAND.author} className="avatar" />
          <div className="grow">
            <b>Остались вопросы?</b>
            <div className="muted small">Напишите — {BRAND.curator}, куратор Алёны, поможет выбрать формат</div>
          </div>
          <IconChevron width={18} />
        </button>
      </section>

      <p className="disclaimer">{BRAND.disclaimer}</p>

      <MainAction text={formatTitle ? `Записаться: ${formatTitle}` : "Записаться на основной курс"} onClick={enroll} shine />
    </main>
  );
}
