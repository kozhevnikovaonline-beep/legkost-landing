import { useState } from "react";
import { TASK_REWARDS } from "../../shared/economy.ts";
import { BRAND } from "../content/brand";
import { LESSONS } from "../content/lessons";
import { Feather, Img, Logo, MainAction } from "../components/ui";
import { appStore } from "../store/appStore";
import { toast } from "../store/toastStore";
import { navigate } from "../lib/router";
import { getUser, haptic, requestWriteAccess } from "../telegram/sdk";

const SLIDES = 3;

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const name = getUser().first_name;

  const finish = async () => {
    setBusy(true);
    const ok = await appStore.run({ type: "onboard" });
    if (!ok) {
      setBusy(false);
      return;
    }
    await appStore.run({ type: "task", id: "welcome" }, (r) => `+${r} лепестков — подарок за старт 🎀`);
    // Разрешение писать первым: бот будет присылать следующие уроки и напоминания
    const granted = await requestWriteAccess();
    if (granted) await appStore.run({ type: "task", id: "notifications" }, (r) => `Напоминания включены · +${r} лепестков`);
    // Вкладка «Уроки» под первым уроком — «Назад» вернёт к списку уроков
    navigate({ name: "lessons" });
    navigate({ name: "lesson", id: "lesson-1" });
  };

  const next = () => {
    haptic.select();
    if (step < SLIDES - 1) setStep(step + 1);
    else void finish().catch(() => toast.error("Не удалось открыть уроки. Попробуйте ещё раз"));
  };

  return (
    <div className="onb">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <Logo />
        {step < SLIDES - 1 && (
          <button className="link-btn" onClick={() => setStep(SLIDES - 1)}>
            Пропустить
          </button>
        )}
      </div>
      <div className="onb__dots" aria-hidden>
        {Array.from({ length: SLIDES }, (_, i) => (
          <i key={i} className={i === step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="onb__visual onb__visual--welcome">
            <span className="bg-word" style={{ top: 0, left: -20 }}>ЛЁГКОСТЬ</span>
            <div className="onb__photo-wrap">
              <div className="onb__photo onb__photo--sm">
                <Img src={BRAND.authorPhoto} alt={`${BRAND.author} на тренировке`} />
              </div>
              <span className="hand onb__sign">Алёна ♥</span>
            </div>
          </div>
          <div className="onb__text onb__text--welcome" key="s0">
            <div className="eyebrow" style={{ justifySelf: "center" }}>Привет, {name}!</div>
            <h1 className="h1">
              Я Алёна Ветрова — и я <em>за лёгкость</em>, а не за диеты
            </h1>
            <p className="muted">
              Минус 18 кг после вторых родов, 9 лет в фитнесе и 2 400+ учениц. Здесь я собрала всё, чтобы вы начали худеть уже сегодня — без голодовок и запретов.
            </p>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="onb__visual">
            <div className="onb__gift">
              {LESSONS.map((l) => (
                <div key={l.id} className={`card row${l.number > 1 ? " lesson-locked-mini" : ""}`} style={{ padding: 12 }}>
                  <div className="lesson-card__thumb" style={{ width: 64, height: 64, borderRadius: 14 }}>
                    <Img src={l.cover} alt="" />
                    <span className="lesson-card__num" style={{ fontSize: 22 }}>{l.number}</span>
                  </div>
                  <div className="grow">
                    <div style={{ fontWeight: 800, lineHeight: 1.25 }}>{l.title}</div>
                    <div className="muted small">Урок {l.number} · {l.duration}{l.number > 1 ? " · 🔒 после урока " + (l.number - 1) : ""}</div>
                  </div>
                </div>
              ))}
              <div className="card bonus-card" style={{ padding: 12 }}>
                <span style={{ fontSize: 28 }}>🎁</span>
                <div className="small">
                  <b>+ меню на 3 дня, гайд «Тарелка», чек-лист отёков</b>
                  <div className="muted">и бонус-эфир про гормоны после 3-го урока</div>
                </div>
              </div>
            </div>
          </div>
          <div className="onb__text" key="s1">
            <div className="eyebrow" style={{ justifySelf: "center" }}>Ваш подарок</div>
            <h1 className="h1">
              3 урока <em>бесплатно</em>
            </h1>
            <p className="muted">За 3 урока вы поймёте, почему вес стоит, соберёте сытную тарелку и сделаете первую тренировку дома.</p>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="onb__visual">
            <div className="tap-coin" style={{ width: "min(56vw,220px)" }} aria-hidden>
              <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 47c0-15 9-25 29-27-2 17-12 26-29 27zM17 47l12-12" />
              </svg>
            </div>
          </div>
          <div className="onb__text" key="s2">
            <div className="eyebrow" style={{ justifySelf: "center" }}>Лепестки</div>
            <h1 className="h1">
              Тапайте — и <em>копите лепестки</em>
            </h1>
            <p className="muted">
              Лепестки начисляются за тапы, уроки и ежедневные визиты. На них открываются гайды, а на программы — скидка до 30%.
            </p>
            <div className="row" style={{ justifyContent: "center" }}>
              <span className="chip">
                <Feather /> +{TASK_REWARDS.welcome} за старт
              </span>
            </div>
          </div>
        </>
      )}

      <MainAction
        text={step < SLIDES - 1 ? "Дальше" : "Открыть 3 урока бесплатно"}
        onClick={next}
        loading={busy}
        shine={step === SLIDES - 1}
      />
    </div>
  );
}
