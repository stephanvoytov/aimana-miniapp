import {
  Heart,
  Home,
  LayoutGrid,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useStore, type TabId } from "@/state/store";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "catalog", label: "Каталог", icon: LayoutGrid },
  { id: "favorites", label: "Избранное", icon: Heart },
  { id: "cart", label: "Корзина", icon: ShoppingBag },
  { id: "profile", label: "Профиль", icon: User },
];

/**
 * Содержимое плавающей пилюли таб-бара (сама пилюля — в App).
 */
export function TabBar() {
  const { route, go, cartCount, cartPulse } = useStore();

  return (
    <nav aria-label="Основная навигация" className="flex py-1">
      {TABS.map((tab) => {
        const active = route.tab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className="flex flex-1 flex-col items-center gap-1 py-1 active:opacity-60"
            aria-current={active ? "page" : undefined}
            onClick={() => go(tab.id)}
          >
            <span className="relative" data-cart-target={tab.id === "cart" ? "" : undefined}>
              <span
                className={cn(
                  "block transition-transform duration-150 ease-out",
                  active ? "scale-100" : "active:scale-90",
                )}
              >
                <Icon
                  size={25}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={cn(
                    "transition-colors duration-150",
                    tab.id === "home" && active && "fill-accent",
                    active ? "text-accent" : "text-hint",
                  )}
                />
              </span>
              {tab.id === "cart" && cartCount > 0 && (
                <span
                  // pop привязан к «приземлению» полёта, а не к клику:
                  // key меняется только когда товар реально долетел
                  key={cartPulse}
                  className={cn(
                    cartPulse > 0 && "anim-badge",
                    "absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-ink",
                  )}
                >
                  {cartCount}
                </span>
              )}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                active ? "text-accent" : "text-hint",
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
