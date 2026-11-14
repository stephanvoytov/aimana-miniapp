import {
  ChevronRight,
  Heart,
  LifeBuoy,
  Receipt,
  Share2,
  ShoppingBag,
} from "lucide-react";
import type { ReactNode } from "react";

import { BRAND } from "@/config";
import {
  haptic,
  openTelegramLink,
  shareCurrentApp,
  tgUser,
} from "@/lib/telegram";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/state/store";

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function ProfileScreen() {
  const { favs, cartCount, orders, go, showToast } = useStore();
  const user = tgUser();
  const last = orders[0];

  return (
    <div className="px-4 pb-5 pt-4">
      <h2 className="text-[22px] font-semibold">Профиль</h2>

      {/* пользователь */}
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-field px-4 py-3.5">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-accent">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[20px] font-semibold leading-none text-accent-ink">
              {(user?.first_name ?? "Г").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[16px] font-medium">
            {user?.first_name ?? "Гость"}
            {user?.username ? ` @${user.username}` : ""}
          </div>
          {!user && (
            <div className="text-[13px] text-hint">
              Данные Telegram появятся при открытии внутри мессенджера
            </div>
          )}
        </div>
      </div>

      {/* последний заказ */}
      {last && (
        <div className="mt-3 rounded-2xl bg-field px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] text-hint">
              <Receipt size={15} />
              Последний заказ
            </span>
            <span className="text-[13px] font-medium text-[#34c759]">
              Принят
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-[17px] font-semibold">{last.id}</span>
            <span className="text-[15px]">{formatPrice(last.total)}</span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between text-[13px] text-hint">
            <span>{last.count} шт.</span>
            <span>{dateFmt.format(new Date(last.date))}</span>
          </div>
          {orders.length > 1 && (
            <div className="mt-2 border-t border-line pt-2 text-[13px] text-hint">
              И ещё {orders.length - 1} ранее — хранятся на этом устройстве
            </div>
          )}
        </div>
      )}

      {/* разделы */}
      <div className="mt-3 overflow-hidden rounded-2xl bg-field">
        <Row
          icon={<Heart size={19} />}
          label="Избранное"
          trailing={String(favs.length)}
          onClick={() => go("favorites")}
        />
        <Row
          icon={<ShoppingBag size={19} />}
          label="Корзина"
          trailing={String(cartCount)}
          onClick={() => go("cart")}
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl bg-field">
        <Row
          icon={<Share2 size={19} />}
          label="Поделиться"
          onClick={async () => showToast(await shareCurrentApp())}
        />
        <Row
          icon={<LifeBuoy size={19} />}
          label="Поддержка"
          onClick={() => openTelegramLink(BRAND.supportUrl || "")}
        />
      </div>

      <div className="pt-6 text-center text-[13px] text-hint">
        Шаблон Telegram Mini App · v0.1
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  trailing,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  trailing?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex h-14 w-full items-center gap-3 border-t border-line px-4 text-left text-[15px] first:border-t-0 active:opacity-60"
      onClick={() => {
        haptic("light");
        onClick();
      }}
    >
      <span className="text-accent">{icon}</span>
      {label}
      {trailing !== undefined && (
        <span className="ml-auto text-[15px] tabular-nums text-hint">
          {trailing}
        </span>
      )}
      <ChevronRight size={18} className="text-hint" />
    </button>
  );
}
