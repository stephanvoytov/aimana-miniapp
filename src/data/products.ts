import rawProducts from "../../data/products.json";

export type CategoryId = "glasses" | "clothes" | "accessories";

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: CategoryId;
  colors: string[];
  sizes: string[];
  description: string;
  image: string;
  images?: string[];
  bestseller?: boolean;
  isNew?: boolean;
  stock: number;
};

export const CATEGORIES: { id: "all" | CategoryId; title: string }[] = [
  { id: "all", title: "Все" },
  { id: "glasses", title: "Очки" },
  { id: "clothes", title: "Одежда" },
  { id: "accessories", title: "Аксессуары" },
];

export const PRODUCTS: Product[] = rawProducts as Product[];

export function productTags(p: Product): string[] {
  const tags: string[] = [];
  if (p.bestseller) tags.push("Бестселлер");
  if (p.isNew) tags.push("Новинка");
  if (p.oldPrice) {
    const pct = Math.round((1 - p.price / p.oldPrice) * 100);
    if (pct > 0) tags.push(`−${pct}%`);
  }
  if (p.stock > 0 && p.stock <= 3) tags.push("Мало");
  return tags;
}

export function productImages(p: Product): string[] {
  if (p.images?.length) return p.images;
  if (!p.image.endsWith(".svg")) return [p.image];
  const base = p.image.slice(0, -4);
  return [`${base}.svg`, `${base}-2.svg`, `${base}-3.svg`];
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL"];

export const ALL_SIZES: string[] = Array.from(
  new Set(PRODUCTS.flatMap((p) => p.sizes)),
)
  .filter((s) => s !== "one-size")
  .sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) {
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
    return a.localeCompare(b, undefined, { numeric: true });
  });

export const ALL_COLORS: string[] = Array.from(
  new Set(PRODUCTS.flatMap((p) => p.colors)),
);