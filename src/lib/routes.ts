import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getWebApp, haptic, isTma } from "@/lib/telegram";
import type { TabId } from "@/state/store";

/** Пути нижних вкладок. Всё остальное — вложенные экраны. */
export const TAB_PATHS: Record<TabId, string> = {
  home: "/",
  catalog: "/catalog",
  favorites: "/favorites",
  cart: "/cart",
  profile: "/profile",
};

export const ORDERS_PATH = "/orders";

export function productPath(id: string): string {
  return `/product/${encodeURIComponent(id)}`;
}

export function orderPath(id: string): string {
  return `${ORDERS_PATH}/${encodeURIComponent(id)}`;
}

/**
 * Какая вкладка подсвечивается на текущем пути. Карточка товара и детали
 * заказа живут без таб-бара, но заказы логически относятся к профилю.
 */
export function tabFromPath(pathname: string): TabId | null {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname === TAB_PATHS.catalog) return "catalog";
  if (pathname === TAB_PATHS.favorites) return "favorites";
  if (pathname === TAB_PATHS.cart) return "cart";
  if (
    pathname === TAB_PATHS.profile ||
    pathname === ORDERS_PATH ||
    pathname.startsWith(`${ORDERS_PATH}/`)
  ) {
    return "profile";
  }
  return null;
}

/**
 * «Назад» для экранов, открытых поверх вкладок. Если внутри приложения
 * уже есть история — идём по ней (так сохраняются скролл и фильтры),
 * иначе ведём на запасной маршрут: прямые ссылки тоже должны работать.
 */
export function useAppBack(fallback: string): () => void {
  const navigate = useNavigate();

  return useCallback(() => {
    haptic("light");
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [fallback, navigate]);
}

/**
 * Синхронизация нативной кнопки Telegram с браузерной историей.
 * Показываем её только на вложенных экранах, чтобы из табов не закрывать
 * Mini App случайным нажатием.
 */
export function useTelegramBackButton(visible: boolean, onBack: () => void): void {
  useEffect(() => {
    if (!isTma()) return;
    const app = getWebApp();
    if (!app) return;

    if (visible) app.BackButton.show();
    else app.BackButton.hide();

    app.BackButton.onClick(onBack);
    return () => {
      app.BackButton.offClick(onBack);
      if (visible) app.BackButton.hide();
    };
  }, [onBack, visible]);
}
