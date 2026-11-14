import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "@/App";
import CompareHome from "@/compare/CompareHome";
import { BRAND, applyBranding } from "@/config";
import { initTelegram } from "@/lib/telegram";
import { applyThemeMode } from "@/lib/theme";
import { StoreProvider } from "@/state/store";

import "./index.css";

initTelegram();
applyBranding();
applyThemeMode();
document.title = `${BRAND.name} — ${BRAND.tagline}`;

// скролл восстанавливаем сами (по пути экрана), чтобы браузер не спорил
// с нашим сохранением позиции каталога при возврате с товара
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// /compare — страница с эталонным кодом пользователя для визуального сравнения
const isCompare = window.location.pathname.startsWith("/compare");

createRoot(document.getElementById("root")!).render(
  isCompare ? (
    <CompareHome />
  ) : (
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  ),
);
