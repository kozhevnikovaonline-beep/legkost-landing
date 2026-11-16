/**
 * Скрытое меню «≡» в правом верхнем углу экранов без нижнего меню.
 * Пункты — те же, что в нижней панели вкладок.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { navigate, type Tab } from "../lib/router";
import { haptic } from "../telegram/sdk";
import { FeatherGlyph, IconBag, IconHome, IconPlay, IconUser } from "./Icons";

const ITEMS: { tab: Tab; label: string; icon: ReactNode }[] = [
  { tab: "home", label: "Главная", icon: <IconHome /> },
  { tab: "lessons", label: "Уроки", icon: <IconPlay /> },
  { tab: "tap", label: "Лепестки", icon: <FeatherGlyph /> },
  { tab: "shop", label: "Магазин", icon: <IconBag /> },
  { tab: "profile", label: "Профиль", icon: <IconUser /> },
];

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="navmenu" ref={root}>
      <button
        className="icon-btn navmenu__btn"
        aria-label="Меню"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          haptic.select();
          setOpen((v) => !v);
        }}
      >
        <span className={`burger${open ? " burger--open" : ""}`} aria-hidden>
          <i />
          <i />
          <i />
        </span>
      </button>
      {open && (
        <nav className="navmenu__list" role="menu">
          {ITEMS.map((it) => (
            <button
              key={it.tab}
              role="menuitem"
              className={`navmenu__item${it.tab === "tap" ? " navmenu__item--accent" : ""}`}
              onClick={() => {
                haptic.select();
                setOpen(false);
                navigate({ name: it.tab });
              }}
            >
              <span className="navmenu__icon">{it.icon}</span>
              {it.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
