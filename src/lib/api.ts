// src/lib/api.ts — клиент к бэкенду (Express). При пустом VITE_API_URL
// работает в demo-режиме (данные из src/data/products.ts, состояние в localStorage).
import { API_BASE } from "@/config";

function initDataHeader(): Record<string, string> {
  const tg = (window as any).Telegram?.WebApp;
  const initData = tg?.initData || "";
  const headers: Record<string, string> = {};
  if (initData) headers["X-Telegram-Init-Data"] = initData;
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  return headers;
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...initDataHeader(),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => apiFetch<{ ok: boolean }>("/api/health"),
  me: () => apiFetch("/api/me"),
  products: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/api/products${qs}`);
  },
  product: (id: string) => apiFetch(`/api/products/${id}`),
  cart: () => apiFetch("/api/cart"),
  addToCart: (productId: string, size: string, color: string, qty: number) =>
    apiFetch("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, size, color, qty }),
    }),
  setQty: (lineId: string, qty: number) =>
    apiFetch(`/api/cart/items/${encodeURIComponent(lineId)}`, {
      method: "PUT",
      body: JSON.stringify({ qty }),
    }),
  clearCart: () => apiFetch("/api/cart", { method: "DELETE" }),
  orders: () => apiFetch("/api/orders"),
  createOrder: (customer: any, discount: number) =>
    apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({ customer, discount, clearCart: true }),
    }),
  favorites: () => apiFetch("/api/favorites"),
  toggleFavorite: (productId: string) =>
    apiFetch("/api/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
};

export { API_BASE, DEMO_MODE } from "@/config";