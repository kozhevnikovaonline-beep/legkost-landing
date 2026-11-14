import { Component, type ErrorInfo, type ReactNode } from "react";
import { useToasts } from "../store/toastStore";
import { navigate, type Tab } from "../lib/router";
import { haptic } from "../telegram/sdk";
import { FeatherGlyph, IconBag, IconHome, IconPlay, IconUser } from "./Icons";

export function TabBar({ active, dots }: { active: Tab | null; dots: Partial<Record<Tab, boolean>> }) {
  const go = (t: Tab) => {
    if (t !== active) haptic.select();
    navigate({ name: t });
  };
  const item = (t: Tab, label: string, icon: ReactNode) => (
    <button className="tab" aria-current={active === t ? "page" : undefined} onClick={() => go(t)}>
      {icon}
      {label}
      {dots[t] && <i className="tab__dot" aria-label="есть новое" />}
    </button>
  );
  return (
    <nav className="tabbar" aria-label="Навигация">
      <div className="tabbar__inner">
        {item("home", "Главная", <IconHome />)}
        {item("lessons", "Уроки", <IconPlay />)}
        <button className="tab tab--center" aria-current={active === "tap" ? "page" : undefined} onClick={() => go("tap")} aria-label="Пёрышки">
          <span className="tab__orb">
            <FeatherGlyph />
          </span>
          Пёрышки
          {dots.tap && <i className="tab__dot" style={{ top: -22 }} aria-label="есть награда" />}
        </button>
        {item("shop", "Магазин", <IconBag />)}
        {item("profile", "Профиль", <IconUser />)}
      </div>
    </nav>
  );
}

export function Toasts() {
  const list = useToasts();
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <span>{t.kind === "success" ? "✨" : t.kind === "error" ? "⚠️" : "💗"}</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ЛЁГКОСТЬ] UI error", error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="state">
        <div className="state__icon">🌧</div>
        <h1 className="h2">Что-то пошло не так</h1>
        <p className="muted">Мы уже знаем об ошибке. Попробуйте открыть экран заново — прогресс сохранён.</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            this.setState({ error: null });
            navigate({ name: "home" });
          }}
        >
          На главную
        </button>
      </div>
    );
  }
}
