import {
  Bell,
  Check,
  ChevronRight,
  Gift,
  Heart,
  Infinity as InfinityIcon,
  LifeBuoy,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Package,
  Pencil,
  Settings,
  Share2,
  Sparkle,
  Star,
  Sun,
  SunMoon,
  Ticket,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { BRAND } from "@/config";
import { ORDERS_PATH } from "@/lib/routes";
import {
  haptic,
  openTelegramLink,
  shareCurrentApp,
  tgUser,
} from "@/lib/telegram";
import {
  getThemeMode,
  setThemeMode,
  type ThemeMode,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/store";

const RATING = "4,8";

type SheetId =
  | "profile"
  | "promos"
  | "notifications"
  | "addresses"
  | "theme"
  | "settings"
  | "bonus"
  | "logout"
  | null;

type NotificationSettings = {
  orders: boolean;
  collections: boolean;
  promos: boolean;
};

type Address = { id: string; label: string; value: string };

const NOTIFICATIONS_KEY = "aimana.profile.notifications";
const ADDRESSES_KEY = "aimana.profile.addresses";

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  orders: true,
  collections: false,
  promos: true,
};

const THEME_OPTIONS: {
  id: ThemeMode;
  label: string;
  hint: string;
  icon: typeof Sun;
}[] = [
  {
    id: "light",
    label: "Светлая",
    hint: "Всегда светлое оформление",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Тёмная",
    hint: "Всегда тёмное оформление",
    icon: Moon,
  },
  {
    id: "system",
    label: "Системная",
    hint: "Как в Telegram или на устройстве",
    icon: Monitor,
  },
];

/**
 * Профиль в духе iOS-аккаунта: крупный аватар, статистика, меню разделов,
 * бонусный баннер и выход. Разделы открываются шторками — так экран остаётся
 * коротким, а данные (заказы, адреса, настройки) не теряются.
 */
export function ProfileScreen() {
  const { orders, go, showToast, clearCart, clearFavs, clearOrders } = useStore();
  const navigate = useNavigate();
  const user = tgUser();
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Гость";
  const handle = user?.username ? `@${user.username}` : "@guest";
  const initial = (user?.first_name?.trim()[0] ?? "Г").toUpperCase();

  const [sheet, setSheet] = useState<SheetId>(null);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode);
  const [notifications, setNotifications] = useStoredState(
    NOTIFICATIONS_KEY,
    DEFAULT_NOTIFICATIONS,
  );
  const [addresses, setAddresses] = useStoredState<Address[]>(ADDRESSES_KEY, []);
  const [draft, setDraft] = useState({ label: "", value: "" });

  const open = (id: Exclude<SheetId, null>) => setSheet(id);
  const close = () => setSheet(null);

  const share = async () => showToast(await shareCurrentApp());

  const support = () => {
    if (!BRAND.supportUrl) {
      showToast("Поддержка ещё не подключена");
      return;
    }
    openTelegramLink(BRAND.supportUrl);
  };

  const chooseTheme = (mode: ThemeMode) => {
    haptic("selection");
    setThemeMode(mode);
    setThemeModeState(mode);
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    haptic("selection");
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addAddress = () => {
    if (draft.value.trim().length < 5) return;
    haptic("success");
    setAddresses((prev) => [
      {
        id: String(Date.now()),
        label: draft.label.trim() || "Адрес",
        value: draft.value.trim(),
      },
      ...prev,
    ]);
    setDraft({ label: "", value: "" });
    showToast("Адрес сохранён");
  };

  const removeAddress = (id: string) => {
    haptic("light");
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const logout = () => {
    haptic("success");
    clearCart();
    clearFavs();
    clearOrders();
    close();
    showToast("Локальные данные очищены");
  };

  return (
    <div className="px-4 pb-5 pt-4">
      {/* профиль */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar
            photo={user?.photo_url}
            initial={initial}
            className="size-[88px]"
            initialClassName="text-[34px]"
          />
          <button
            className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full border border-line bg-page text-ink shadow-sm transition-transform active:scale-90"
            aria-label="Данные профиля"
            onClick={() => {
              haptic("light");
              open("profile");
            }}
          >
            <Pencil size={14} strokeWidth={2.1} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[24px] font-semibold leading-tight tracking-[-0.01em]">
            {name}
          </div>
          <div className="mt-0.5 truncate text-[16px] leading-tight text-hint">
            {handle}
          </div>
        </div>

        <button
          className="flex size-11 shrink-0 items-center justify-center self-start rounded-[14px] bg-field transition-opacity active:opacity-60"
          aria-label="Настройки"
          onClick={() => {
            haptic("light");
            open("settings");
          }}
        >
          <Settings size={22} strokeWidth={1.8} />
        </button>
      </div>

      {/* статистика */}
      <div className="mt-4 flex rounded-2xl bg-field py-3">
        <Stat value={String(orders.length)} label="Покупок" />
        <div aria-hidden className="h-8 w-px self-center bg-line" />
        <Stat
          label="Рейтинг"
          value={
            <span className="flex items-center gap-1">
              {RATING}
              <Star size={15} className="fill-ink text-ink" strokeWidth={1.5} />
            </span>
          }
        />
        <div aria-hidden className="h-8 w-px self-center bg-line" />
        <Stat
          label="Бонусы"
          value={<InfinityIcon size={24} strokeWidth={2.2} />}
        />
      </div>

      {/* разделы */}
      <div className="mt-4 overflow-hidden rounded-[22px] border border-line bg-page">
        <MenuRow
          first
          icon={<Package size={22} strokeWidth={1.8} />}
          label="Мои заказы"
          onClick={() => navigate(ORDERS_PATH)}
        />
        <MenuRow
          icon={<Heart size={22} strokeWidth={1.8} />}
          label="Избранное"
          onClick={() => go("favorites")}
        />
        <MenuRow
          icon={<Ticket size={22} strokeWidth={1.8} />}
          label="Промокоды"
          onClick={() => open("promos")}
        />
        <MenuRow
          icon={<Bell size={22} strokeWidth={1.8} />}
          label="Уведомления"
          onClick={() => open("notifications")}
        />
        <MenuRow
          icon={<MapPin size={22} strokeWidth={1.8} />}
          label="Адреса доставки"
          onClick={() => open("addresses")}
        />
        <MenuRow
          icon={<SunMoon size={22} strokeWidth={1.8} />}
          label="Тема оформления"
          value={THEME_OPTIONS.find((option) => option.id === themeMode)?.label}
          onClick={() => open("theme")}
        />
      </div>

      {/* бонусы */}
      <div className="relative mt-4 overflow-hidden rounded-[24px] bg-field px-4 pb-4 pt-4">
        <div className="relative z-10 max-w-[64%]">
          <div className="text-[21px] font-bold leading-[1.12] tracking-[-0.01em]">
            Бонусы
            <br />
            за покупки
          </div>
          <div className="mt-2 text-[13px] leading-[1.35] text-hint">
            Покупайте чаще —
            <br />
            получайте больше
          </div>
          <button
            className="mt-3 flex h-9 items-center rounded-full bg-ink px-4 text-[14px] font-medium text-page transition-opacity active:opacity-70"
            onClick={() => {
              haptic("light");
              open("bonus");
            }}
          >
            Подробнее
          </button>
        </div>

        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-page px-2.5 py-1 text-[13px] font-semibold shadow-sm">
          +250 <Star size={13} className="fill-[#f5b301] text-[#f5b301]" />
        </div>

        {/* заглушка под 3D-баннер подарка */}
        <div
          aria-hidden
          className="absolute -bottom-5 -right-5 flex size-[158px] items-center justify-center rounded-full bg-page/50"
        >
          <Gift size={62} strokeWidth={1.1} className="text-hint/60" />
        </div>

        <Sparkle
          aria-hidden
          size={15}
          className="absolute right-[45%] top-8 fill-white text-white/90"
        />
        <Sparkle
          aria-hidden
          size={22}
          className="absolute bottom-7 right-3 fill-white text-white/80"
        />
      </div>

      {/* выход */}
      <button
        className="mt-4 flex h-[58px] w-full items-center gap-3.5 rounded-[20px] bg-field px-4 text-left transition-opacity active:opacity-60"
        onClick={() => {
          haptic("light");
          open("logout");
        }}
      >
        <LogOut size={22} strokeWidth={1.8} />
        <span className="text-[16px]">Выйти из аккаунта</span>
        <ChevronRight size={18} strokeWidth={2} className="ml-auto text-hint" />
      </button>

      {/* шторки */}
      <ProfileSheet
        open={sheet === "profile"}
        onOpenChange={(v) => !v && close()}
        title="Профиль"
      >
        <div className="flex flex-col items-center pb-1 pt-2 text-center">
          <Avatar
            photo={user?.photo_url}
            initial={initial}
            className="size-20"
            initialClassName="text-[30px]"
          />
          <div className="mt-3 text-[18px] font-semibold">{name}</div>
          <div className="text-[15px] text-hint">{handle}</div>
          <p className="mt-4 max-w-[290px] text-[13px] leading-relaxed text-hint">
            {user
              ? "Имя, @username и фото приходят из вашего профиля Telegram. Изменить их можно в настройках мессенджера."
              : "Приложение открыто вне Telegram, поэтому профиль гостевой. Откройте его через бота, чтобы подтянуть имя и фото."}
          </p>
          <Button variant="field" className="mt-4 w-full" onClick={close}>
            Понятно
          </Button>
        </div>
      </ProfileSheet>

      <ProfileSheet
        open={sheet === "promos"}
        onOpenChange={(v) => !v && close()}
        title="Промокоды"
      >
        <EmptyState
          icon={<Ticket size={26} strokeWidth={1.6} />}
          title="Промокодов пока нет"
          text="Акции и персональные предложения появятся здесь."
        />
      </ProfileSheet>

      <ProfileSheet
        open={sheet === "notifications"}
        onOpenChange={(v) => !v && close()}
        title="Уведомления"
      >
        <div className="overflow-hidden rounded-2xl bg-field">
          <SwitchRow
            first
            label="Статусы заказов"
            checked={notifications.orders}
            onChange={() => toggleNotification("orders")}
          />
          <SwitchRow
            label="Новые коллекции"
            checked={notifications.collections}
            onChange={() => toggleNotification("collections")}
          />
          <SwitchRow
            label="Скидки и акции"
            checked={notifications.promos}
            onChange={() => toggleNotification("promos")}
          />
        </div>
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-hint">
          Настройки сохраняются на этом устройстве.
        </p>
      </ProfileSheet>

      <ProfileSheet
        open={sheet === "addresses"}
        onOpenChange={(v) => !v && close()}
        title="Адреса доставки"
      >
        {addresses.length === 0 ? (
          <p className="px-1 pb-1 text-[13px] leading-relaxed text-hint">
            Сохранённых адресов пока нет. Добавьте первый — он пригодится при
            оформлении заказа.
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-2xl bg-field p-3.5"
              >
                <MapPin
                  size={19}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-hint"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium">{a.label}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-hint">
                    {a.value}
                  </div>
                </div>
                <button
                  className="shrink-0 p-0.5 text-hint transition-colors active:text-ink"
                  aria-label={`Удалить адрес ${a.label}`}
                  onClick={() => removeAddress(a.id)}
                >
                  <Trash2 size={17} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Input
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Название — например, Дом"
            className="h-11 text-[15px]"
          />
          <Input
            value={draft.value}
            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
            placeholder="Город, улица, дом, квартира"
            className="h-11 text-[15px]"
          />
          <Button
            className="w-full"
            disabled={draft.value.trim().length < 5}
            onClick={addAddress}
          >
            Добавить адрес
          </Button>
        </div>
        <p className="mt-3 px-1 text-[12px] leading-relaxed text-hint">
          Адреса хранятся на этом устройстве.
        </p>
      </ProfileSheet>

      <ProfileSheet
        open={sheet === "theme"}
        onOpenChange={(v) => !v && close()}
        title="Тема оформления"
      >
        <div
          className="overflow-hidden rounded-2xl bg-field"
          role="radiogroup"
          aria-label="Тема оформления"
        >
          {THEME_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const active = option.id === themeMode;
            return (
              <button
                key={option.id}
                role="radio"
                aria-checked={active}
                className={cn(
                  "flex w-full items-center gap-3.5 px-4 text-left outline-none transition-opacity active:opacity-60",
                  index > 0 && "border-t border-line",
                )}
                onClick={() => chooseTheme(option.id)}
              >
                <span className="flex size-6 shrink-0 items-center justify-center text-ink">
                  <Icon size={21} strokeWidth={1.8} />
                </span>
                <span className="flex min-h-[58px] flex-1 items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-[16px]">{option.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-hint">
                      {option.hint}
                    </span>
                  </span>
                  {active && (
                    <Check
                      size={20}
                      strokeWidth={2.2}
                      className="shrink-0 text-accent"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-hint">
          «Системная» следует теме Telegram, а вне Telegram — настройкам
          устройства. Выбор сохраняется на этом устройстве.
        </p>
      </ProfileSheet>

      <ProfileSheet
        open={sheet === "settings"}
        onOpenChange={(v) => !v && close()}
        title="Настройки"
      >
        <div className="overflow-hidden rounded-2xl bg-field">
          <MenuRow
            first
            icon={<Share2 size={22} strokeWidth={1.8} />}
            label="Поделиться приложением"
            onClick={share}
          />
          <MenuRow
            icon={<LifeBuoy size={22} strokeWidth={1.8} />}
            label="Поддержка"
            onClick={support}
          />
        </div>
        <div className="pt-5 text-center text-[13px] leading-relaxed text-hint">
          {BRAND.name} · {BRAND.tagline}
          <br />
          Шаблон Telegram Mini App · v0.1
        </div>
      </ProfileSheet>

      <ProfileSheet
        open={sheet === "bonus"}
        onOpenChange={(v) => !v && close()}
        title="Бонусы за покупки"
      >
        <div className="relative overflow-hidden rounded-2xl bg-field p-4">
          <div className="flex items-center gap-2 text-[28px] font-bold">
            +250
            <Star size={24} className="fill-[#f5b301] text-[#f5b301]" />
          </div>
          <div className="mt-0.5 text-[13px] text-hint">за каждую покупку</div>
          <p className="mt-3 text-[14px] leading-relaxed">
            Начисляем бонусы после оплаты заказа. 1 бонус = 1 ₽ — можно
            оплатить до 30% следующей покупки.
          </p>
        </div>
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-hint">
          Бонусы начисляются автоматически и хранятся в вашем профиле.
        </p>
        <Button className="mt-4 w-full" onClick={close}>
          Понятно
        </Button>
      </ProfileSheet>

      <ProfileSheet
        open={sheet === "logout"}
        onOpenChange={(v) => !v && close()}
        title="Выйти из аккаунта"
      >
        <div className="pt-1">
          <p className="text-[14px] leading-relaxed text-hint">
            Локальные данные — избранное, корзина и история заказов — будут
            очищены. Это действие нельзя отменить.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="field" className="flex-1" onClick={close}>
              Отмена
            </Button>
            <Button
              className="flex-1 bg-[#ff3b30] text-white"
              onClick={logout}
            >
              Выйти
            </Button>
          </div>
        </div>
      </ProfileSheet>
    </div>
  );
}

function Avatar({
  photo,
  initial,
  className,
  initialClassName,
}: {
  photo?: string;
  initial: string;
  className?: string;
  initialClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-full bg-ink", className)}>
      {photo ? (
        <img src={photo} alt="" className="size-full object-cover" />
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center font-medium leading-none text-page",
            initialClassName,
          )}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      <div className="flex h-6 items-center text-[17px] font-semibold leading-none">
        {value}
      </div>
      <div className="text-[12px] leading-none text-hint">{label}</div>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  value,
  onClick,
  first = false,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
  first?: boolean;
}) {
  return (
    <button
      className="flex w-full items-center gap-3.5 pl-4 pr-3.5 text-left outline-none transition-opacity active:opacity-60"
      onClick={() => {
        haptic("light");
        onClick();
      }}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-ink">
        {icon}
      </span>
      <span
        className={cn(
          "flex h-[54px] flex-1 items-center border-t border-line",
          first && "border-t-0",
        )}
      >
        <span className="text-[16px]">{label}</span>
        {value && (
          <span className="ml-auto mr-1 text-[15px] text-hint">{value}</span>
        )}
        <ChevronRight
          size={18}
          strokeWidth={2}
          className={cn("shrink-0 text-hint", !value && "ml-auto")}
        />
      </span>
    </button>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
  first = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  first?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4",
        !first && "border-t border-line",
      )}
    >
      <span className="py-3.5 text-[15px]">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn(
          "relative h-[30px] w-[50px] shrink-0 rounded-full outline-none transition-colors duration-200",
          checked ? "bg-[#34c759]" : "bg-hint/35",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-[2px] size-[26px] rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-[2px]",
          )}
        />
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <div className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-field text-hint">
        {icon}
      </div>
      <div className="text-[17px] font-semibold">{title}</div>
      <div className="max-w-[260px] text-[14px] leading-relaxed text-hint">
        {text}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function ProfileSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="-mx-4 max-h-[68dvh] overflow-y-auto overscroll-contain px-4 pb-2">
        {children}
      </div>
    </Sheet>
  );
}

function useStoredState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* приватный режим или переполненное хранилище — живём без сохранения */
    }
  }, [key, value]);

  return [value, setValue];
}
