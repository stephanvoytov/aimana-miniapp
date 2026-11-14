import { CatalogHeader } from "@/components/CatalogHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { useStore } from "@/state/store";

export function CatalogScreen() {
  const {
    visibleProducts,
    query,
    setQuery,
    category,
    setCategory,
    sort,
    onlyDiscount,
    tag,
    sizes,
    colors,
    priceMin,
    priceMax,
    resetFilters,
  } = useStore();

  const filtered =
    query.trim() !== "" ||
    category !== "all" ||
    sort !== "popular" ||
    tag !== "all" ||
    Number(onlyDiscount) +
      Number(!!priceMin || !!priceMax) +
      sizes.length +
      colors.length >
      0;

  return (
    <div className="pb-5">
      <CatalogHeader sticky />

      {visibleProducts.length > 0 ? (
        <ProductGrid products={visibleProducts} />
      ) : (
        <div className="flex flex-col items-center gap-3 px-8 pt-20 text-center">
          <div className="text-[17px] font-medium">Ничего не найдено</div>
          <div className="text-[15px] text-hint">
            Попробуйте изменить запрос или выбрать другую категорию
          </div>
          {filtered && (
            <Button
              variant="field"
              onClick={() => {
                setQuery("");
                setCategory("all");
                resetFilters();
              }}
            >
              Сбросить
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
