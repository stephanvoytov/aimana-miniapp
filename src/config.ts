// src/config.ts — единая точка брендинга шаблона.
// Клиент меняет значения здесь (и/или через VITE_* env), не трогая компоненты.
export const BRAND = {
  name: import.meta.env.VITE_BRAND_NAME || "Aimana",
  tagline: import.meta.env.VITE_BRAND_TAGLINE || "мини-приложение",
  logoUrl: import.meta.env.VITE_BRAND_LOGO || null,
  supportUrl: import.meta.env.VITE_SUPPORT_URL || null,
  currency: import.meta.env.VITE_CURRENCY || "₽",
  locale: import.meta.env.VITE_LOCALE || "ru-RU",
  // акцентные цвета (подставляются в CSS-переменные при старте)
  accent: import.meta.env.VITE_ACCENT_COLOR || "#007aff",
  accentInk: import.meta.env.VITE_ACCENT_INK || "#ffffff",
};

export const API_BASE = import.meta.env.VITE_API_URL || ""; // пусто = same origin / mock
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "1";
export function applyBranding(): void {
  const root = document.documentElement;
  root.style.setProperty("--tg-accent", BRAND.accent);
  root.style.setProperty("--tg-accent-ink", BRAND.accentInk);
  // allow overriding page/card bg via env if provided
  if (import.meta.env.VITE_PAGE_BG) root.style.setProperty("--tg-page-bg", import.meta.env.VITE_PAGE_BG);
}