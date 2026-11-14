import {
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ADMIN_CATEGORIES,
  adminApi,
  categoryLabel,
  pluralize,
  splitList,
  stockMeta,
  type AdminProduct,
  type ProductPayload,
} from "@/lib/admin";
import { assetUrl, formatPrice } from "@/lib/utils";
import {
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Pill,
  Select,
  btnPrimary,
  btnSecondary,
  inputClass,
  textareaClass,
} from "@/screens/admin/ui";

export type ProductEditor =
  | { mode: "create" }
  | { mode: "edit"; product: AdminProduct }
  | null;

type StockFilter = "all" | "in" | "low" | "out";

const CATEGORY_OPTIONS = [
  { value: "all", label: "Все категории" },
  ...ADMIN_CATEGORIES.map((category) => ({
    value: category.id,
    label: category.label,
  })),
];

const STOCK_OPTIONS = [
  { value: "all", label: "Любой остаток" },
  { value: "in", label: "В наличии" },
  { value: "low", label: "Заканчиваются" },
  { value: "out", label: "Нет в наличии" },
];

export function Products({
  products,
  editor,
  refreshing,
  onRefresh,
  onEdit,
  onAdd,
  onCloseEditor,
  onChanged,
  notify,
}: {
  products: AdminProduct[];
  editor: ProductEditor;
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (product: AdminProduct) => void;
  onAdd: () => void;
  onCloseEditor: () => void;
  onChanged: (message: string) => void;
  notify: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lowStockCount = products.filter(
    (product) => product.stock <= 3,
  ).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (
        query &&
        !product.name.toLowerCase().includes(query) &&
        !product.id.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (category !== "all" && product.category !== category) return false;
      if (stockFilter === "in" && product.stock <= 3) return false;
      if (stockFilter === "low" && (product.stock <= 0 || product.stock > 3)) {
        return false;
      }
      if (stockFilter === "out" && product.stock > 0) return false;
      return true;
    });
  }, [products, search, category, stockFilter]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStockFilter("all");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      onChanged("Товар удалён");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Не удалось удалить товар");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Товары"
        subtitle={
          products.length > 0
            ? `${products.length} ${pluralize(products.length, "товар", "товара", "товаров")} · ${lowStockCount} с низким остатком`
            : "Каталог магазина"
        }
        actions={
          <>
            <button
              type="button"
              className={btnSecondary}
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Обновить"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : undefined}
              />
            </button>
            <button type="button" className={btnPrimary} onClick={onAdd}>
              <Plus size={16} />
              Добавить товар
            </button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-adm-line px-4 py-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-adm-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию или ID"
              className={`${inputClass} pl-9`}
            />
          </div>
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
            className="w-[170px]"
          />
          <Select
            value={stockFilter}
            onChange={(value) => setStockFilter(value as StockFilter)}
            options={STOCK_OPTIONS}
            className="w-[170px]"
          />
          <span className="ml-auto hidden text-[12px] text-adm-muted sm:block">
            {filtered.length} из {products.length}
          </span>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<Package size={20} />}
            title="Товаров пока нет"
            description="Добавьте первый товар — он сразу появится в каталоге витрины."
            action={
              <button type="button" className={btnPrimary} onClick={onAdd}>
                <Plus size={16} />
                Добавить товар
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={20} />}
            title="Ничего не найдено"
            description="Попробуйте изменить запрос или сбросить фильтры."
            action={
              <button
                type="button"
                className={btnSecondary}
                onClick={resetFilters}
              >
                Сбросить фильтры
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-adm-line bg-adm-soft/70 text-[11px] font-medium uppercase tracking-wide text-adm-muted">
                  <th className="px-4 py-2.5 font-medium">Товар</th>
                  <th className="px-3 py-2.5 font-medium">Категория</th>
                  <th className="px-3 py-2.5 font-medium">Цена</th>
                  <th className="px-3 py-2.5 font-medium">Остаток</th>
                  <th className="px-3 py-2.5 font-medium">Статус</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adm-line/80">
                {filtered.map((product) => {
                  const stock = stockMeta(product.stock);
                  return (
                    <tr
                      key={product.id}
                      className="cursor-pointer transition hover:bg-adm-soft"
                      onClick={() => onEdit(product)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-adm-line bg-adm-soft">
                            {product.image ? (
                              <img
                                src={assetUrl(product.image)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package size={15} className="text-adm-muted" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium text-adm-ink">
                                {product.name}
                              </span>
                              {product.bestseller && (
                                <span className="rounded bg-adm-amber-soft px-1.5 py-0.5 text-[10px] font-medium text-adm-amber">
                                  Хит
                                </span>
                              )}
                              {product.isNew && (
                                <span className="rounded bg-adm-blue-soft px-1.5 py-0.5 text-[10px] font-medium text-adm-blue">
                                  Новинка
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[11px] text-adm-muted">
                              {product.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-adm-muted">
                        {categoryLabel(product.category)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-[12px] font-medium tabular-nums text-adm-ink">
                          {formatPrice(product.price)}
                        </div>
                        {product.oldPrice && (
                          <div className="text-[11px] text-adm-muted line-through tabular-nums">
                            {formatPrice(product.oldPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] tabular-nums text-adm-ink">
                        {product.stock} шт.
                      </td>
                      <td className="px-3 py-2.5">
                        <Pill label={stock.label} className={stock.pill} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-lg text-adm-muted transition hover:bg-adm-blue-soft hover:text-adm-blue"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit(product);
                            }}
                            aria-label={`Редактировать ${product.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-lg text-adm-muted transition hover:bg-adm-red-soft hover:text-adm-red"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(product);
                            }}
                            aria-label={`Удалить ${product.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProductEditorDrawer
        editor={editor}
        onClose={onCloseEditor}
        onChanged={onChanged}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить товар?"
        description={
          deleteTarget
            ? `«${deleteTarget.name}» исчезнет из каталога. Заказы, в которых он уже есть, сохранятся.`
            : ""
        }
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ProductEditorDrawer({
  editor,
  onClose,
  onChanged,
}: {
  editor: ProductEditor;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const editing = editor?.mode === "edit" ? editor.product : null;
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    oldPrice: "",
    category: "glasses",
    stock: "0",
    image: "",
    description: "",
    colors: "",
    sizes: "",
    bestseller: false,
    isNew: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    setError(null);
    setSaving(false);
    if (editor.mode === "edit") {
      const product = editor.product;
      setForm({
        id: product.id,
        name: product.name,
        price: String(product.price),
        oldPrice: product.oldPrice ? String(product.oldPrice) : "",
        category: product.category,
        stock: String(product.stock),
        image: product.image || "",
        description: product.description || "",
        colors: product.colors.join(", "),
        sizes: product.sizes.join(", "),
        bestseller: !!product.bestseller,
        isNew: !!product.isNew,
      });
    } else {
      setForm({
        id: "",
        name: "",
        price: "",
        oldPrice: "",
        category: "glasses",
        stock: "0",
        image: "",
        description: "",
        colors: "",
        sizes: "",
        bestseller: false,
        isNew: false,
      });
    }
  }, [editor]);

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const validate = (): string | null => {
    if (!editing) {
      if (!form.id.trim()) return "Укажите ID товара";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.id.trim())) {
        return "ID: только строчные латинские буквы, цифры и дефис";
      }
    }
    if (!form.name.trim()) return "Укажите название";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return "Цена должна быть больше 0";
    if (form.oldPrice.trim()) {
      const oldPrice = Number(form.oldPrice);
      if (!Number.isFinite(oldPrice) || oldPrice <= price) {
        return "Старая цена должна быть больше текущей";
      }
    }
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return "Остаток — целое число от 0";
    }
    return null;
  };

  const save = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);
    const payload: ProductPayload = {
      id: editing?.id || form.id.trim(),
      name: form.name.trim(),
      price,
      oldPrice: form.oldPrice.trim() ? Number(form.oldPrice) : undefined,
      category: form.category,
      colors: splitList(form.colors),
      sizes: splitList(form.sizes),
      description: form.description.trim(),
      image: form.image.trim(),
      images: editing?.images || [],
      bestseller: form.bestseller,
      isNew: form.isNew,
      stock,
    };

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await adminApi.updateProduct(editing.id, payload);
        onChanged("Товар обновлён");
      } else {
        await adminApi.createProduct(payload);
        onChanged("Товар добавлен");
      }
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Не удалось сохранить",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={!!editor}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
      title={editing ? "Редактирование товара" : "Новый товар"}
      subtitle={editing ? editing.id : "Карточка появится в каталоге сразу"}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={onClose}
            disabled={saving}
          >
            Отмена
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={save}
            disabled={saving}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editing ? "Сохранить" : "Добавить товар"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-adm-red/20 bg-adm-red-soft px-3 py-2.5 text-[12px] text-adm-red">
            {error}
          </div>
        )}

        <Field label="Название">
          <input
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Например, Aimana Eclipse"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="ID товара" hint={editing ? "ID нельзя изменить" : "slug для ссылки"}>
            <input
              value={form.id}
              disabled={!!editing}
              onChange={(event) => set("id", event.target.value)}
              placeholder="aimana-eclipse"
              className={inputClass}
            />
          </Field>
          <Field label="Категория">
            <Select
              value={form.category}
              onChange={(value) => set("category", value)}
              options={ADMIN_CATEGORIES.map((category) => ({
                value: category.id,
                label: category.label,
              }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Цена, ₽">
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => set("price", event.target.value)}
              placeholder="7990"
              className={inputClass}
            />
          </Field>
          <Field label="Старая цена">
            <input
              type="number"
              min={0}
              value={form.oldPrice}
              onChange={(event) => set("oldPrice", event.target.value)}
              placeholder="—"
              className={inputClass}
            />
          </Field>
          <Field label="Остаток">
            <input
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(event) => set("stock", event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Фото (URL или img/...)" hint="Можно указать путь из public, внешний URL или data:">
          <input
            value={form.image}
            onChange={(event) => set("image", event.target.value)}
            placeholder="img/eclipse.svg"
            className={inputClass}
          />
        </Field>
        {form.image && (
          <div className="flex items-center gap-3 rounded-xl border border-adm-line bg-adm-soft p-2">
            <div className="grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-adm-card">
              <img
                src={assetUrl(form.image)}
                alt="Превью"
                className="h-full w-full object-contain"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display =
                    "none";
                }}
              />
            </div>
            <div className="min-w-0 text-[11px] text-adm-muted">
              Превью карточки
            </div>
          </div>
        )}

        <Field label="Описание">
          <textarea
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="Короткое описание товара"
            className={textareaClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Цвета" hint="Через запятую">
            <input
              value={form.colors}
              onChange={(event) => set("colors", event.target.value)}
              placeholder="чёрный, белый"
              className={inputClass}
            />
          </Field>
          <Field label="Размеры" hint="Через запятую">
            <input
              value={form.sizes}
              onChange={(event) => set("sizes", event.target.value)}
              placeholder="S, M, L"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-adm-line p-3 transition hover:bg-adm-soft">
            <input
              type="checkbox"
              checked={form.bestseller}
              onChange={(event) => set("bestseller", event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-adm-blue"
            />
            <span>
              <span className="block text-[12px] font-medium text-adm-ink">
                Хит продаж
              </span>
              <span className="mt-0.5 block text-[11px] text-adm-muted">
                Показывать в подборке
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-adm-line p-3 transition hover:bg-adm-soft">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(event) => set("isNew", event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-adm-blue"
            />
            <span>
              <span className="block text-[12px] font-medium text-adm-ink">
                Новинка
              </span>
              <span className="mt-0.5 block text-[11px] text-adm-muted">
                Отметка «Новое»
              </span>
            </span>
          </label>
        </div>
      </div>
    </Drawer>
  );
}
