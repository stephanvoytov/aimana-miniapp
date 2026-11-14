// Код пользователя для визуального сравнения — смонтирован как есть
// (убрана только директива "use client"). Страница: /compare
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Heart,
  House,
  Grid2X2,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

const categories = ["Все", "Очки", "Одежда", "Аксессуары"];

const products = [
  {
    id: 1,
    name: "AIMANA Eclipse",
    price: 7990,
    category: "Очки",
    label: "Бестселлер",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "AIMANA Nova",
    price: 7990,
    category: "Очки",
    label: "",
    image:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?w=700&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "AIMANA Vogue",
    price: 7990,
    category: "Очки",
    label: "Новинка",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "AIMANA Classic",
    price: 6990,
    category: "Очки",
    label: "",
    image:
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=700&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Essential T-shirt",
    price: 3490,
    category: "Одежда",
    label: "Новинка",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Everyday Bag",
    price: 4990,
    category: "Аксессуары",
    label: "",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop",
  },
];

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value) + " ₽";

export default function Home() {
  const [category, setCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("Главная");
  const [showFilters, setShowFilters] = useState(false);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === "Все" || product.category === category;

      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFavorites =
        activeTab !== "Избранное" ||
        favorites.includes(product.id);

      return matchesCategory && matchesSearch && matchesFavorites;
    });
  }, [category, search, activeTab, favorites]);

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  const tabs = [
    { label: "Главная", icon: House },
    { label: "Каталог", icon: Grid2X2 },
    { label: "Избранное", icon: Heart },
    { label: "Корзина", icon: ShoppingBag },
    { label: "Профиль", icon: UserRound },
  ];

  return (
    <main className="min-h-screen bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#111111)]">
      <div className="mx-auto min-h-screen w-full max-w-[520px] pb-28">
        {/* Telegram header */}
        <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[var(--tg-theme-bg-color,#fff)]/95 px-4 pb-3 pt-3 backdrop-blur-xl">
          <div className="relative flex h-12 items-center justify-center">
            <button
              aria-label="Назад"
              className="absolute left-0 flex items-center gap-1 text-[17px] text-[var(--tg-theme-link-color,#2481e8)]"
            >
              <ArrowLeft size={23} strokeWidth={2.5} />
              Назад
            </button>

            <div className="text-center">
              <div className="text-[17px] font-semibold tracking-tight">
                aimana shop
              </div>
              <div className="text-[12px] text-[var(--tg-theme-hint-color,#999)]">
                мини-приложение
              </div>
            </div>

            <button
              aria-label="Дополнительно"
              className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--tg-theme-link-color,#2481e8)] text-[var(--tg-theme-link-color,#2481e8)]"
            >
              <span className="text-lg leading-none">•••</span>
            </button>
          </div>
        </header>

        <section className="px-4 pt-4">
          {/* Search */}
          <div className="flex h-12 items-center gap-3 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f1f1f3)] px-4">
            <Search
              size={21}
              className="shrink-0 text-[var(--tg-theme-hint-color,#8e8e93)]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по каталогу"
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[var(--tg-theme-hint-color,#8e8e93)]"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Очистить поиск">
                <X size={18} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-5 py-3 text-[15px] font-medium transition-colors ${
                  category === item
                    ? "bg-[var(--tg-theme-button-color,#2481e8)] text-[var(--tg-theme-button-text-color,#fff)]"
                    : "bg-[var(--tg-theme-secondary-bg-color,#f1f1f3)] text-[var(--tg-theme-text-color,#111)]"
                }`}
              >
                {item}
              </button>
            ))}

            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Фильтры"
              className={`ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                showFilters
                  ? "bg-[var(--tg-theme-button-color,#2481e8)] text-white"
                  : "text-[var(--tg-theme-link-color,#2481e8)]"
              }`}
            >
              <SlidersHorizontal size={23} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f1f1f3)] p-4">
              <div className="text-sm font-semibold">Фильтры</div>
              <p className="mt-1 text-sm text-[var(--tg-theme-hint-color,#888)]">
                Здесь можно разместить фильтры по размеру, цене и бренду.
              </p>
            </div>
          )}

          {/* Section heading */}
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h1 className="text-[20px] font-semibold tracking-tight">
              {activeTab === "Избранное"
                ? "Избранное"
                : category === "Все"
                  ? "Новая коллекция"
                  : category}
            </h1>
            <span className="text-[13px] text-[var(--tg-theme-hint-color,#999)]">
              {visibleProducts.length} товаров
            </span>
          </div>

          {/* Product grid */}
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {visibleProducts.map((product) => {
                const isFavorite = favorites.includes(product.id);

                return (
                  <article key={product.id} className="min-w-0">
                    <div className="group relative overflow-hidden rounded-[18px] bg-[var(--tg-theme-secondary-bg-color,#f1f1f3)]">
                      <button
                        className="block aspect-[0.88] w-full"
                        aria-label={`Открыть ${product.name}`}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-active:scale-[0.98]"
                        />
                      </button>

                      <button
                        onClick={() => toggleFavorite(product.id)}
                        aria-label={
                          isFavorite
                            ? "Убрать из избранного"
                            : "Добавить в избранное"
                        }
                        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/15 text-white backdrop-blur-md"
                      >
                        <Heart
                          size={21}
                          strokeWidth={2}
                          fill={isFavorite ? "#2481e8" : "none"}
                          color={isFavorite ? "#2481e8" : "white"}
                        />
                      </button>
                    </div>

                    <div className="px-0.5 pt-2.5">
                      <div className="truncate text-[15px] font-medium">
                        {product.name}
                      </div>
                      <div className="mt-1 text-[16px] font-semibold">
                        {money(product.price)}
                      </div>

                      {product.label && (
                        <span className="mt-2 inline-flex rounded-full bg-[var(--tg-theme-secondary-bg-color,#f1f1f3)] px-3 py-1 text-[12px] text-[var(--tg-theme-hint-color,#777)]">
                          {product.label}
                        </span>
                      )}

                      <button
                        onClick={() =>
                          setCart((current) => [...current, product.id])
                        }
                        className="mt-3 w-full rounded-xl bg-[var(--tg-theme-button-color,#2481e8)] py-2.5 text-[14px] font-medium text-[var(--tg-theme-button-text-color,#fff)] active:opacity-80"
                      >
                        В корзину
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-[var(--tg-theme-hint-color,#999)]">
              Здесь пока ничего нет
            </div>
          )}
        </section>
      </div>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-[var(--tg-theme-bg-color,#fff)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-[520px] grid-cols-5 px-1 pb-2 pt-2">
          {tabs.map(({ label, icon: Icon }) => {
            const active = activeTab === label;

            return (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`relative flex flex-col items-center gap-1 py-1 text-[11px] transition-colors ${
                  active
                    ? "text-[var(--tg-theme-link-color,#2481e8)]"
                    : "text-[var(--tg-theme-hint-color,#929299)]"
                }`}
              >
                <span className="relative">
                  <Icon
                    size={25}
                    strokeWidth={active ? 2.5 : 1.8}
                    fill={active && label === "Главная" ? "currentColor" : "none"}
                  />
                  {label === "Корзина" && cart.length > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[var(--tg-theme-link-color,#2481e8)] px-1 text-[10px] text-white">
                      {cart.length}
                    </span>
                  )}
                </span>
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
