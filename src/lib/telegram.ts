/**
 * Минимальная обвязка Telegram Mini Apps SDK.
 * Внутри Telegram доступен window.Telegram.WebApp (подключается в index.html);
 * в обычном браузере все функции — безопасные noop с фолбэками.
 */

type WebAppUser = {
  id?: number;
  first_name?: string;
  username?: string;
  photo_url?: string;
};

type WebAppLike = {
  ready: () => void;
  expand: () => void;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  initData: string;
  initDataUnsafe?: { user?: WebAppUser };
  /** Bot API 7.7+: без этого свайп-вниз в TMA закрывает приложение
      вместо того, чтобы скроллить страницу (у нас скролл — окном). */
  disableVerticalSwipes?: () => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  sendData: (data: string) => void;
  showPopup: (params: unknown, callback?: (id: string) => void) => void;
  openTelegramLink: (url: string) => void;
  onEvent?: (name: string, cb: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: WebAppLike };
  }
}

export function getWebApp(): WebAppLike | null {
  return window.Telegram?.WebApp ?? null;
}

export function isTma(): boolean {
  // Сам по себе telegram-web-app.js создаёт заглушку и в обычном браузере
  // (platform: "unknown", пустой initData). Настоящий запуск — только
  // когда platform известна и не "unknown".
  const app = getWebApp();
  if (!app) return false;
  return typeof app.platform === "string" && app.platform !== "" && app.platform !== "unknown";
}

/** Перекладываем themeParams Telegram в наши CSS-переменные. */
export function applyTelegramTheme(): void {
  const app = getWebApp();
  if (!app) return;

  const root = document.documentElement;
  root.dataset.tgScheme = app.colorScheme;

  const p = app.themeParams ?? {};
  const set = (cssVar: string, value: string | undefined) => {
    if (value) root.style.setProperty(cssVar, value);
  };

  set("--tg-page-bg", p.bg_color);
  set("--tg-text", p.text_color);
  set("--tg-hint", p.hint_color);
  set("--tg-accent", p.button_color ?? p.link_color);
  set("--tg-accent-ink", p.button_text_color);
  set("--tg-line", p.section_separator_color);
}

export function initTelegram(): void {
  if (!isTma()) return;
  const app = getWebApp()!;
  applyTelegramTheme();
  app.ready();
  app.expand();
  try {
    app.disableVerticalSwipes?.();
  } catch {
    /* старые клиенты без Bot API 7.7 — просто живут со свайпом-закрытием */
  }
  app.onEvent?.("themeChanged", applyTelegramTheme);
}

export function tgUser(): WebAppUser | null {
  return getWebApp()?.initDataUnsafe?.user ?? null;
}

type HapticKind = "light" | "medium" | "success" | "error" | "selection";

export function haptic(kind: HapticKind): void {
  const hf = getWebApp()?.HapticFeedback;
  if (!hf) return;
  switch (kind) {
    case "light":
      hf.impactOccurred("light");
      break;
    case "medium":
      hf.impactOccurred("medium");
      break;
    case "success":
      hf.notificationOccurred("success");
      break;
    case "error":
      hf.notificationOccurred("error");
      break;
    case "selection":
      hf.selectionChanged();
      break;
  }
}

/** Отправка заказа боту (нужен bot-side приём initData/sendData). */
export function sendToBot(payload: unknown): boolean {
  const app = getWebApp();
  if (!app || !app.initData) return false;
  app.sendData(JSON.stringify(payload));
  return true;
}

export function openTelegramLink(url: string): void {
  const app = getWebApp();
  if (app?.initData) app.openTelegramLink(url);
  else window.open(url, "_blank");
}

export async function shareCurrentApp(): Promise<string> {
  const url = window.location.href;
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
  };
  if (nav.share) {
    try {
      await nav.share({ title: "aimana shop", text: "Каталог — внутри Telegram", url });
      return "Готово";
    } catch {
      /* пользователь закрыл шаринг */
      return "Отменено";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Ссылка скопирована";
  } catch {
    return "Не удалось поделиться";
  }
}
