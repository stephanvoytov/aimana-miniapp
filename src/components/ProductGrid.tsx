import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/data/products";

/** Сетка товаров 2×N — общая для каталога и результатов поиска. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 px-4 pt-3">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
