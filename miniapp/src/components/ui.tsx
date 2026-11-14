import { useEffect, type ReactNode } from "react";
import { useMainButton } from "../telegram/hooks";
import { compact, fmt } from "../lib/format";
import { back, navigate } from "../lib/router";
import { useBackButton } from "../telegram/hooks";
import { haptic } from "../telegram/sdk";
import { FeatherGlyph, IconBack } from "./Icons";
import { BRAND } from "../content/brand";

export function Feather({ size }: { size?: "lg" }) {
  return (
    <span className={`feather${size === "lg" ? " feather--lg" : ""}`} aria-hidden>
      <FeatherGlyph />
    </span>
  );
}

export function Balance({ value }: { value: number }) {
  return (
    <button className="balance" onClick={() => navigate({ name: "tap" })} aria-label={`Баланс: ${fmt(value)} пёрышек`}>
      <Feather />
      {compact(value)}
    </button>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <FeatherGlyph />
      </span>
      <span>
        {BRAND.name}
        <small>{BRAND.tagline}</small>
      </span>
    </div>
  );
}

/** Шапка вкладки: логотип + баланс */
export function TopBar({ balance }: { balance: number }) {
  return (
    <header className="topbar">
      <Logo />
      <Balance value={balance} />
    </header>
  );
}

/** Шапка вложенного экрана. В Telegram «Назад» — системная кнопка, в браузере — своя. */
export function SubBar({ title, right }: { title: string; right?: ReactNode }) {
  useBackButton(true, () => back());
  return (
    <header className="subbar">
      <button className="icon-btn icon-btn--back" onClick={() => back()} aria-label="Назад">
        <IconBack />
      </button>
      <h1 className="subbar__title">{title}</h1>
      {right}
    </header>
  );
}

export function Progress({ value, lime }: { value: number; lime?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`progress${lime ? " progress--lime" : ""}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, label }: { value: number; label: string }) {
  return (
    <div className="ring" style={{ ["--p" as string]: Math.round(value * 100) }}>
      <span>{label}</span>
    </div>
  );
}

export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useBackButton(open, onClose);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="sheet__handle" />
        <div className="sheet__inner">{children}</div>
      </div>
    </>
  );
}

/**
 * Главное действие экрана: в Telegram — нативная MainButton,
 * в браузере — закреплённая кнопка внизу.
 */
export function MainAction(props: { text: string; onClick: () => void; disabled?: boolean; loading?: boolean; shine?: boolean; visible?: boolean }) {
  const native = useMainButton({ ...props, onClick: () => { haptic.medium(); props.onClick(); } });
  if (native || props.visible === false) return null;
  return (
    <div className="dock">
      <button className="btn btn-primary" onClick={props.onClick} disabled={props.disabled || props.loading}>
        {props.loading ? <span className="spinner" /> : props.text}
      </button>
    </div>
  );
}

export function Skeleton({ h = 80, r }: { h?: number; r?: number }) {
  return <div className="skeleton" style={{ height: h, borderRadius: r }} />;
}

export function Empty({ icon, title, text, action }: { icon: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <p className="h3">{title}</p>
      <p className="muted small" style={{ marginTop: 6 }}>{text}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="section__head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="h2">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        // Нет сети до Unsplash — оставляем фирменный фон вместо «битой» картинки
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
}
