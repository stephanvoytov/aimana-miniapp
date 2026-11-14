import { useState } from "react";

import { useScrollX } from "@/lib/useScrollX";
import { cn } from "@/lib/utils";

/**
 * Галерея фото на странице товара: горизонтальный свайп, стрелки-точки,
 * тап по кадру открывает полноэкранный просмотр (Lightbox).
 * Тот же useScrollX, что у чипсов и постеров: тач — нативный, мышь —
 * перетаскивание, колесо — горизонтально.
 */
export function ProductGallery({
  images,
  alt,
  onOpen,
}: {
  images: string[];
  alt: string;
  onOpen: (index: number) => void;
}) {
  const ref = useScrollX<HTMLDivElement>();
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const step = el.clientWidth;
    if (!step) return;
    setActive(Math.min(images.length - 1, Math.round(el.scrollLeft / step)));
  };

  const scrollTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-card select-none touch-pan-x"
      >
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            className="relative aspect-[0.94] w-full shrink-0 snap-center overflow-hidden"
            aria-label={`Открыть фото ${i + 1} из ${images.length}`}
            onClick={() => onOpen(i)}
          >
            <img
              src={src}
              alt={i === 0 ? alt : ""}
              decoding="async"
              draggable={false}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={cn(
                "pointer-events-auto size-1.5 rounded-full transition-colors duration-200",
                i === active ? "bg-black" : "bg-black/25",
              )}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === active}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
