import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/products";
import { haptic } from "@/lib/telegram";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/state/store";

/**
 * Липкая нижняя панель товара — содержимое плавающей пилюли (см. App).
 * Логика одна кнопка на все состояния:
 *   нет в корзине -> "В корзину";
 *   есть         -> [−] "В корзине · N" [+], минус до нуля убирает позиция.
 */
export function ProductFooter({ slug }: { slug: string }) {
  const { cart, addToCart, setLineQty, productSel, showToast } = useStore();
  const product = PRODUCTS.find((p) => p.id === slug);

  const [burst, setBurst] = useState(0);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  if (!product) return null;

  const sel =
    productSel?.productId === product.id
      ? productSel
      : { productId: product.id, size: product.sizes[0], color: product.colors[0] };
  const lineId = `${product.id}:${sel.size}:${sel.color}`;
  const line = cart.find((l) => l.lineId === lineId);

  const pop = () => {
    setBurst((n) => n + 1);
    setFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 1000);
  };

  return (
    <div className="relative flex items-center gap-3 px-2.5 py-2">
      {/* конфетти живут на уровне футера: не зависят от переключения веток */}
      {flash && <Confetti key={burst} />}
      <div className="shrink-0 pl-1.5">
        <div className="text-[17px] font-semibold leading-tight">
          {formatPrice(product.price * (line?.qty ?? 1))}
        </div>
        <div className="text-[12px] text-hint">
          {line?.qty ?? 1} шт. по {formatPrice(product.price)}
        </div>
      </div>
      {!line ? (
        <Button
          size="lg"
          className="flex-1"
          disabled={product.stock === 0}
          onClick={() => {
            haptic("light");
            addToCart(product, sel.size, sel.color, 1);
            showToast("Добавлено в корзину");
            pop();
          }}
        >
          {product.stock === 0 ? "Нет в наличии" : "В корзину"}
        </Button>
      ) : (
        <div className="flex h-12 flex-1 items-stretch rounded-2xl bg-accent text-accent-ink">
          <button
            className="-ml-1 flex w-12 shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-60"
            aria-label="Убрать одно"
            onClick={() => {
              haptic("light");
              setLineQty(lineId, line.qty - 1);
            }}
          >
            <Minus size={18} strokeWidth={2.3} />
          </button>
          <div className="flex flex-1 items-center justify-center gap-2.5 text-[15px] font-medium">
            <span>В корзине</span>
            <span
              key={line.qty}
              className="anim-num flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white/22 px-1.5 text-[15px] font-semibold tabular-nums"
            >
              {line.qty}
            </span>
          </div>
          <button
            className="-mr-1 flex w-12 shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-60 disabled:opacity-40"
            aria-label="Добавить ещё"
            disabled={line.qty >= product.stock}
            onClick={() => {
              pop();
              haptic("light");
              setLineQty(lineId, line.qty + 1);
            }}
          >
            <Plus size={18} strokeWidth={2.3} />
          </button>
        </div>
      )}
    </div>
  );
}
