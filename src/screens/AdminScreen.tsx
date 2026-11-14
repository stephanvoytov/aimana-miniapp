import {
  AlertCircle,
  ArrowUpRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  Users as UsersIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  AdminAuthError,
  adminApi,
  clearAdminToken,
  getAdminToken,
  pluralize,
  saveAdminToken,
  type AdminOrder,
  type AdminProduct,
  type AdminStats,
  type AdminUser,
} from "@/lib/admin";
import { cn } from "@/lib/utils";
import { Dashboard } from "@/screens/admin/Dashboard";
import { Orders } from "@/screens/admin/Orders";
import { Products, type ProductEditor } from "@/screens/admin/Products";
import { Users } from "@/screens/admin/Users";
import {
  AdminToast,
  Card,
  btnPrimary,
  btnSecondary,
  inputClass,
} from "@/screens/admin/ui";

type Tab = "dashboard" | "products" | "orders" | "users";

const NAV: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Главная", icon: LayoutDashboard },
  { id: "products", label: "Товары", icon: Package },
  { id: "orders", label: "Заказы", icon: ShoppingBag },
  { id: "users", label: "Пользователи", icon: UsersIcon },
];

type AdminData = {
  stats: AdminStats;
  products: AdminProduct[];
  orders: AdminOrder[];
  users: AdminUser[];
};

export function AdminScreen() {
  const [token, setToken] = useState(getAdminToken);
  const [authRequired, setAuthRequired] = useState(() => !getAdminToken());
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authAttempt, setAuthAttempt] = useState(0);

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(() => !!getAdminToken());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [range, setRange] = useState(30);
  const [productEditor, setProductEditor] = useState<ProductEditor>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string) => {
    if (!message) return;
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    const previous = document.title;
    document.title = "AIMANA — Админка";
    return () => {
      document.title = previous;
    };
  }, []);

  const loadAll = useCallback(
    async (mode: "initial" | "silent" | "refresh" = "silent") => {
      if (!token) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (mode === "initial" && !hasDataRef.current) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [stats, products, orders, users] = await Promise.all([
          adminApi.stats(range),
          adminApi.products(),
          adminApi.orders(),
          adminApi.users(),
        ]);
        setData({ stats, products, orders, users });
        hasDataRef.current = true;
        setAuthRequired(false);
        setLoginError(null);
      } catch (loadError) {
        if (loadError instanceof AdminAuthError) {
          setAuthRequired(true);
          setLoginError("Неверный токен. Проверьте ADMIN_TOKEN и попробуйте снова.");
        } else {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить данные",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range, token],
  );

  useEffect(() => {
    if (!token) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    void loadAll(hasDataRef.current ? "silent" : "initial");
  }, [authAttempt, loadAll, token]);

  const handleLogin = (nextToken: string) => {
    const trimmed = nextToken.trim();
    if (!trimmed) {
      setLoginError("Введите токен администратора");
      return;
    }
    saveAdminToken(trimmed);
    setToken(trimmed);
    setAuthRequired(false);
    setLoginError(null);
    setLoading(true);
    setAuthAttempt((value) => value + 1);
  };

  const handleLogout = () => {
    clearAdminToken();
    setToken("");
    setData(null);
    hasDataRef.current = false;
    setAuthRequired(true);
    setLoading(false);
    setRefreshing(false);
    setError(null);
    setLoginError(null);
    setTab("dashboard");
    setRange(30);
    setProductEditor(null);
    setSelectedOrderId(null);
  };

  const handleRefresh = () => {
    void loadAll("refresh");
  };

  const handleChanged = (message: string) => {
    void loadAll("silent");
    if (message) notify(message);
  };

  const openProduct = (product: AdminProduct) => {
    setProductEditor({ mode: "edit", product });
    setTab("products");
  };

  const addProduct = () => {
    setProductEditor({ mode: "create" });
    setTab("products");
  };

  const openOrder = (id: string) => {
    setSelectedOrderId(id);
    setTab("orders");
  };

  const openOrders = () => {
    setSelectedOrderId(null);
    setTab("orders");
  };

  if (authRequired) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  if (loading && !data) {
    return <LoadingScreen />;
  }

  if (!data) {
    return (
      <ErrorScreen
        message={error || "Не удалось загрузить данные админки"}
        onRetry={handleRefresh}
        onLogout={handleLogout}
      />
    );
  }

  const { stats, products, orders, users } = data;
  const newOrders = stats.newOrders;

  return (
    <div
      className="min-h-dvh bg-adm-bg text-[14px] text-adm-ink antialiased"
      style={{ colorScheme: "light" }}
    >
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-adm-line bg-adm-card lg:flex">
        <div className="flex h-[78px] items-center gap-3 px-5">
          <BrandMark size={38} />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight tracking-[-0.01em]">
              AIMANA
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-adm-muted">
              Mini App Admin
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            const badge = item.id === "orders" ? newOrders : 0;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition",
                  active
                    ? "bg-adm-blue-soft text-adm-blue"
                    : "text-adm-muted hover:bg-adm-soft hover:text-adm-ink",
                )}
                onClick={() => setTab(item.id)}
              >
                <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
                {item.label}
                {badge > 0 && (
                  <span className="ml-auto rounded-full bg-adm-red-soft px-2 py-0.5 text-[10px] font-semibold tabular-nums text-adm-red">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 p-3">
          <div className="rounded-2xl bg-[#15171c] p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
                Витрина
              </span>
              <Store size={15} className="text-white/50" />
            </div>
            <div className="mt-1.5 text-[14px] font-semibold">
              Магазин AIMANA
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-white/50">
              {products.length} {pluralize(products.length, "товар", "товара", "товаров")} · {newOrders} {pluralize(newOrders, "новый заказ", "новых заказа", "новых заказов")}
            </p>
            <a
              href="/?storefront=1"
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[11px] font-semibold text-[#15171c] transition hover:bg-white/90"
            >
              Открыть
              <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-adm-line p-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-adm-soft text-adm-muted">
              <UserRound size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-medium">Администратор</div>
              <div className="text-[10px] text-adm-muted">Полный доступ</div>
            </div>
            <button
              type="button"
              className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-adm-muted transition hover:bg-adm-red-soft hover:text-adm-red"
              onClick={handleLogout}
              aria-label="Выйти из админки"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-adm-line bg-adm-card lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <BrandMark size={30} />
            <div>
              <div className="text-[13px] font-semibold leading-tight">
                AIMANA
              </div>
              <div className="text-[9px] font-medium uppercase tracking-[0.14em] text-adm-muted">
                Mini App Admin
              </div>
            </div>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-adm-muted transition hover:bg-adm-soft hover:text-adm-ink"
            onClick={handleLogout}
            aria-label="Выйти из админки"
          >
            <LogOut size={16} />
          </button>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition",
                  active
                    ? "bg-adm-blue-soft text-adm-blue"
                    : "text-adm-muted hover:bg-adm-soft hover:text-adm-ink",
                )}
                onClick={() => setTab(item.id)}
              >
                <Icon size={14} />
                {item.label}
                {item.id === "orders" && newOrders > 0 && (
                  <span className="rounded-full bg-adm-red-soft px-1.5 text-[10px] font-semibold text-adm-red">
                    {newOrders}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-adm-red/20 bg-adm-red-soft px-3.5 py-2.5 text-[12px] text-adm-red">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">{error}</span>
              <button
                type="button"
                className="shrink-0 font-medium underline underline-offset-2"
                onClick={handleRefresh}
              >
                Повторить
              </button>
              <button
                type="button"
                className="shrink-0"
                onClick={() => setError(null)}
                aria-label="Скрыть"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {tab === "dashboard" && (
            <Dashboard
              stats={stats}
              products={products}
              orders={orders}
              range={range}
              refreshing={refreshing}
              onRangeChange={setRange}
              onRefresh={handleRefresh}
              onOpenOrder={openOrder}
              onOpenOrders={openOrders}
              onOpenProducts={() => setTab("products")}
              onEditProduct={openProduct}
              onAddProduct={addProduct}
            />
          )}

          {tab === "products" && (
            <Products
              products={products}
              editor={productEditor}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onEdit={openProduct}
              onAdd={addProduct}
              onCloseEditor={() => setProductEditor(null)}
              onChanged={handleChanged}
              notify={notify}
            />
          )}

          {tab === "orders" && (
            <Orders
              orders={orders}
              products={products}
              selectedOrderId={selectedOrderId}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onSelectOrder={setSelectedOrderId}
              onCloseOrder={() => setSelectedOrderId(null)}
              onChanged={handleChanged}
              notify={notify}
            />
          )}

          {tab === "users" && (
            <Users
              users={users}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </main>

      <AdminToast message={toast} />
    </div>
  );
}

function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-[11px] bg-[#15171c] text-white"
      style={{ width: size, height: size }}
    >
      <span
        className="font-semibold leading-none tracking-[-0.05em]"
        style={{ fontSize: size * 0.48 }}
      >
        A
      </span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-adm-bg text-adm-muted">
      <BrandMark size={44} />
      <div className="flex items-center gap-2 text-[13px]">
        <Loader2 size={16} className="animate-spin" />
        Загружаем данные
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
  onLogout,
}: {
  message: string;
  onRetry: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-adm-bg px-4 py-10">
      <Card className="w-full max-w-[420px] p-6 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-adm-red-soft text-adm-red">
          <AlertCircle size={20} />
        </div>
        <h1 className="mt-4 text-[18px] font-semibold text-adm-ink">
          Не удалось загрузить админку
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-adm-muted">
          {message}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" className={btnSecondary} onClick={onLogout}>
            Сменить токен
          </button>
          <button type="button" className={btnPrimary} onClick={onRetry}>
            <RefreshCw size={15} />
            Повторить
          </button>
        </div>
      </Card>
    </div>
  );
}

function LoginScreen({
  onLogin,
  error,
}: {
  onLogin: (token: string) => void;
  error: string | null;
}) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onLogin(value);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-adm-bg px-4 py-10 text-adm-ink">
      <div className="w-full max-w-[380px]">
        <div className="mb-5 flex items-center gap-3">
          <BrandMark size={42} />
          <div>
            <div className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">
              AIMANA
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-adm-muted">
              Mini App Admin
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-adm-blue">
            <ShieldCheck size={17} />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
              Защищённый вход
            </span>
          </div>
          <h1 className="mt-3 text-[21px] font-semibold tracking-[-0.02em]">
            Вход в админку
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-adm-muted">
            Введите токен администратора из переменной <code>ADMIN_TOKEN</code>.
          </p>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            <div className="relative">
              <input
                type={visible ? "text" : "password"}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Токен администратора"
                autoComplete="current-password"
                autoFocus
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-adm-muted transition hover:bg-adm-soft hover:text-adm-ink"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? "Скрыть токен" : "Показать токен"}
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-adm-red/20 bg-adm-red-soft px-3 py-2.5 text-[12px] text-adm-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`${btnPrimary} w-full`}
              disabled={!value.trim()}
            >
              Войти
            </button>
          </form>

          <a
            href="/?storefront=1"
            className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-adm-muted transition hover:text-adm-ink"
          >
            <Store size={13} />
            Вернуться в магазин
          </a>
        </Card>

        <p className="mt-4 text-center text-[11px] text-adm-muted">
          Токен хранится только в этом браузере.
        </p>
      </div>
    </div>
  );
}
