import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

import { FilterSheet } from "@/components/FilterSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/data/products";
import { useScrollX } from "@/lib/useScrollX";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/store";

const TAG_LABELS = { new: "Новинки", best: "Бестселлеры" } as const;

/**
 * Поиск + чипсы категорий + фильтр. Один компонент на «Главную» и «Каталог»:
 * на главной он прокручивается вместе со страницей, в каталоге — липнет
 * к верху (`sticky`). Плашки узкие, фильтр — такая же пилюля справа.
 */
export function CatalogHeader({ sticky = false }: { sticky?: boolean }) {
  const {
    category,
    setCategory,
    query,
    setQuery,
    tag,
    setTag,
    onlyDiscount,
    sizes,
    colors,
    priceMin,
    priceMax,
  } = useStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const chipsRef = useScrollX<HTMLDivElement>();

  const filtersCount =
    Number(onlyDiscount) +
    Number(!!priceMin || !!priceMax) +
    sizes.length +
    colors.length;

  // активный чип всегда в зоне видимости (после выбора из витрины)
  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>(
      `[data-cat="${category}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [category, chipsRef]);

  return (
    <>
      <div
        className={cn(
          "z-20 border-b border-line bg-page px-4 pb-2 pt-2",
          sticky && "sticky top-0",
        )}
      >
        <div className="relative">
          <Search
            size={19}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-hint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по каталогу"
            className={cn(
              "h-11 rounded-full border-transparent bg-field pl-10.5 text-[15px]",
              query && "pr-10",
            )}
            inputMode="search"
          />
          <button
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2 text-hint transition-all duration-200 active:text-ink",
              query ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
            )}
            aria-label="Очистить поиск"
            onClick={() => setQuery("")}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div
            ref={chipsRef}
            className="no-scrollbar flex flex-1 select-none gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] touch-pan-x"
          >
            {tag !== "all" && (
              <Button
                size="chip"
                className="h-9 shrink-0 gap-1 px-3.5 text-[14px]"
                onClick={() => setTag("all")}
              >
                {TAG_LABELS[tag]}
                <X size={14} strokeWidth={2.4} />
              </Button>
            )}
            {CATEGORIES.map((c) => (
              <Button
                key={c.id}
                data-cat={c.id}
                size="chip"
                variant={category === c.id ? "default" : "field"}
                className={cn(
                  "h-9 shrink-0 px-3.5 text-[14px]",
                  category === c.id && "font-medium",
                )}
                onClick={() => setCategory(c.id)}
              >
                {c.title}
              </Button>
            ))}
          </div>
          <button
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-field text-ink transition-opacity duration-150 active:opacity-60"
            aria-label="Сортировка и фильтры"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal size={20} strokeWidth={1.8} />
            {filtersCount > 0 && (
              <span className="absolute right-0.5 top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-page" />
            )}
          </button>
        </div>
      </div>

      <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} />
    </>
  );
}
