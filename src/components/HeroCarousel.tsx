import { useState } from "react";

import { POSTERS, type Poster } from "@/data/posters";
import { useScrollX } from "@/lib/useScrollX";
import { cn } from "@/lib/utils";

/**
 * Витрина-карусель постеров под шапкой главной.
 * Листается свайпом на тач-экранах, перетаскиванием мышью и колесом;
 * точки справа сверху показывают позицию и тоже переключают слайд.
 */
export function HeroCarousel({ onOpen }: { onOpen: (p: Poster) => void }) {
  const ref = useScrollX<HTMLDivElement>();
  const [active, setActive] = useState(0);

  const step = () => {
    const slide = ref.current?.firstElementChild as HTMLElement | null;
    return (slide?.offsetWidth ?? 0) + 12; // ширина слайда + gap-3
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const s = step();
    if (!s) return;
    setActive(Math.min(POSTERS.length - 1, Math.round(el.scrollLeft / s)));
  };

  const scrollTo = (i: number) => {
    ref.current?.scrollTo({ left: i * step(), behavior: "smooth" });
  };

  return (
    <div className="relative pt-3">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 select-none touch-pan-x"
      >
        {POSTERS.map((p) => (
          <div
            key={p.id}
            className="relative aspect-[2.6/1] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-field"
          >
            <img
              src={p.image}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />

            <div className="absolute inset-y-0 left-0 flex w-[64%] flex-col justify-center gap-1 px-4 text-black">
              <div className="text-[22px] font-bold leading-[1.05] tracking-tight">
                {p.title}
              </div>
              <div className="text-[13px] leading-snug text-black/55">
                {p.subtitle}
              </div>
              <button
                className="mt-1.5 flex h-8 w-fit items-center rounded-full bg-black px-3.5 text-[13px] font-medium text-white transition-opacity active:opacity-70"
                onClick={() => onOpen(p)}
              >
                {p.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* точки — один индикатор поверх правого верхнего угла карусели;
          цвет фиксированный: заглушки постеров светлые в обеих темах */}
      <div className="absolute right-7 top-6 flex gap-1.5">
        {POSTERS.map((p, i) => (
          <button
            key={p.id}
            className={cn(
              "size-1.5 rounded-full transition-colors duration-200",
              i === active ? "bg-black" : "bg-black/25",
            )}
            aria-label={`Постер ${i + 1}`}
            aria-current={i === active}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
