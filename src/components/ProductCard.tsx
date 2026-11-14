import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { productTags, type Product } from "@/data/products";
import { haptic } from "@/lib/telegram";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/state/store";

/**
 * Карточка товара — единственная на всё приложение.
 * Фото: бейдж белой плашкой в левом верхнем углу, избранное — чёрным
 * сердечком в правом (иконка на 10px от краёв фото), без подложек.
 * `withCart` добавляет кнопку покупки (витрина главной). Она живёт по тем
 * же правилам, что футер товара: нет в корзине — «В корзину», есть —
 * счётчик с шагом количества. Состояние меняется сразу, pop счётчика
 * и тост — обычные подтверждения действия.
 */
export function ProductCard({
  product,
  index = 0,
  withCart = false,
}: {
  product: Product;
  index?: number;
  withCart?: boolean;
}) {
  const { openProduct, isFav, toggleFav, addToCart, cart, setLineQty, showToast, bumpCartPulse } = useStore();
  const fav = isFav(product.id);
  const tags = productTags(product).slice(0, 2);

  // карточка не знает про выбор варианта: работаем с первым (как в «В корзину»)
  const size = product.sizes[0];
  const color = product.colors[0];
  const lines = cart.filter((l) => l.productId === product.id);
  const qty = lines.reduce((n, l) => n + l.qty, 0);
  const line = lines.find((l) => l.lineId === `${product.id}:${size}:${color}`) ?? lines[0];

  const add = () => {
    haptic("light");
    addToCart(product, size, color, 1); // состояние — сразу
    bumpCartPulse();
    showToast("Добавлено в корзину");
  };

  const stepQty = (delta: 1 | -1) => {
    if (!line) return;
    haptic("light");
    setLineQty(line.lineId, line.qty + delta);
  };

  const buyButton = (
    <button
      className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-field text-[14px] font-medium transition-opacity duration-150 active:opacity-60"
      onClick={add}
    >
      <ShoppingBag size={17} strokeWidth={1.9} />
      В корзину
    </button>
  );

  return (
    <div
      className="anim-card relative"
      style={{ animationDelay: `${Math.min(index, 7) * 24}ms` }}
    >
      <button
        className="block w-full text-left transition-transform duration-150 ease-out active:scale-[0.98]"
        onClick={() => openProduct(product.id)}
      >
        <div className="relative aspect-[0.94] overflow-hidden rounded-2xl bg-card">
          <img
            src={product.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
          {/* бейджи поверх фото: не занимают высоту и не растягивают ряд */}
          {tags.length > 0 && (
            <div className="absolute left-2 top-2 flex max-w-[calc(100%-56px)] gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="photo">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2">
          {/* одно строкой: сетка ровная по высоте, длинное имя — с многоточием */}
          <div className="truncate text-[15px] font-medium leading-snug">
            {product.name}
          </div>
          <div className="mt-0.5 text-[16px] font-semibold">
            {formatPrice(product.price)}
          </div>
        </div>
      </button>

      {/* избранное: без подложки, чёрная иконка, 10px от верха и справа фото */}
      <button
        className="absolute right-0 top-0 flex size-10 items-center justify-center transition-transform duration-150 ease-out active:scale-90"
        aria-label={fav ? "Убрать из избранного" : "В избранное"}
        aria-pressed={fav}
        onClick={() => toggleFav(product.id)}
      >
        <Heart
          key={String(fav)}
          size={20}
          strokeWidth={2}
          className={
            fav ? "anim-heart fill-accent text-accent" : "fill-transparent text-black"
          }
        />
      </button>

      {withCart && (
        <div className="mt-2">
          {product.stock === 0 ? (
            <div className="flex h-10 items-center justify-center rounded-full bg-field text-[14px] text-hint">
              Нет в наличии
            </div>
          ) : line ? (
            <div className="anim-step flex h-10 items-stretch rounded-full bg-accent text-accent-ink">
              <button
                className="flex w-10 shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-60"
                aria-label="Убрать одно"
                onClick={() => stepQty(-1)}
              >
                <Minus size={16} strokeWidth={2.4} />
              </button>
              <div
                className="flex flex-1 items-center justify-center text-[14px] font-medium tabular-nums"
                aria-live="polite"
              >
                {qty} шт.
              </div>
              <button
                className="flex w-10 shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-60 disabled:opacity-40"
                aria-label="Добавить ещё"
                disabled={qty >= product.stock}
                onClick={() => stepQty(1)}
              >
                <Plus size={16} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            buyButton
          )}
        </div>
      )}
    </div>
  );
}
