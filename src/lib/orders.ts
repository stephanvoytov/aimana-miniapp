import type { OrderStatus } from "@/state/store";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Принят",
  processing: "В работе",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  new: "bg-[#34c759]/15 text-[#34c759]",
  processing: "bg-[#ff9f0a]/15 text-[#ff9f0a]",
  shipped: "bg-[#af52de]/15 text-[#af52de]",
  delivered: "bg-[#34c759]/15 text-[#34c759]",
  cancelled: "bg-[#ff3b30]/10 text-[#ff3b30]",
};

export function orderStatus(order: { status?: OrderStatus }): OrderStatus {
  return order.status ?? "new";
}

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}
