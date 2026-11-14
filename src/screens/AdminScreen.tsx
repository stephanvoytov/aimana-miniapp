import { useEffect, useState } from "react";

import { formatPrice } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  stock: number;
  image?: string;
  description?: string;
  bestseller?: boolean;
  isNew?: boolean;
};

type OrderItem = { name: string; size?: string; color?: string; qty: number; price: number };
type Order = {
  id: string;
  date: string;
  count: number;
  total: number;
  status: string;
  items: OrderItem[];
  customer?: { name?: string; phone?: string; comment?: string };
};

type Stats = { products: number; orders: number; revenue: number; users: number; newOrders: number };

const STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "Новый", processing: "В работе", shipped: "Отправлен",
  delivered: "Доставлен", cancelled: "Отменён",
};
const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-500",
  processing: "bg-amber-500/15 text-amber-500",
  shipped: "bg-purple-500/15 text-purple-500",
  delivered: "bg-emerald-500/15 text-emerald-500",
  cancelled: "bg-red-500/10 text-red-500",
};
const CATEGORIES = [
  { id: "glasses", label: "Очки" },
  { id: "clothes", label: "Одежда" },
  { id: "accessories", label: "Аксессуары" },
];

async function apiFetch(path: string, init?: RequestInit) {
  const tg = (window as any).Telegram?.WebApp;
  const initData = tg?.initData || "";
  const adminToken = localStorage.getItem("adminToken") || "";
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
      ...(adminToken ? { "X-Admin-Token": adminToken } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export function AdminScreen() {
  const [tab, setTab] = useState<"stats" | "products" | "orders">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, o] = await Promise.all([
        apiFetch("/api/admin/stats"),
        apiFetch("/api/products"),
        apiFetch("/api/orders"),
      ]);
      setStats(s);
      setProducts(p);
      setOrders(o);
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const resetForm = () => { setEditing(null); setForm({}); setFormError(null); };

  const startEdit = (p: Product) => { setEditing(p); setForm({ ...p }); setFormError(null); };

  const startNew = () => {
    setEditing(null);
    setForm({ id: "", name: "", price: 0, category: "clothes", stock: 0, image: "", description: "" });
    setFormError(null);
  };

  const validateForm = (): string | null => {
    if (!form.id?.trim()) return "Укажите ID товара";
    if (!form.name?.trim()) return "Укажите название";
    if (!form.price || form.price <= 0) return "Укажите цену больше 0";
    if (!form.category) return "Выберите категорию";
    if (form.stock === undefined || form.stock < 0) return "Укажите остаток";
    return null;
  };

  const saveProduct = async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await apiFetch(`/api/products/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
        showToast("Товар обновлён");
      } else {
        await apiFetch("/api/products", { method: "POST", body: JSON.stringify(form) });
        showToast("Товар создан");
      }
      resetForm();
      await loadAll();
    } catch (e: any) {
      setFormError(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/api/products/${deleteId}`, { method: "DELETE" });
      showToast("Товар удалён");
      setDeleteId(null);
      await loadAll();
    } catch (e: any) {
      showToast(e?.message || "Ошибка удаления");
      setDeleteId(null);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      showToast(`Статус: ${STATUS_LABEL[status]}`);
      await loadAll();
    } catch (e: any) {
      showToast(e?.message || "Ошибка");
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  const inputClass = "w-full rounded-xl bg-page px-3 py-2 text-[14px] text-ink outline-none ring-1 ring-line focus:ring-accent disabled:opacity-50";

  return (
    <div className="min-h-dvh bg-page text-ink">
      <div className="sticky top-0 z-10 border-b border-line bg-page/95 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold">Админ-панель</h1>
          <button className="rounded-full bg-field px-3 py-1.5 text-[12px] text-hint" onClick={loadAll} disabled={loading}>
            {loading ? "..." : "Обновить"}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {(["stats", "products", "orders"] as const).map((t) => (
            <button
              key={t}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${tab === t ? "bg-accent text-accent-ink" : "bg-field text-hint"}`}
              onClick={() => setTab(t)}
            >
              {t === "stats" ? "Статистика" : t === "products" ? "Товары" : "Заказы"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <div className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-500">{error}</div>
        )}

        {tab === "stats" && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Товаров" value={stats.products} icon="📦" />
              <StatCard label="Заказов" value={stats.orders} icon="🛒" />
              <StatCard label="Новых" value={stats.newOrders} icon="🆕" accent={stats.newOrders > 0} />
              <StatCard label="Пользователей" value={stats.users} icon="👤" />
              <StatCard label="Выручка" value={formatPrice(stats.revenue)} icon="💰" wide />
            </div>
            {orders.length > 0 && (
              <div>
                <div className="mb-2 text-[14px] font-medium text-hint">Последние заказы</div>
                <div className="space-y-2">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl bg-field px-3 py-2">
                      <div>
                        <div className="text-[13px] font-medium">{o.id}</div>
                        <div className="text-[11px] text-hint">{o.count} шт. · {o.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[o.status]}`}>
                          {STATUS_LABEL[o.status]}
                        </span>
                        <span className="text-[13px] font-semibold">{formatPrice(o.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-field p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[15px] font-medium">
                  {editing ? `Редактирование: ${editing.id}` : form.id ? "Новый товар" : "Товары"}
                </div>
                {(editing || form.id) && (
                  <button className="text-[12px] text-hint" onClick={resetForm}>Сбросить</button>
                )}
              </div>

              {!editing && !form.id ? (
                <button className="w-full rounded-xl bg-accent py-2.5 text-[14px] font-medium text-accent-ink" onClick={startNew}>
                  + Добавить товар
                </button>
              ) : (
                <div className="space-y-3">
                  {formError && (
                    <div className="rounded-xl bg-red-500/10 px-3 py-2 text-[12px] text-red-500">{formError}</div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ID" value={form.id || ""} onChange={(v) => setForm({ ...form, id: v })} disabled={!!editing} />
                    <Field label="Название" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} />
                    <Field label="Цена" type="number" value={form.price ?? ""} onChange={(v) => setForm({ ...form, price: Number(v) })} />
                    <Field label="Старая цена" type="number" value={form.oldPrice ?? ""} onChange={(v) => setForm({ ...form, oldPrice: v ? Number(v) : undefined })} />
                    <div>
                      <label className="mb-1 block text-[12px] text-hint">Категория</label>
                      <select value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                        <option value="">— выберите —</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <Field label="Остаток" type="number" value={form.stock ?? ""} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
                  </div>
                  <Field label="Фото (URL)" value={form.image || ""} onChange={(v) => setForm({ ...form, image: v })} />
                  {form.image && (
                    <div className="flex justify-center">
                      <img src={form.image} alt="превью" className="h-32 w-24 rounded-xl object-cover ring-1 ring-line" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-[12px] text-hint">Описание</label>
                    <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass + " resize-none"} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="rounded-xl bg-accent px-5 py-2.5 text-[13px] font-medium text-accent-ink disabled:opacity-50" onClick={saveProduct} disabled={saving}>
                      {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
                    </button>
                    <button className="rounded-xl bg-page px-5 py-2.5 text-[13px] text-hint" onClick={resetForm} disabled={saving}>
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input type="text" placeholder="Поиск по названию или ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl bg-field px-4 py-2.5 text-[14px] text-ink outline-none ring-1 ring-line focus:ring-accent" />

            <div className="overflow-hidden rounded-2xl bg-field">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 border-b border-line px-3 py-2 text-[11px] font-medium text-hint">
                <span>Фото</span>
                <span>Товар</span>
                <span>Цена</span>
                <span>Действия</span>
              </div>
              {filteredProducts.length === 0 && (
                <div className="py-8 text-center text-[13px] text-hint">Ничего не найдено</div>
              )}
              {filteredProducts.map((p) => (
                <div key={p.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 border-b border-line/50 px-3 py-2.5 last:border-0">
                  <div className="h-12 w-10 overflow-hidden rounded-lg bg-card">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-hint">—</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{p.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-hint">
                      <span>{p.id}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${p.stock === 0 ? "bg-red-500/10 text-red-500" : p.stock <= 3 ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                        {p.stock} шт.
                      </span>
                      {p.bestseller && <span className="text-[10px]">🔥</span>}
                      {p.isNew && <span className="text-[10px]">✨</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold">{formatPrice(p.price)}</div>
                    {p.oldPrice && (
                      <div className="text-[10px] text-hint line-through">{formatPrice(p.oldPrice)}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button className="rounded-lg bg-page px-2.5 py-1.5 text-[11px] text-ink" onClick={() => startEdit(p)}>✏️</button>
                    <button className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-500" onClick={() => setDeleteId(p.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="py-12 text-center text-[14px] text-hint">Заказов пока нет</div>
            )}
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl bg-field p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[15px] font-semibold">{o.id}</div>
                    <div className="text-[11px] text-hint">{o.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold">{formatPrice(o.total)}</div>
                    <div className="text-[11px] text-hint">{o.count} шт.</div>
                  </div>
                </div>
                {o.customer && (o.customer.name || o.customer.phone) && (
                  <div className="mt-2 rounded-xl bg-page px-3 py-2 text-[12px]">
                    {o.customer.name && <div>👤 {o.customer.name}</div>}
                    {o.customer.phone && <div>📞 {o.customer.phone}</div>}
                    {o.customer.comment && <div className="text-hint">💬 {o.customer.comment}</div>}
                  </div>
                )}
                <div className="mt-2 space-y-0.5 text-[12px] text-hint">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate">{it.name}</span>
                      <span className="shrink-0 tabular-nums">{it.qty} × {formatPrice(it.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${o.status === s ? STATUS_COLOR[s] + " ring-1 ring-current/30" : "bg-page text-hint"}`}
                      onClick={() => setStatus(o.id, s)}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <div className="w-full max-w-sm rounded-2xl bg-page p-5 shadow-xl">
              <div className="text-[16px] font-semibold">Удалить товар?</div>
              <div className="mt-1 text-[13px] text-hint">
                {products.find((p) => p.id === deleteId)?.name || deleteId} будет удалён безвозвратно.
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-xl bg-red-500 py-2.5 text-[13px] font-medium text-white" onClick={confirmDelete}>Удалить</button>
                <button className="flex-1 rounded-xl bg-field py-2.5 text-[13px] text-hint" onClick={() => setDeleteId(null)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
            <div className="rounded-full bg-black/80 px-4 py-2 text-[13px] text-white shadow-lg">{toast}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, wide, accent }: { label: string; value: any; icon: string; wide?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-2xl bg-field p-4 ${wide ? "col-span-2" : ""} ${accent ? "ring-1 ring-accent/40" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-[18px]">{icon}</span>
        <span className="text-[12px] text-hint">{label}</span>
      </div>
      <div className="mt-1 text-[22px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled }: { label: string; value: any; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-hint">{label}</span>
      <input type={type} value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl bg-page px-3 py-2 text-[14px] text-ink outline-none ring-1 ring-line focus:ring-accent disabled:opacity-50" />
    </label>
  );
}