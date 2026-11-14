/**
 * Тема оформления: «светлая», «тёмная» или «как в системе».
 *
 * В режиме «системная» тему задаёт Telegram (внутри Mini App) или
 * prefers-color-scheme браузера. Принудительные режимы перекрывают
 * Telegram-палитру и используют наши CSS-переменные из index.css.
 */

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "aimana.theme";

/** Переменные, которые Telegram выставляет инлайново. */
const INLINE_THEME_VARS = [
  "--tg-page-bg",
  "--tg-card-bg",
  "--tg-field-bg",
  "--tg-text",
  "--tg-hint",
  "--tg-line",
  "--tg-tag-bg",
  "--tg-tag-text",
];

let systemHandler: (() => void) | null = null;

/** Telegram регистрирует здесь повторное применение своей темы. */
export function registerSystemThemeHandler(handler: (() => void) | null): void {
  systemHandler = handler;
}

export function getThemeMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function setThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* приватный режим — тема просто не переживёт перезагрузку */
  }
  applyThemeMode(mode);
}

export function applyThemeMode(mode: ThemeMode = getThemeMode()): void {
  const root = document.documentElement;

  // Снимаем цвета Telegram, чтобы не спорить с выбранной палитрой.
  for (const name of INLINE_THEME_VARS) {
    root.style.removeProperty(name);
  }

  if (mode === "system") {
    delete root.dataset.tgScheme;
    systemHandler?.();
    return;
  }

  root.dataset.tgScheme = mode;
}
