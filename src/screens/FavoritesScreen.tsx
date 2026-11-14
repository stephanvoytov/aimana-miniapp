import { Heart } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS } from "@/data/products";
import { useStore } from "@/state/store";

export function FavoritesScreen() {
  const { favs, clearFavs, go } = useStore();
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const items = PRODUCTS.filter((p) => favs.includes(p.id));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-8 pb-5 pt-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-field">
          <Heart size={26} className="text-hint" />
        </div>
        <div className="mt-2 text-[17px] font-semibold">Нет сохранённых</div>
        <div className="text-[15px] text-hint">
          Нажмите на сердечко на карточке товара, чтобы сохранить его здесь
        </div>
        <Button variant="field" className="mt-4" onClick={() => go("catalog")}>
          В каталог
        </Button>
      </div>
    );
  }

  const onClear = () => {
    if (confirming) {
      window.clearTimeout(timer.current);
      clearFavs();
      setConfirming(false);
      return;
    }
    setConfirming(true);
    timer.current = window.setTimeout(() => setConfirming(false), 2500);
  };

  return (
    <div className="pb-5">
      <div className="flex items-baseline justify-between px-4 pt-4">
        <h2 className="text-[22px] font-semibold">Избранное</h2>
        <button
          className={
            "text-[15px] font-medium active:opacity-60 " +
            (confirming ? "text-[#e53935]" : "text-accent")
          }
          onClick={onClear}
        >
          {confirming ? "Точно удалить все?" : "Очистить"}
        </button>
      </div>
      <div className="px-4 pt-1 text-[13px] text-hint">
        {items.length} шт. · без сортировки, как добавляли
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 px-4 pt-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
