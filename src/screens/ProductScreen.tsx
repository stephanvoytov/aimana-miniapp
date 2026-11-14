import { ChevronLeft, Heart } from "lucide-react";
import { useState } from "react";

import { ProductGallery } from "@/components/ProductGallery";
import { Lightbox } from "@/components/ProductLightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRODUCTS, productImages, productTags } from "@/data/products";
import { cn, formatPrice } from "@/lib/utils";
import { haptic } from "@/lib/telegram";
import { useStore } from "@/state/store";

export function ProductScreen() {
  const {
    route,
    closeProduct,
    isFav,
    toggleFav,
    openProduct,
    productSel,
    selectVariant,
  } = useStore();

  // индекс кадра и открыт ли полноэкранный просмотр
  const [viewer, setViewer] = useState({ open: false, index: 0 });

  const product = PRODUCTS.find((p) => p.id === route.productId) ?? null;

  if (!product) return null;

  const images = productImages(product);

  const sel =
    productSel?.productId === product.id
      ? productSel
      : { size: product.sizes[0], color: product.colors[0] };

  const fav = isFav(product.id);
  const tags = productTags(product);
  const hasSizes = !(product.sizes.length === 1 && product.sizes[0] === "one-size");

  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  ).slice(0, 4);

  return (
    <div className="pb-5">
      <div className="px-4 pt-3">
        <div className="relative">
          <ProductGallery
            images={images}
            alt={product.name}
            onOpen={(index) => setViewer({ open: true, index })}
          />

          {/* возврат с экрана товара: в Telegram дублируется нативной BackButton */}
          <button
            className="absolute left-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-black/16 text-white ring-1 ring-white/25 transition-transform active:scale-90"
            aria-label="Назад"
            onClick={closeProduct}
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </button>

          {/* избранное — увеличенное и с большим отступом, чем в карточке:
              иконка и отступ растут вместе (32px / 16px против 20/10) */}
          <button
            className="absolute right-2 top-2 z-10 flex size-12 items-center justify-center transition-transform duration-150 ease-out active:scale-90"
            aria-label={fav ? "Убрать из избранного" : "В избранное"}
            aria-pressed={fav}
            onClick={() => toggleFav(product.id)}
          >
            <Heart
              key={String(fav)}
              size={32}
              strokeWidth={2}
              className={
                fav ? "anim-heart fill-accent text-accent" : "fill-transparent text-black"
              }
            />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
          <div className="text-[20px] font-bold leading-tight">
            {formatPrice(product.price)}
          </div>
          {product.oldPrice && (
            <div className="pb-1 text-[15px] text-hint line-through">
              {formatPrice(product.oldPrice)}
            </div>
          )}
        </div>
        <div className="mt-1 text-[16px]">{product.name}</div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        )}

        {hasSizes && (
          <>
            <div className="mb-2 mt-6 text-[13px] font-medium text-hint">
              Размер
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <Button
                  key={s}
                  size="chip"
                  variant={sel.size === s ? "default" : "field"}
                  className="w-14 px-0"
                  onClick={() => {
                    selectVariant({ size: s });
                    haptic("selection");
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </>
        )}

        <div className="mb-2 mt-6 text-[13px] font-medium text-hint">Цвет</div>
        <div className="flex gap-2.5">
          {product.colors.map((c) => (
            <button
              key={c}
              aria-label={`Цвет ${c}`}
              className={cn(
                "size-8 rounded-full border border-line transition-transform active:scale-90",
                sel.color === c &&
                  "ring-2 ring-accent ring-offset-2 ring-offset-page",
              )}
              style={{ backgroundColor: c }}
              onClick={() => {
                selectVariant({ color: c });
                haptic("selection");
              }}
            />
          ))}
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-ink/75">
          {product.description}
        </p>

        {related.length > 0 && (
          <>
            <div className="mb-3 mt-8 text-[17px] font-semibold">
              Из этой категории
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
              {related.map((p) => (
                <button
                  key={p.id}
                  className="w-36 shrink-0 text-left transition-transform active:scale-[0.97]"
                  onClick={() => openProduct(p.id)}
                >
                  <div className="aspect-[0.94] overflow-hidden rounded-xl bg-card">
                    <img
                      src={p.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="mt-1.5 truncate text-[13px]">{p.name}</div>
                  <div className="text-[14px] font-semibold">
                    {formatPrice(p.price)}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Lightbox
        open={viewer.open}
        images={images}
        alt={product.name}
        index={viewer.index}
        onIndexChange={(index) => setViewer((v) => ({ ...v, index }))}
        onClose={() => setViewer((v) => ({ ...v, open: false }))}
      />
    </div>
  );
}
