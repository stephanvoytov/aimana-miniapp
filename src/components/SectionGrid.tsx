import { ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/data/products";

/**
 * Секция витрины: заголовок + «Смотреть все» + два товара в ряд.
 * Ровно два — как в макете: остальное живёт в каталоге по ссылке.
 */
export function SectionGrid({
  title,
  products,
  onAll,
}: {
  title: string;
  products: Product[];
  onAll: () => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-6">
      <button
        className="flex w-full items-center px-4 text-left active:opacity-60"
        onClick={onAll}
      >
        <h3 className="text-[20px] font-bold tracking-tight">{title}</h3>
        <span className="ml-auto flex items-center gap-0.5 text-[15px] font-medium text-accent">
          Смотреть все
          <ChevronRight size={18} strokeWidth={2.2} />
        </span>
      </button>

      <div className="mt-2.5 grid grid-cols-2 gap-2 px-4">
        {products.slice(0, 2).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} withCart />
        ))}
      </div>
    </section>
  );
}
