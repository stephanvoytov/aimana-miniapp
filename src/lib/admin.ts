// src/lib/admin.ts — admin API client, types and formatting helpers.
import { API_BASE } from "@/config";

export class AdminAuthError extends Error {
  constructor(message = "Неверный токен администратора") {
    super(message);
    this.name = "AdminAuthError";
  }
}

const TOKEN_KEY = "adminToken";

export function getAdminToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function saveAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token.trim());
  } catch {
    /* приватный режим */
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* приватный режим */
  }
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": getAdminToken(),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new AdminAuthError();
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* тело не JSON */
    }
    throw new Error(message || `Ошибка ${res.status}`);
  }

  return (await res.json()) as T;
}

export type OrderStatus =
  | "new"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; pill: string; dot: string }
> = {
  new: {
    label: "Новый",
    pill: "bg-adm-blue-soft text-adm-blue",
    dot: "bg-adm-blue",
  },
  processing: {
    label: "В работе",
    pill: "bg-adm-amber-soft text-adm-amber",
    dot: "bg-adm-amber",
  },
  shipped: {
    label: "Отправлен",
    pill: "bg-[#f3edff] text-[#7c3aed]",
    dot: "bg-[#7c3aed]",
  },
  delivered: {
    label: "Доставлен",
    pill: "bg-adm-green-soft text-adm-green",
    dot: "bg-adm-green",
  },
  cancelled: {
    label: "Отменён",
    pill: "bg-adm-red-soft text-adm-red",
    dot: "bg-adm-red",
  },
};

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  colors: string[];
  sizes: string[];
  description: string;
  image: string;
  images: string[];
  bestseller: boolean;
  isNew: boolean;
  stock: number;
};

export type AdminOrderItem = {
  productId?: string;
  name: string;
  size?: string;
  color?: string;
  qty: number;
  price: number;
};

export type AdminOrder = {
  id: string;
  date: string;
  count: number;
  total: number;
  discount: number;
  status: OrderStatus;
  items: AdminOrderItem[];
  customer?: { name?: string; phone?: string; comment?: string };
  user?: { telegramId?: number; username?: string; name?: string };
};

export type AdminUser = {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  photoUrl?: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
};

export type SalesPoint = { date: string; revenue: number; orders: number };

export type AdminStats = {
  days: number;
  revenue: number;
  orders: number;
  averageCheck: number;
  users: number;
  usersNew: number;
  products: number;
  lowStock: number;
  newOrders: number;
  revenueDelta: number | null;
  ordersDelta: number | null;
  averageCheckDelta: number | null;
  series: SalesPoint[];
};

export type ProductPayload = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  colors: string[];
  sizes: string[];
  description: string;
  image: string;
  images: string[];
  bestseller: boolean;
  isNew: boolean;
  stock: number;
};

export const adminApi = {
  stats: (days: number) =>
    adminFetch<AdminStats>(`/api/admin/stats?days=${days}`),
  orders: () => adminFetch<AdminOrder[]>("/api/admin/orders"),
  users: () => adminFetch<AdminUser[]>("/api/admin/users"),
  products: () => adminFetch<AdminProduct[]>("/api/products"),
  createProduct: (payload: ProductPayload) =>
    adminFetch<AdminProduct>("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: string, payload: ProductPayload) =>
    adminFetch<AdminProduct>(`/api/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: string) =>
    adminFetch<{ ok: boolean }>(`/api/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    adminFetch<{ ok: boolean; status: OrderStatus }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      { method: "PUT", body: JSON.stringify({ status }) },
    ),
};

export const ADMIN_CATEGORIES = [
  { id: "glasses", label: "Очки" },
  { id: "clothes", label: "Одежда" },
  { id: "accessories", label: "Аксессуары" },
];

export function categoryLabel(id: string): string {
  return ADMIN_CATEGORIES.find((item) => item.id === id)?.label || id;
}

export function stockMeta(stock: number): {
  label: string;
  pill: string;
  dot: string;
} {
  if (stock <= 0) {
    return {
      label: "Нет в наличии",
      pill: "bg-adm-red-soft text-adm-red",
      dot: "bg-adm-red",
    };
  }
  if (stock <= 3) {
    return {
      label: "Заканчивается",
      pill: "bg-adm-amber-soft text-adm-amber",
      dot: "bg-adm-amber",
    };
  }
  return {
    label: "В наличии",
    pill: "bg-adm-green-soft text-adm-green",
    dot: "bg-adm-green",
  };
}

const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeYearFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dayFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

export function parseAdminDate(value?: string | null): Date | null {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const normalized = hasZone ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatAdminDateTime(value?: string | null): string {
  const date = parseAdminDate(value);
  if (!date) return "—";
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return `Сегодня, ${timeFmt.format(date)}`;
  if (isSameDay(date, yesterday)) return `Вчера, ${timeFmt.format(date)}`;
  if (date.getFullYear() === now.getFullYear()) return dateTimeFmt.format(date);
  return dateTimeYearFmt.format(date);
}

export function formatAdminDate(value?: string | null): string {
  const date = parseAdminDate(value);
  return date ? dateFmt.format(date) : "—";
}

/** Подпись оси X: ключ YYYY-MM-DD разбираем как локальную дату. */
export function formatDayKey(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return dayFmt.format(new Date(year, month - 1, day));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatDelta(value: number | null): string {
  if (value === null) return "новое";
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.05) return "0%";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded).toFixed(1).replace(".", ",")}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function pluralize(value: number, one: string, few: string, many: string): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
