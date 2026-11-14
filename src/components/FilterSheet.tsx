import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { ALL_COLORS, ALL_SIZES } from "@/data/products";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/telegram";
import { useStore, type SortKey } from "@/state/store";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Сначала популярные" },
  { key: "price-asc", label: "Сначала дешёвые" },
  { key: "price-desc", label: "Сначала дорогие" },
  { key: "new", label: "Сначала новинки" },
];

const digits = (v: string) => v.replace(/[^\d]/g, "").slice(0, 7);

export function FilterSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const {
    sort,
    setSort,
    onlyDiscount,
    setOnlyDiscount,
    priceMin,
    priceMax,
    setPriceMin,
    setPriceMax,
    sizes,
    toggleSize,
    colors,
    toggleColor,
    resetFilters,
  } = useStore();

  const activeCount =
    Number(onlyDiscount) +
    Number(!!priceMin || !!priceMax) +
    sizes.length +
    colors.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Фильтры">
      <div className="-mx-4 max-h-[62vh] overflow-y-auto overscroll-contain px-4">
        {/* сортировка */}
        <Section title="Сортировка">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className="flex h-12 w-full items-center justify-between text-left text-[15px] outline-none"
              onClick={() => {
                setSort(opt.key);
                haptic("selection");
              }}
            >
              {opt.label}
              <Check
                size={20}
                className={cn(
                  "text-accent transition-opacity",
                  sort === opt.key ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          ))}
        </Section>

        {/* цена */}
        <Section title="Цена, ₽">
          <div className="flex items-center gap-2 pb-1">
            <Input
              value={priceMin}
              onChange={(e) => setPriceMin(digits(e.target.value))}
              placeholder="от"
              inputMode="numeric"
              className="text-[15px] tabular-nums"
            />
            <span className="text-hint">—</span>
            <Input
              value={priceMax}
              onChange={(e) => setPriceMax(digits(e.target.value))}
              placeholder="до"
              inputMode="numeric"
              className="text-[15px] tabular-nums"
            />
          </div>
        </Section>

        {/* размер */}
        <Section title="Размер">
          <div className="flex flex-wrap gap-2 pb-1">
            {ALL_SIZES.map((s) => (
              <Button
                key={s}
                size="chip"
                variant={sizes.includes(s) ? "default" : "field"}
                className="h-9 min-w-[52px] px-4 text-[14px]"
                onClick={() => toggleSize(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </Section>

        {/* цвет */}
        <Section title="Цвет">
          <div className="flex flex-wrap gap-2.5 pb-1">
            {ALL_COLORS.map((c) => {
              const on = colors.includes(c);
              return (
                <button
                  key={c}
                  aria-label={`Цвет ${c}`}
                  aria-pressed={on}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border border-line transition-transform active:scale-90",
                    on && "ring-2 ring-accent ring-offset-2 ring-offset-page",
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => toggleColor(c)}
                >
                  {on && (
                    <Check size={16} strokeWidth={3} className="text-white/90 mix-blend-difference" />
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* скидки */}
        <Section title="Прочее">
          <button
            className="flex h-12 w-full items-center justify-between text-left text-[15px] outline-none"
            onClick={() => {
              setOnlyDiscount(!onlyDiscount);
              haptic("light");
            }}
          >
            Только со скидкой
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-md border-2 transition-colors duration-150",
                onlyDiscount
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line",
              )}
            >
              {onlyDiscount && <Check size={16} strokeWidth={3} />}
            </span>
          </button>
        </Section>

        {activeCount > 0 && (
          <button
            className="mb-1 mt-2 h-11 w-full rounded-xl text-[15px] font-medium text-accent active:opacity-60"
            onClick={() => {
              resetFilters();
              haptic("light");
            }}
          >
            Сбросить фильтры ({activeCount})
          </button>
        )}
      </div>
    </Sheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-2">
      <div className="mb-2 text-[13px] font-medium text-hint">{title}</div>
      {children}
    </div>
  );
}
