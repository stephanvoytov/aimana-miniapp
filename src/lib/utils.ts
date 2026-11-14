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

/**
 * Путь к файлу из public/. В данных картинки лежат относительно
 * («img/hat.svg»), но на вложенных маршрутах браузер разрешил бы их от
 * /product/, поэтому приводим к корню приложения.
 */
export function assetUrl(src: string): string {
  if (
    !src ||
    src.startsWith("/") ||
    src.startsWith("data:") ||
    /^[a-z]+:\/\//i.test(src)
  ) {
    return src;
  }
  return `${import.meta.env.BASE_URL}${src.replace(/^\.?\//, "")}`;
}

export function discountPercent(price: number, oldPrice: number): number {
  return Math.max(0, Math.round((1 - price / oldPrice) * 100));
}
