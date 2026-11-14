import { createRoot } from "react-dom/client";

import { App } from "@/App";
import CompareHome from "@/compare/CompareHome";
import { BRAND, applyBranding } from "@/config";
import { initTelegram } from "@/lib/telegram";
import { StoreProvider } from "@/state/store";

import "./index.css";

initTelegram();
applyBranding();
document.title = `${BRAND.name} — ${BRAND.tagline}`;

// /compare — страница с эталонным кодом пользователя для визуального сравнения
const isCompare = window.location.pathname.startsWith("/compare");

createRoot(document.getElementById("root")!).render(
  isCompare ? (
    <CompareHome />
  ) : (
    <StoreProvider>
      <App />
    </StoreProvider>
  ),
);
