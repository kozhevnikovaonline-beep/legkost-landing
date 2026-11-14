/**
 * Подсказка «что здесь»: значок «?» в углу блока.
 * На компьютере открывается при наведении, на телефоне — по нажатию.
 * Можно закрыть («Понятно») или выключить все подсказки (включаются снова в Профиле).
 */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { haptic } from "../telegram/sdk";

const KEY = "legkost:hints";
let enabled = localStorage.getItem(KEY) !== "off";
const listeners = new Set<() => void>();

export function setHintsEnabled(on: boolean) {
  enabled = on;
  localStorage.setItem(KEY, on ? "on" : "off");
  listeners.forEach((l) => l());
}

export function useHintsEnabled() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => enabled,
  );
}

const canHover = () => window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;

export function Hint({ title, text, tone = "auto" }: { title?: string; text: string; tone?: "auto" | "light" }) {
  const on = useHintsEnabled();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.right - width, window.innerWidth - width - 12));
    const up = r.bottom + 180 > window.innerHeight;
    setPos({ top: up ? r.top - 8 : r.bottom + 8, left, up });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (btn.current?.contains(e.target as Node) || bubble.current?.contains(e.target as Node)) return;
      setOpen(false);
      setPinned(false);
    };
    const onScroll = () => {
      setOpen(false);
      setPinned(false);
    };
    document.addEventListener("pointerdown", close);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  if (!on) return null;

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`hint-btn${tone === "light" ? " hint-btn--light" : ""}`}
        aria-label={`Подсказка: ${title ?? "что здесь"}`}
        aria-expanded={open}
        onMouseEnter={() => canHover() && setOpen(true)}
        onMouseLeave={() => canHover() && !pinned && setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          haptic.select();
          if (open && pinned) {
            setOpen(false);
            setPinned(false);
          } else {
            setOpen(true);
            setPinned(true);
          }
        }}
      >
        ?
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={bubble}
            className={`hint-bubble${pos.up ? " hint-bubble--up" : ""}`}
            style={{ top: pos.top, left: pos.left, width: Math.min(280, window.innerWidth - 24) }}
            role="tooltip"
            onMouseEnter={() => canHover() && setOpen(true)}
            onMouseLeave={() => canHover() && !pinned && setOpen(false)}
            onClick={(e) => e.stopPropagation()}
          >
            {title && <b>{title}</b>}
            <p>{text}</p>
            <div className="hint-bubble__actions">
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setOpen(false);
                  setPinned(false);
                }}
              >
                Понятно
              </button>
              <button type="button" className="hint-bubble__off" onClick={() => setHintsEnabled(false)}>
                Скрыть все подсказки
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
