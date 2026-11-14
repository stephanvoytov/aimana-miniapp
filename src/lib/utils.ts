import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { BRAND } from "@/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number): string {
  const formatted = new Intl.NumberFormat("ru-RU").format(value);
  return `${formatted} ${BRAND.currency}`;
}

export function discountPercent(price: number, oldPrice: number): number {
  return Math.max(0, Math.round((1 - price / oldPrice) * 100));
}
