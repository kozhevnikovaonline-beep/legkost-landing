import { useState } from "react";
import { levelOf } from "../../shared/economy.ts";
import { quizById } from "../content/quizzes";
import { BRAND } from "../content/brand";
import { Feather, Img, Progress, TopBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { useUserState } from "../store/appStore";
import { lessonsProgress } from "../store/selectors";
import { compact, fmt } from "../lib/format";
import { navigate } from "../lib/router";
import { config, isDemoBackend } from "../config";
import { clearState } from "../storage/stateStorage";
import { confirmDialog, getHapticsEnabled, getUser, haptic, isTelegram, openLink, setHapticsEnabled } from "../telegram/sdk";

export function Profile() {
  const s = useUserState();
  const user = getUser();
  const level = levelOf(s.game.totalEarned);
  const lp = lessonsProgress(s);
  const guides = s.progress.owned.filter((id) => id.startsWith("guide-") || id.startsWith("free-") || id === "bonus-hormones").length;
  const [haptics, setHaptics] = useState(getHapticsEnabled());
  const typeRes = quizById("type")!.results.find((r) => r.id === s.progress.quizResults["type"]);
  const formatRes = quizById("format")!.results.find((r) => r.id === s.progress.quizResults["format"]);

  const resetDemo = async () => {
    if (!(await confirmDialog("Сбросить весь демо-прогресс: уроки, пёрышки и покупки?"))) return;
    clearState();
    location.hash = "";
    location.reload();
  };

  const menu = (icon: string, label: string, onClick: () => void, hint?: string) => (
    <button className="menu-item" onClick={onClick}>
      <span className="menu-item__icon">{icon}</span>
      <span className="grow">
        {label}
        {hint && <span className="muted small" style={{ display: "block", fontWeight: 500 }}>{hint}</span>}
      </span>
      <IconChevron className="chev" />
    </button>
  );

  return (
    <main className="screen">
      <TopBar balance={s.game.balance} />

      <div className="card row" style={{ gap: 16 }}>
        {user.photo_url ? (
          <Img src={user.photo_url} alt="" className="avatar" />
        ) : (
          <span className="avatar">{user.first_name.slice(0, 1).toUpperCase()}</span>
        )}
        <div className="grow">
          <div className="h3">{[user.first_name, user.last_name].filter(Boolean).join(" ")}</div>
          {user.username && <div className="muted small">@{user.username}</div>}
          <div className="row" style={{ marginTop: 8, gap: 8 }}>
            <span className="chip">🌸 {level.title}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <span className="small muted">Заработано за всё время</span>
          <span className="row small" style={{ gap: 6, fontWeight: 800 }}><Feather /> {fmt(s.game.totalEarned)}</span>
        </div>
        <Progress value={level.progress} />
        <div className="muted small" style={{ marginTop: 6 }}>
          {level.next ? `До уровня «${level.next.title}» — ${compact(level.next.min - s.game.totalEarned)}` : "Вы на вершине 👑"}
        </div>
      </div>

      <div className="stats-row" style={{ marginTop: 12 }}>
        <div className="stat"><b>{lp.done}/{lp.total}</b><span>уроков пройдено</span></div>
        <div className="stat"><b>{guides}</b><span>материалов открыто</span></div>
        <div className="stat"><b>{s.game.daily.streak}</b><span>дней подряд</span></div>
      </div>

      {(typeRes || formatRes) && (
        <section className="section stack">
          {typeRes && (
            <button className="card card--pressable row" style={{ textAlign: "left" }} onClick={() => navigate({ name: "quiz", id: "type" })}>
              <span className="task__icon">{typeRes.emoji}</span>
              <div className="grow"><div className="muted small">Ваш тип</div><b>{typeRes.title}</b></div>
              <IconChevron width={18} />
            </button>
          )}
          {formatRes && (
            <button className="card card--pressable row" style={{ textAlign: "left" }} onClick={() => navigate({ name: "quiz", id: "format" })}>
              <span className="task__icon">{formatRes.emoji}</span>
              <div className="grow"><div className="muted small">Ваш формат</div><b>{formatRes.title}</b></div>
              <IconChevron width={18} />
            </button>
          )}
        </section>
      )}

      <section className="section">
        <div className="menu-list">
          {menu("📚", "Мои материалы", () => navigate({ name: "materials" }), "Гайды, бонусы и покупки")}
          {menu("🎯", "Какой формат мне подходит", () => navigate({ name: "quiz", id: "format" }))}
          {menu("💗", `Об авторе — ${BRAND.author}`, () => navigate({ name: "author" }))}
        </div>
      </section>

      <section className="section">
        <div className="menu-list">
          {menu("💬", "Написать куратору", () => openLink(config.curatorUrl), `${BRAND.curator} отвечает в течение дня`)}
          {menu("📣", "Канал Алёны", () => openLink(config.channelUrl))}
          {menu("🌐", "Сайт программы", () => openLink(config.siteUrl))}
          <button
            className="menu-item"
            role="switch"
            aria-checked={haptics}
            onClick={() => {
              setHapticsEnabled(!haptics);
              setHaptics(!haptics);
              if (!haptics) haptic.medium();
            }}
          >
            <span className="menu-item__icon">📳</span>
            <span className="grow">Вибрация</span>
            <span className="switch" aria-checked={haptics} />
          </button>
          {menu("🔒", "Политика конфиденциальности", () => openLink(config.privacyUrl))}
        </div>
      </section>

      {isDemoBackend && (
        <button className="btn btn-ghost btn-block" style={{ marginTop: 20 }} onClick={() => void resetDemo()}>
          Сбросить демо-прогресс
        </button>
      )}

      <p className="disclaimer">
        © 2026 «ЛЁГКОСТЬ». ИП Ветрова Алёна Сергеевна
        <br />
        {isTelegram() ? `Telegram ID: ${user.id}` : "Демо-режим в браузере"} · v1.0
      </p>
    </main>
  );
}
