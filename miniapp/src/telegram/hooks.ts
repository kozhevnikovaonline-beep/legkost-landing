import { useEffect, useRef } from "react";
import { getWebApp } from "./sdk";

/*
 * Системная кнопка «Назад» Telegram. Обработчики складываются в стек:
 * срабатывает только верхний (открытый лист закрывается раньше, чем уходит экран).
 */
const backStack: { current: () => void }[] = [];
let backBound = false;

function syncBackButton() {
  const wa = getWebApp();
  if (!wa?.isVersionAtLeast("6.1")) return;
  if (!backBound) {
    wa.BackButton.onClick(() => backStack[backStack.length - 1]?.current());
    backBound = true;
  }
  if (backStack.length) wa.BackButton.show();
  else wa.BackButton.hide();
}

export function useBackButton(visible: boolean, onBack: () => void) {
  const cb = useRef(onBack);
  cb.current = onBack;
  useEffect(() => {
    if (!visible) return;
    const entry = cb;
    backStack.push(entry);
    syncBackButton();
    return () => {
      const i = backStack.lastIndexOf(entry);
      if (i >= 0) backStack.splice(i, 1);
      syncBackButton();
    };
  }, [visible]);
}

export interface MainButtonOptions {
  text: string;
  visible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  shine?: boolean;
  onClick: () => void;
}

/**
 * Нижняя кнопка Telegram (MainButton). Возвращает true, если кнопка показана
 * нативно — тогда экран не рисует свою копию.
 */
export function useMainButton({ text, visible = true, disabled, loading, shine, onClick }: MainButtonOptions): boolean {
  const wa = getWebApp();
  const native = Boolean(wa?.isVersionAtLeast("7.0"));
  const cb = useRef(onClick);
  cb.current = onClick;

  useEffect(() => {
    if (!native || !wa) return;
    const mb = wa.MainButton;
    const handler = () => cb.current();
    mb.onClick(handler);
    return () => {
      mb.offClick(handler);
      mb.hideProgress();
      mb.hide();
    };
  }, [native, wa]);

  useEffect(() => {
    if (!native || !wa) return;
    const mb = wa.MainButton;
    mb.setParams({
      text,
      color: disabled ? "#3A2C36" : "#DB1068",
      text_color: "#FFFFFF",
      is_active: !disabled,
      is_visible: visible,
      has_shine_effect: Boolean(shine) && !disabled,
    });
    if (loading) mb.showProgress(false);
    else mb.hideProgress();
  }, [native, wa, text, visible, disabled, loading, shine]);

  return native;
}
