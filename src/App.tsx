import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CartFooter } from "@/components/CartFooter";
import { ProductFooter } from "@/components/ProductFooter";
import { TabBar } from "@/components/TabBar";
import { getWebApp, isTma } from "@/lib/telegram";
import { useStore } from "@/state/store";
import { AdminScreen } from "@/screens/AdminScreen";
import { CartScreen } from "@/screens/CartScreen";
import { CatalogScreen } from "@/screens/CatalogScreen";
import { FavoritesScreen } from "@/screens/FavoritesScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { ProductScreen } from "@/screens/ProductScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";

export function App() {
  const { route, closeProduct, toast, cartCount } = useStore();
  const onProduct = route.productId !== null;

  // админка: токен из ?admin=TOKEN сохраняется в localStorage
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem("adminToken"));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("admin");
    if (t) {
      localStorage.setItem("adminToken", t);
      setIsAdmin(true);
      params.delete("admin");
      const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  if (isAdmin) {
    return <AdminScreen />;
  }

  const screenKey = `${route.tab}${route.productId ?? ""}`;

  // buttery scroll: помним позицию каждого экрана, возвращаем при приходе назад
  // (скролл — окном, см. index.css)
  const scrollPos = useRef<Record<string, number>>({});
  const lastKey = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (lastKey.current && lastKey.current !== screenKey) {
      scrollPos.current[lastKey.current] = window.scrollY;
    }
    window.scrollTo({
      top: scrollPos.current[screenKey] ?? 0,
      behavior: "instant" as ScrollBehavior,
    });
    lastKey.current = screenKey;
  }, [screenKey]);

  // нативная кнопка «Назад» Telegram = выход на главный экран
  useEffect(() => {
    if (!isTma()) return;
    const app = getWebApp();
    if (!app) return;
    const handler = () => closeProduct();
    if (onProduct) app.BackButton.show();
    else app.BackButton.hide();
    app.BackButton.onClick(handler);
    return () => app.BackButton.offClick(handler);
  }, [onProduct, closeProduct]);

  // «Главная» — витрина: подборки и категории. «Каталог» — вся сетка
  // товаров с поиском, чипсами и фильтрами. Раньше обе вкладки открывали
  // сетку, и навигация дублировалась.
  let screen = <HomeScreen />;
  if (onProduct) screen = <ProductScreen />;
  else if (route.tab === "catalog") screen = <CatalogScreen />;
  else if (route.tab === "favorites") screen = <FavoritesScreen />;
  else if (route.tab === "cart") screen = <CartScreen />;
  else if (route.tab === "profile") screen = <ProfileScreen />;

  // нижняя зона: футер действия (экран товара / корзина с товарами)
  // плюс таб-бар — плавающие стеклянные пилюли поверх контента
  const showActionBar = onProduct || (route.tab === "cart" && cartCount > 0);
  // обе пилюли видны одновременно только на корзине с товарами — тогда они
  // складываются стопкой (футер над таб-баром) и занимают вдвое больше места
  const stackedPills = showActionBar && !onProduct;

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md">
      {/* key меняет экран целиком: push для товара, мягкий fade для табов */}
      <div key={screenKey} className={onProduct ? "anim-push" : "anim-screen"}>
        {screen}
      </div>

      {/*
        Прокладка: контент уезжает под плавающий хром, но не прячется за
        ним. Одна пилюля (таб-бар или футер товара) занимает ~76px, две
        (футер корзины над таб-баром) — ~148px, поэтому на корзине с товарами
        прокладка выше: иначе последняя позиция списка уходит под хром.
      */}
      <div
        aria-hidden
        className={
          stackedPills
            ? "h-[calc(180px+env(safe-area-inset-bottom))]"
            : "h-[calc(108px+env(safe-area-inset-bottom))]"
        }
      />

      {/*
        Якорь нижнего хрома: fixed-контейнер с z-30. Пилюли стабильны —
        React меняет только их содержимое, поэтому смена экрана не мигает.
      */}
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
            <ProductFooter />
          ) : showActionBar ? (
            <CartFooter />
          ) : null}
        </div>
        <div className="surface-pill rounded-full" hidden={onProduct}>
          <TabBar />
        </div>
      </div>

      {toast && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-[calc(156px+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4"
        >
          <div className="anim-toast whitespace-nowrap rounded-full bg-black/80 px-4 py-2 text-[13px] text-white">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
