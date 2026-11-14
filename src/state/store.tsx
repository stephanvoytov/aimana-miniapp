import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { PRODUCTS, type CategoryId, type Product } from "@/data/products";
import { haptic } from "@/lib/telegram";
import { api, DEMO_MODE } from "@/lib/api";

export type TabId = "home" | "catalog" | "favorites" | "cart" | "profile";
export type SortKey = "popular" | "price-asc" | "price-desc" | "new";
export type TagFilter = "all" | "new" | "best";

export type CartLine = {
  lineId: string; // `${productId}:${size}:${color}`
  productId: string;
  size: string;
  color: string;
  qty: number;
};

export type Order = {
  id: string;
  date: string; // ISO
  count: number;
  total: number;
};

export type Route = { tab: TabId; productId: string | null };

export type Variant = { productId: string; size: string; color: string };

type Persisted = { favs: string[]; cart: CartLine[]; orders: Order[] };

const STORAGE_KEY = "aimana.store.v1";

type StoreValue = {
  route: Route;
  go: (tab: TabId) => void;
  openProduct: (id: string) => void;
  closeProduct: () => void;

  query: string;
  setQuery: (v: string) => void;
  category: "all" | CategoryId;
  setCategory: (v: "all" | CategoryId) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  onlyDiscount: boolean;
  setOnlyDiscount: (v: boolean) => void;
  tag: TagFilter;
  setTag: (v: TagFilter) => void;

  priceMin: string;
  priceMax: string;
  setPriceMin: (v: string) => void;
  setPriceMax: (v: string) => void;
  sizes: string[];
  toggleSize: (v: string) => void;
  colors: string[];
  toggleColor: (v: string) => void;
  resetFilters: () => void;

  visibleProducts: Product[];

  favs: string[];
  isFav: (id: string) => boolean;
  toggleFav: (id: string) => void;
  clearFavs: () => void;

  cart: CartLine[];
  cartCount: number;
  cartTotal: number;
  cartDiscount: number;
  addToCart: (p: Product, size: string, color: string, qty: number) => void;
  setLineQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
  /** счётчик «приземлений» в корзину — таб-бар реагирует на его изменение */
  cartPulse: number;
  bumpCartPulse: () => void;

  orders: Order[];
  addOrder: (o: Order) => void;

  productSel: Variant | null;
  selectVariant: (patch: Partial<{ size: string; color: string }>) => void;

  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;

  toast: string | null;
  showToast: (msg: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { favs: [], cart: [], orders: [] };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      favs: Array.isArray(parsed.favs) ? parsed.favs : [],
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return { favs: [], cart: [], orders: [] };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef(loadPersisted()).current;
  const USE_API = !DEMO_MODE;

  const [route, setRoute] = useState<Route>({ tab: "home", productId: null });
  const [query, setQuery] = useState("");
  const [category, setCategoryRaw] = useState<"all" | CategoryId>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [onlyDiscount, setOnlyDiscountRaw] = useState(false);
  const [tag, setTagRaw] = useState<TagFilter>("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>(initial.favs);
  const [cart, setCart] = useState<CartLine[]>(initial.cart);
  const [orders, setOrders] = useState<Order[]>(initial.orders);
  const [productSel, setProductSel] = useState<Variant | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [cartPulse, setCartPulse] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ favs, cart, orders }));
  }, [favs, cart, orders]);

  // синхронизация с бэкендом (если задан VITE_API_URL)
  useEffect(() => {
    if (!USE_API) return;
    (async () => {
      try {
        const c = await api.cart();
        if (c?.items) {
          setCart(
            c.items.map((it: any) => ({
              lineId: it.lineId,
              productId: it.productId,
              size: it.size,
              color: it.color,
              qty: it.qty,
            })),
          );
        }
      } catch {}
      try {
        const f = await api.favorites();
        if (Array.isArray(f)) setFavs(f);
      } catch {}
      try {
        const o = await api.orders();
        if (Array.isArray(o)) setOrders(o as any);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [USE_API]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1500);
  }, []);

  // тактильный отклик на переключение фильтров
  const setCategory = useCallback((v: "all" | CategoryId) => {
    haptic("selection");
    setCategoryRaw(v);
  }, []);
  const setTag = useCallback((v: TagFilter) => {
    haptic("selection");
    setTagRaw(v);
  }, []);
  const setOnlyDiscount = useCallback((v: boolean) => {
    haptic("light");
    setOnlyDiscountRaw(v);
  }, []);

  const toggleSize = useCallback((v: string) => {
    haptic("selection");
    setSizes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }, []);

  const toggleColor = useCallback((v: string) => {
    haptic("selection");
    setColors((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setPriceMin("");
    setPriceMax("");
    setSizes([]);
    setColors([]);
    setOnlyDiscountRaw(false);
    setTagRaw("all");
    setSort("popular");
  }, []);

  const go = useCallback((tab: TabId) => {
    haptic("light");
    setRoute({ tab, productId: null });
  }, []);

  const openProduct = useCallback((id: string) => {
    haptic("light");
    const p = PRODUCTS.find((x) => x.id === id);
    if (p) {
      setProductSel({ productId: id, size: p.sizes[0], color: p.colors[0] });
    }
    setRoute((r) => ({ ...r, productId: id }));
  }, []);

  const closeProduct = useCallback(() => {
    setRoute((r) => ({ ...r, productId: null }));
  }, []);

  const isFav = useCallback((id: string) => favs.includes(id), [favs]);

  const toggleFav = useCallback((id: string) => {
    haptic("light");
    setFavs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    if (USE_API) {
      api.toggleFavorite(id).catch(() => {
        // revert on failure
        setFavs((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
      });
    }
  }, [USE_API]);

  const clearFavs = useCallback(() => {
    haptic("light");
    setFavs([]);
  }, []);

  // чистое изменение состояния: отзыв (haptic/toast) вызывают места,
  // которые знают, когда товар действительно «долетел» до корзины
  const addToCart = useCallback(
    (p: Product, size: string, color: string, qty: number) => {
      const lineId = `${p.id}:${size}:${color}`;
      // optimistic local update
      setCart((prev) => {
        const existing = prev.find((l) => l.lineId === lineId);
        if (existing) {
          return prev.map((l) =>
            l.lineId === lineId
              ? { ...l, qty: Math.min(p.stock, l.qty + qty) }
              : l,
          );
        }
        return [
          ...prev,
          {
            lineId,
            productId: p.id,
            size,
            color,
            qty: Math.min(qty, p.stock),
          },
        ];
      });
      if (USE_API) {
        api
          .addToCart(p.id, size, color, qty)
          .then((r: any) => {
            if (r?.items) {
              setCart(
                r.items.map((it: any) => ({
                  lineId: it.lineId,
                  productId: it.productId,
                  size: it.size,
                  color: it.color,
                  qty: it.qty,
                })),
              );
            }
          })
          .catch(() => {
            // revert optimistic on failure
          });
      }
    },
    [USE_API],
  );

  const bumpCartPulse = useCallback(() => setCartPulse((n) => n + 1), []);

  const setLineQty = useCallback((lineId: string, qty: number) => {
    // optimistic
    setCart((prev) =>
      prev
        .map((l) =>
          l.lineId === lineId
            ? { ...l, qty: Math.min(qty, byId.get(l.productId)?.stock ?? 99) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
    if (USE_API) {
      api
        .setQty(lineId, qty)
        .then((r: any) => {
          if (r?.items) {
            setCart(
              r.items.map((it: any) => ({
                lineId: it.lineId,
                productId: it.productId,
                size: it.size,
                color: it.color,
                qty: it.qty,
              })),
            );
          }
        })
        .catch(() => {});
    }
  }, [USE_API]);

  const addOrder = useCallback((o: Order) => {
    setOrders((prev) => [o, ...prev].slice(0, 30));
  }, []);

  const selectVariant = useCallback(
    (patch: Partial<{ size: string; color: string }>) => {
      setProductSel((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const byId = useMemo(
    () => new Map(PRODUCTS.map((p) => [p.id, p])),
    [],
  );

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cart.reduce(
    (sum, l) => sum + (byId.get(l.productId)?.price ?? 0) * l.qty,
    0,
  );
  const cartDiscount = cart.reduce((sum, l) => {
    const p = byId.get(l.productId);
    return p?.oldPrice ? sum + (p.oldPrice - p.price) * l.qty : sum;
  }, 0);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = /^\d+$/.test(priceMin) ? Number(priceMin) : null;
    const max = /^\d+$/.test(priceMax) ? Number(priceMax) : null;
    let list = PRODUCTS.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q)) &&
        (!onlyDiscount || p.oldPrice !== undefined) &&
        (tag === "all" || (tag === "new" ? p.isNew : p.bestseller)) &&
        (min === null || p.price >= min) &&
        (max === null || p.price <= max) &&
        (sizes.length === 0 || p.sizes.some((s) => sizes.includes(s))) &&
        (colors.length === 0 || p.colors.some((c) => colors.includes(c))),
    );
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "new":
        list = [...list].sort(
          (a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false),
        );
        break;
      case "popular":
      default:
        list = [...list].sort(
          (a, b) => Number(b.bestseller ?? false) - Number(a.bestseller ?? false),
        );
        break;
    }
    return list;
  }, [
    category,
    colors,
    onlyDiscount,
    priceMax,
    priceMin,
    query,
    sizes,
    sort,
    tag,
  ]);

  const value: StoreValue = {
    route,
    go,
    openProduct,
    closeProduct,
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    onlyDiscount,
    setOnlyDiscount,
    tag,
    setTag,
    priceMin,
    priceMax,
    setPriceMin,
    setPriceMax,
    sizes,
    toggleSize,
    colors,
    toggleColor,
    resetFilters,
    visibleProducts,
    favs,
    isFav,
    toggleFav,
    clearFavs,
    cart,
    cartCount,
    cartTotal,
    cartDiscount,
    addToCart,
    setLineQty,
    clearCart,
    cartPulse,
    bumpCartPulse,
    orders,
    addOrder,
    productSel,
    selectVariant,
    checkoutOpen,
    setCheckoutOpen,
    toast,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore вне StoreProvider");
  return ctx;
}
