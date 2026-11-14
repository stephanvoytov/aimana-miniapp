import { CatalogHeader } from "@/components/CatalogHeader";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionGrid } from "@/components/SectionGrid";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/products";
import type { Poster } from "@/data/posters";
import { useStore, type TagFilter } from "@/state/store";

/**
 * «Главная» — витрина: поиск с чипсами, постеры и три подборки по два
 * товара. Пока фильтры не тронуты, внизу только «Весь каталог»; как
 * только появляется запрос, категория или фильтр — экран превращается
 * в результаты, чтобы не гонять пользователя в каталог за поиском.
 */
export function HomeScreen() {
  const {
    go,
    resetFilters,
    setQuery,
    setCategory,
    setOnlyDiscount,
    setTag,
    query,
    category,
    sort,
    onlyDiscount,
    tag,
    sizes,
    colors,
    priceMin,
    priceMax,
    visibleProducts,
  } = useStore();

  const reset = () => {
    setQuery("");
    setCategory("all");
    resetFilters();
  };

  const filtering =
    query.trim() !== "" ||
    category !== "all" ||
    sort !== "popular" ||
    tag !== "all" ||
    onlyDiscount ||
    priceMin !== "" ||
    priceMax !== "" ||
    sizes.length > 0 ||
    colors.length > 0;

  // «Смотреть все» у подборки: открываем каталог с уже применённым тегом
  const openTag = (next: TagFilter) => {
    reset();
    setTag(next);
    go("catalog");
  };

  const openSale = () => {
    reset();
    setOnlyDiscount(true);
    go("catalog");
  };

  // постер ведёт в каталог на свою подборку
  const openPoster = (p: Poster) => {
    reset();
    if (p.collection === "new" || p.collection === "best") setTag(p.collection);
    if (p.collection === "sale") setOnlyDiscount(true);
    go("catalog");
  };

  const newItems = PRODUCTS.filter((p) => p.isNew);
  const bestItems = PRODUCTS.filter((p) => p.bestseller);
  const saleItems = PRODUCTS.filter((p) => p.oldPrice);

  return (
    <div className="pb-5">
      <CatalogHeader />

      {filtering ? (
        visibleProducts.length > 0 ? (
          <ProductGrid products={visibleProducts} />
        ) : (
          <div className="flex flex-col items-center gap-3 px-8 pt-20 text-center">
            <div className="text-[17px] font-medium">Ничего не найдено</div>
            <div className="text-[15px] text-hint">
              Попробуйте изменить запрос или выбрать другую категорию
            </div>
            <Button variant="field" onClick={reset}>
              Сбросить
            </Button>
          </div>
        )
      ) : (
        <>
          <HeroCarousel onOpen={openPoster} />

          <SectionGrid title="Новинки" products={newItems} onAll={() => openTag("new")} />
          <SectionGrid
            title="Популярное"
            products={bestItems}
            onAll={() => openTag("best")}
          />
          <SectionGrid title="Со скидкой" products={saleItems} onAll={openSale} />

          <div className="mt-6 px-4">
            <Button
              variant="field"
              className="w-full"
              onClick={() => {
                reset();
                go("catalog");
              }}
            >
              Весь каталог · {PRODUCTS.length}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
