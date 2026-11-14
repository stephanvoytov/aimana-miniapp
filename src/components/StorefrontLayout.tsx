import { useEffect, useLayoutEffect, useRef } from "react";
import { matchPath, Outlet, useLocation } from "react-router-dom";

import { CartFooter } from "@/components/CartFooter";
import { ProductFooter } from "@/components/ProductFooter";
import { TabBar } from "@/components/TabBar";
import {
  ORDERS_PATH,
  TAB_PATHS,
  useAppBack,
  useTelegramBackButton,
} from "@/lib/routes";
import { useStore } from "@/state/store";

/**
 * Общая оболочка витрины: экран маршрута + плавающий нижний хром.
 * Шапка и таб-бар не перемонтируются при переходах — меняется только
 * содержимое Outlet, поэтому навигация ощущается как в нативном приложении.
 */
export function StorefrontLayout() {
  const { pathname } = useLocation();
  const { toast, cartCount } = useStore();

  const productMatch = matchPath("/product/:slug", pathname);
  const productSlug = productMatch?.params.slug ?? null;
  const onProduct = productSlug !== null;
  const onOrders =
    pathname === ORDERS_PATH || pathname.startsWith(`${ORDERS_PATH}/`);
  const isOrderDetails = pathname.startsWith(`${ORDERS_PATH}/`);

  const showActionBar =
    onProduct || (pathname === TAB_PATHS.cart && cartCount > 0);
  const stackedPills = showActionBar && !onProduct;
  const pushScreen = onProduct || onOrders;

  // Telegram BackButton: только на вложенных экранах, с фолбэком для
  // прямых ссылок (история внутри приложения может быть пустой).
  const fallback = onProduct
    ? TAB_PATHS.catalog
    : isOrderDetails
      ? ORDERS_PATH
      : TAB_PATHS.profile;
  const back = useAppBack(fallback);
  useTelegramBackButton(onProduct || onOrders, back);

  // Позиция скролла запоминается по пути экрана. Слушаем scroll и
  // pointerdown: к моменту перехода позиция уже сохранена, даже если
  // новая страница короче и браузер успел бы её обрезать.
  const scrollPos = useRef<Record<string, number>>({});
  useEffect(() => {
    const save = () => {
      scrollPos.current[pathname] = window.scrollY;
    };
    save();
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("pointerdown", save, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("scroll", save);
      window.removeEventListener("pointerdown", save, { capture: true });
    };
  }, [pathname]);

  useLayoutEffect(() => {
    window.scrollTo({
      top: scrollPos.current[pathname] ?? 0,
      behavior: "instant" as ScrollBehavior,
    });
  }, [pathname]);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md">
      {/* key меняет экран целиком: push для вложенных, мягкий fade для табов */}
      <div key={pathname} className={pushScreen ? "anim-push" : "anim-screen"}>
        <Outlet />
      </div>

      {/*
        Прокладка: контент уезжает под плавающий хром, но не прячется за
        ним. Одна пилюля — ~76px, две (футер корзины над таб-баром) — ~148px.
      */}
      <div
        aria-hidden
        className={
          stackedPills
            ? "h-[calc(180px+env(safe-area-inset-bottom))]"
            : "h-[calc(108px+env(safe-area-inset-bottom))]"
        }
      />

      {/* Якорь нижнего хрома: fixed-контейнер, пилюли не мигают при смене экрана */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1">
        <div
          className={
            stackedPills
              ? "surface-pill mb-2 rounded-full"
              : "surface-pill rounded-full"
          }
          hidden={!showActionBar}
        >
          {onProduct ? (
            <ProductFooter slug={productSlug} />
          ) : showActionBar ? (
            <CartFooter />
          ) : null}
        </div>
        <div className="surface-pill rounded-full" hidden={onProduct}>
          <TabBar />
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(156px+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4">
          <div className="anim-toast whitespace-nowrap rounded-full bg-black/80 px-4 py-2 text-[13px] text-white">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
