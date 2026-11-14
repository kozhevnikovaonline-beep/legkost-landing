import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import {
  boostCost,
  currentEnergy,
  ECONOMY,
  energyMax,
  levelOf,
  rechargesLeft,
  REFERRAL_REWARD,
  regenPerSecond,
  tapPower,
  TASK_REWARDS,
} from "../../shared/economy.ts";
import type { BoostKind } from "../../shared/types.ts";
import { Hint } from "../components/Hint";
import { TASKS, type TaskMeta } from "../content/tasks";
import { Feather, Progress, Sheet, TopBar } from "../components/ui";
import { IconCheck, IconShare } from "../components/Icons";
import { appStore, useUserState } from "../store/appStore";
import { toast } from "../store/toastStore";
import { claimableTasks } from "../store/selectors";
import { compact, fmt } from "../lib/format";
import { navigate } from "../lib/router";
import { config, referralLink } from "../config";
import { getUser, haptic, isTelegram, openLink, requestWriteAccess } from "../telegram/sdk";
import { isTaskEligible } from "../../shared/economy.ts";

interface Float {
  id: number;
  x: number;
  y: number;
  text: string;
}

const BOOSTS: { kind: BoostKind; icon: string; title: string; effect: (lvl: number) => string }[] = [
  { kind: "tap", icon: "👆", title: "Сильный тап", effect: (l) => `+${l} лепесток за тап` },
  { kind: "energy", icon: "🔋", title: "Запас сил", effect: (l) => `${ECONOMY.energyBase + (l - 1) * ECONOMY.energyPerLevel} энергии` },
  { kind: "regen", icon: "⚡️", title: "Быстрое восстановление", effect: (l) => `${(ECONOMY.regenBase + (l - 1) * ECONOMY.regenPerLevel).toString().replace(".", ",")} энергии/сек` },
];

/** Тик раз в 500 мс — энергия восстанавливается на глазах */
function useNow(ms = 500) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function Tap() {
  const s = useUserState();
  const now = useNow();
  const g = s.game;
  const energy = currentEnergy(g, now);
  const max = energyMax(g);
  const power = tapPower(g);
  const level = levelOf(g.totalEarned);
  const empty = energy < power;

  const [floats, setFloats] = useState<Float[]>([]);
  const [ripples, setRipples] = useState<Float[]>([]);
  const [sheet, setSheet] = useState<"boosts" | "tasks" | null>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const lastEmptyToast = useRef(0);

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zone = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - zone.left;
    const y = e.clientY - zone.top;
    const earned = appStore.tap();
    if (earned === 0) {
      haptic.warning();
      if (Date.now() - lastEmptyToast.current > 4000) {
        lastEmptyToast.current = Date.now();
        toast.info("Энергия закончилась. Отдохните минутку или восстановите её");
      }
      return;
    }
    haptic.tap();
    const id = ++seq.current;
    setFloats((f) => [...f.slice(-14), { id, x, y, text: `+${earned}` }]);
    setRipples((r) => [...r.slice(-6), { id, x, y, text: "" }]);
    setTimeout(() => {
      setFloats((f) => f.filter((i) => i.id !== id));
      setRipples((r) => r.filter((i) => i.id !== id));
    }, 900);
    // Наклон монеты в сторону тапа
    const coin = coinRef.current;
    if (coin) {
      const c = coin.getBoundingClientRect();
      const dx = (e.clientX - (c.left + c.width / 2)) / (c.width / 2);
      const dy = (e.clientY - (c.top + c.height / 2)) / (c.height / 2);
      coin.style.transform = `perspective(600px) rotateX(${-dy * 12}deg) rotateY(${dx * 12}deg) scale(.96)`;
      clearTimeout((coin as HTMLDivElement & { _t?: number })._t);
      (coin as HTMLDivElement & { _t?: number })._t = window.setTimeout(() => (coin.style.transform = ""), 110);
    }
  };

  const claimable = claimableTasks(s).length;

  return (
    <main className="screen">
      <div className="tap-screen">
        <TopBar balance={g.balance} />

        <div className="card has-hint" style={{ padding: 14 }}>
          <Hint title="Как это работает" text="Тапайте по монете — за каждый тап начисляются лепестки и тратится энергия. Энергия восстанавливается сама. Бусты усиливают тап, задания дают крупные награды, а за лепестки в Магазине открываются гайды и скидки." />
          <div className="row">
            <div className="grow">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="level__title">🌸 {level.title}</span>
                <span className="muted small">
                  {level.next ? `до «${level.next.title}» ${compact(level.next.min - g.totalEarned)}` : "Максимальный уровень"}
                </span>
              </div>
              <Progress value={level.progress} />
            </div>
          </div>
        </div>

        <div className="big-balance" aria-live="polite">
          <Feather size="lg" />
          {fmt(g.balance)}
        </div>
        <div className="tap-meta">
          <span className="chip">+{power} за тап</span>
          <span className="chip chip--lime">⚡ {String(regenPerSecond(g)).replace(".", ",")}/сек</span>
        </div>

        <div className="tap-zone" onPointerDown={onPointerDown} role="button" aria-label="Тапнуть лепесток" tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              const earned = appStore.tap();
              if (earned) haptic.tap();
            }
          }}
        >
          <div ref={coinRef} className={`tap-coin${empty ? " tap-coin--empty" : ""}`}>
            <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M17 47c0-15 9-25 29-27-2 17-12 26-29 27zM17 47l12-12" />
            </svg>
            <span className="tap-coin__word">ЛЁГКОСТЬ</span>
          </div>
          {ripples.map((r) => (
            <span key={`r${r.id}`} className="ripple" style={{ left: r.x, top: r.y }} />
          ))}
          {floats.map((f) => (
            <span key={f.id} className="float" style={{ left: f.x, top: f.y, transform: "translateX(-50%)" }}>
              {f.text}
            </span>
          ))}
        </div>

        <div className="energy">
          <span className="energy__val">⚡ {Math.floor(energy)} / {max}</span>
          <Progress value={energy / max} lime />
        </div>

        <div className="tap-actions">
          <button className="tap-action" onClick={() => setSheet("tasks")} style={{ position: "relative" }}>
            <span className="tap-action__icon">🎯</span>
            Задания
            {claimable > 0 && <span className="chip" style={{ position: "absolute", top: -8, right: -4, padding: "3px 8px" }}>{claimable}</span>}
          </button>
          <button className="tap-action" onClick={() => setSheet("boosts")}>
            <span className="tap-action__icon">🚀</span>
            Бусты
          </button>
          <button
            className="tap-action"
            onClick={() => void appStore.run({ type: "recharge" }, () => "Энергия восстановлена ⚡")}
          >
            <span className="tap-action__icon">🔋</span>
            Энергия · {rechargesLeft(g, now)}/{ECONOMY.rechargesPerDay}
          </button>
        </div>
      </div>

      <Sheet open={sheet === "boosts"} onClose={() => setSheet(null)} label="Бусты">
        <BoostsSheet />
      </Sheet>
      <Sheet open={sheet === "tasks"} onClose={() => setSheet(null)} label="Задания">
        <TasksSheet onNavigate={() => setSheet(null)} />
      </Sheet>
    </main>
  );
}

function BoostsSheet() {
  const s = useUserState();
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Бусты</div>
        <h2 className="h2">Прокачайте тапалку</h2>
        <p className="muted small" style={{ marginTop: 6 }}>Баланс: {fmt(s.game.balance)} лепестков</p>
      </div>
      {BOOSTS.map((b) => {
        const lvl = s.game.boosts[b.kind];
        const maxed = lvl >= ECONOMY.maxBoostLevel;
        const cost = boostCost(b.kind, lvl + 1);
        return (
          <div className="boost" key={b.kind}>
            <span className="boost__icon">{b.icon}</span>
            <div className="grow">
              <b>{b.title}</b>
              <div className="muted small">Ур. {lvl} · {b.effect(lvl)}</div>
              {!maxed && <div className="small" style={{ color: "var(--accent)", fontWeight: 700 }}>Далее: {b.effect(lvl + 1)}</div>}
            </div>
            <button
              className="btn btn-primary btn-sm"
              disabled={maxed || s.game.balance < cost}
              onClick={() => void appStore.run({ type: "boost", kind: b.kind }, () => `${b.title}: уровень ${lvl + 1} 🚀`)}
            >
              {maxed ? "Макс." : <><Feather /> {compact(cost)}</>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TasksSheet({ onNavigate }: { onNavigate: () => void }) {
  const s = useUserState();
  const [visitedChannel, setVisitedChannel] = useState(() => sessionStorage.getItem("legkost:channel") === "1");
  const link = referralLink(getUser().id);

  const claim = (t: TaskMeta) => appStore.run({ type: "task", id: t.id }, (r) => `+${fmt(r ?? 0)} лепестков · ${t.title}`);

  const act = async (t: TaskMeta) => {
    if (t.external === "channel") {
      if (!visitedChannel) {
        openLink(config.channelUrl);
        sessionStorage.setItem("legkost:channel", "1");
        setVisitedChannel(true);
        return;
      }
      return void claim(t);
    }
    if (t.external === "notifications") {
      if (!isTelegram()) return void toast.info("Напоминания включаются в Telegram");
      const ok = await requestWriteAccess();
      if (ok) void claim(t);
      else toast.info("Без разрешения бот не сможет напомнить об уроке");
      return;
    }
    if (isTaskEligible(t.id, s.progress)) return void claim(t);
    if (t.go) {
      onNavigate();
      navigate(t.go);
    }
  };

  const share = () => {
    const text = "Смотри: 3 бесплатных урока от Алёны Ветровой — как худеть без диет. И лепестки на гайды 💗";
    openLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Задания</div>
        <h2 className="h2">Лепестки за полезное</h2>
      </div>

      <div className="card card--ink grain">
        <b className="h3">Пригласите подругу</b>
        <p className="muted small" style={{ margin: "4px 0 12px" }}>
          +{fmt(REFERRAL_REWARD)} лепестков за каждую подругу, которая откроет уроки. Приглашено: {s.progress.referrals}
        </p>
        <div className="row">
          <button className="btn btn-sm btn-lime grow" onClick={share}>
            <IconShare width={16} /> Поделиться
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() =>
              navigator.clipboard?.writeText(link).then(
                () => toast.success("Ссылка скопирована"),
                () => toast.error("Не удалось скопировать"),
              )
            }
          >
            Копировать
          </button>
        </div>
      </div>

      {TASKS.map((t) => {
        const claimed = s.progress.tasksClaimed.includes(t.id);
        const eligible = isTaskEligible(t.id, s.progress);
        let label = "Перейти";
        if (claimed) label = "";
        else if (t.external === "channel") label = visitedChannel ? "Забрать" : "Открыть";
        else if (t.external === "notifications") label = "Включить";
        else if (eligible) label = "Забрать";
        return (
          <div key={t.id} className={`task${claimed ? " task--done" : ""}`}>
            <span className="task__icon">{t.emoji}</span>
            <div className="grow">
              <b style={{ fontSize: 14 }}>{t.title}</b>
              <div className="muted small">
                {t.hint} · <span style={{ color: "var(--accent)", fontWeight: 800 }}>+{fmt(TASK_REWARDS[t.id])}</span>
              </div>
            </div>
            {claimed ? (
              <span className="chip chip--lime"><IconCheck width={12} /> Готово</span>
            ) : (
              <button className={`btn btn-sm ${label === "Забрать" ? "btn-primary" : "btn-soft"}`} onClick={() => void act(t)}>
                {label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
