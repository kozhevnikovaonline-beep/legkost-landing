import { useState } from "react";
import { BRAND } from "../content/brand";
import { Img, Logo, MainAction } from "../components/ui";
import { appStore, useUserState } from "../store/appStore";
import { lessonsProgress } from "../store/selectors";
import { toast } from "../store/toastStore";
import { navigate } from "../lib/router";
import { haptic, requestWriteAccess } from "../telegram/sdk";

/**
 * Приветствие Алёны — единственный экран онбординга.
 * Новая пользовательница: «Открыть 3 урока бесплатно» → список уроков мини-курса.
 * Мини-курс уже пройден: «Дальше» → Главная.
 */
export function Onboarding() {
  const s = useUserState();
  const [busy, setBusy] = useState(false);
  const lp = lessonsProgress(s);
  const courseDone = lp.done === lp.total;

  const finish = async (to: "lessons" | "home") => {
    setBusy(true);
    const ok = await appStore.run({ type: "onboard" });
    if (!ok) {
      setBusy(false);
      return;
    }
    if (!s.progress.tasksClaimed.includes("welcome")) {
      await appStore.run({ type: "task", id: "welcome" }, (r) => `+${r} лепестков — подарок за старт 🎀`);
    }
    // Разрешение писать первым: бот будет присылать следующие уроки и напоминания
    if (!s.progress.tasksClaimed.includes("notifications")) {
      const granted = await requestWriteAccess();
      if (granted) await appStore.run({ type: "task", id: "notifications" }, (r) => `Напоминания включены · +${r} лепестков`);
    }
    navigate({ name: to });
  };

  const go = (to: "lessons" | "home") => {
    haptic.select();
    void finish(to).catch(() => toast.error("Не удалось открыть приложение. Попробуйте ещё раз"));
  };

  return (
    <div className="onb">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <Logo />
        {!courseDone && (
          <button className="link-btn" disabled={busy} onClick={() => go("home")}>
            Пропустить
          </button>
        )}
      </div>

      <div className="onb__visual onb__visual--welcome">
        <span className="bg-word" style={{ top: 0, left: -20 }}>ЛЁГКОСТЬ</span>
        <div className="onb__photo-wrap">
          <div className="onb__photo onb__photo--sm">
            <Img src={BRAND.authorPhoto} alt={`${BRAND.author} на тренировке`} />
          </div>
          <span className="hand onb__sign">Алёна ♥</span>
        </div>
      </div>
      <div className="onb__text onb__text--welcome">
        <div className="eyebrow" style={{ justifySelf: "center" }}>Привет!</div>
        <h1 className="h1">
          Я Алёна Ветрова —
          <br />и я <em>за лёгкость</em>,
          <br />а не за диеты
        </h1>
        <p className="muted">
          Минус 18 кг после вторых родов, 9 лет в фитнесе и 2 400+ учениц. Здесь я собрала всё, чтобы вы начали худеть уже сегодня — без голодовок и запретов.
        </p>
      </div>

      <MainAction
        text={courseDone ? "Дальше" : "Открыть 3 урока бесплатно"}
        onClick={() => go(courseDone ? "home" : "lessons")}
        loading={busy}
        shine={!courseDone}
      />
    </div>
  );
}
