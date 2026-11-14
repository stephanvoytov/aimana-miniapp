import {
  AtSign,
  ChevronRight,
  Loader2,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  adminApi,
  formatAdminDateTime,
  formatNumber,
  pluralize,
  type AdminOrder,
  type AdminProduct,
  type OrderStatus,
} from "@/lib/admin";
import { assetUrl, formatPrice } from "@/lib/utils";
import {
  Card,
  Drawer,
  EmptyState,
  PageHeader,
  StatusPill,
  btnSecondary,
  inputClass,
} from "@/screens/admin/ui";

type StatusFilter = "all" | OrderStatus;

export function Orders({
  orders,
  products,
  selectedOrderId,
  refreshing,
  onRefresh,
  onSelectOrder,
  onCloseOrder,
  onChanged,
  notify,
}: {
  orders: AdminOrder[];
  products: AdminProduct[];
  selectedOrderId: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onSelectOrder: (id: string) => void;
  onCloseOrder: () => void;
  onChanged: (message: string) => void;
  notify: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [updating, setUpdating] = useState<OrderStatus | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: orders.length };
    for (const item of orders) {
      result[item.status] = (result[item.status] || 0) + 1;
    }
    return result;
  }, [orders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (!query) return true;
      const haystack = [
        order.id,
        order.customer?.name,
        order.customer?.phone,
        order.user?.name,
        order.user?.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, search, status]);

  const selected = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId) || null
    : null;

  const changeStatus = async (order: AdminOrder, next: OrderStatus) => {
    if (next === order.status || updating) return;
    setUpdating(next);
    try {
      await adminApi.updateOrderStatus(order.id, next);
      onChanged(
        `Заказ ${order.id}: ${ORDER_STATUS_META[next].label.toLowerCase()}`,
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Не удалось изменить статус",
      );
    } finally {
      setUpdating(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Заказы"
        subtitle={
          orders.length > 0
            ? `${orders.length} ${pluralize(orders.length, "заказ", "заказа", "заказов")} · ${counts.new || 0} ${pluralize(counts.new || 0, "новый", "новых", "новых")}`
            : "Заказы магазина"
        }
        actions={
          <button
            type="button"
            className={btnSecondary}
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : undefined}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Обновление" : "Обновить"}
            </span>
          </button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-adm-line px-4 py-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-adm-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Номер, имя или телефон"
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              label="Все"
              count={counts.all || 0}
              active={status === "all"}
              onClick={() => setStatus("all")}
            />
            {ORDER_STATUSES.map((item) => (
              <FilterChip
                key={item}
                label={ORDER_STATUS_META[item].label}
                count={counts[item] || 0}
                active={status === item}
                onClick={() => setStatus(item)}
              />
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={20} />}
            title="Заказов пока нет"
            description="Когда покупатель оформит заказ, он появится здесь."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={20} />}
            title="Ничего не найдено"
            description="Измените запрос или сбросьте фильтр по статусу."
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
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-adm-line bg-adm-soft/70 text-[11px] font-medium uppercase tracking-wide text-adm-muted">
                  <th className="px-4 py-2.5 font-medium">Заказ</th>
                  <th className="px-3 py-2.5 font-medium">Клиент</th>
                  <th className="px-3 py-2.5 font-medium">Состав</th>
                  <th className="px-3 py-2.5 font-medium">Сумма</th>
                  <th className="px-3 py-2.5 font-medium">Статус</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-adm-line/80">
                {filtered.map((order) => {
                  const firstItem = order.items[0];
                  return (
                    <tr
                      key={order.id}
                      className="cursor-pointer transition hover:bg-adm-soft"
                      onClick={() => onSelectOrder(order.id)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="text-[13px] font-semibold text-adm-ink">
                          {order.id}
                        </div>
                        <div className="mt-0.5 text-[11px] text-adm-muted">
                          {formatAdminDateTime(order.date)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-[12px] font-medium text-adm-ink">
                          {order.customer?.name ||
                            order.user?.name ||
                            "Без имени"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-adm-muted">
                          {order.customer?.phone ||
                            (order.user?.username
                              ? `@${order.user.username}`
                              : "—")}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-[12px] text-adm-ink">
                          {order.count} шт.
                        </div>
                        <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-adm-muted">
                          {firstItem?.name || "—"}
                          {order.items.length > 1
                            ? ` +${order.items.length - 1}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-[13px] font-semibold tabular-nums text-adm-ink">
                          {formatPrice(order.total)}
                        </div>
                        {order.discount > 0 && (
                          <div className="text-[11px] text-adm-green">
                            скидка {formatNumber(order.discount)} ₽
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ChevronRight
                          size={16}
                          className="ml-auto text-adm-muted"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) onCloseOrder();
        }}
        title={selected ? `Заказ ${selected.id}` : "Заказ"}
        subtitle={
          selected
            ? `${formatAdminDateTime(selected.date)} · ${selected.count} шт.`
            : undefined
        }
        footer={
          <div className="flex justify-end">
            <button type="button" className={btnSecondary} onClick={onCloseOrder}>
              <X size={15} />
              Закрыть
            </button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-medium text-adm-muted">
                  Статус заказа
                </h3>
                {updating && (
                  <span className="flex items-center gap-1 text-[11px] text-adm-muted">
                    <Loader2 size={12} className="animate-spin" />
                    Сохраняем
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ORDER_STATUSES.map((item) => {
                  const active = selected.status === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={!!updating}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                        active
                          ? "bg-adm-blue text-white"
                          : "border border-adm-line bg-adm-card text-adm-muted hover:bg-adm-soft hover:text-adm-ink"
                      } disabled:opacity-60`}
                      onClick={() => changeStatus(selected, item)}
                    >
                      {ORDER_STATUS_META[item].label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-adm-muted">
                Статус сохраняется сразу и виден покупателю в его заказах.
              </p>
            </section>

            <section className="rounded-xl border border-adm-line p-4">
              <h3 className="text-[12px] font-medium text-adm-muted">Клиент</h3>
              <div className="mt-2 space-y-2 text-[13px] text-adm-ink">
                <div className="flex items-center gap-2">
                  <UserRound size={14} className="shrink-0 text-adm-muted" />
                  {selected.customer?.name ||
                    selected.user?.name ||
                    "Без имени"}
                </div>
                {selected.customer?.phone && (
                  <a
                    href={`tel:${selected.customer.phone}`}
                    className="flex items-center gap-2 text-adm-blue hover:underline"
                  >
                    <Phone size={14} className="shrink-0" />
                    {selected.customer.phone}
                  </a>
                )}
                {selected.user?.username && (
                  <div className="flex items-center gap-2 text-adm-muted">
                    <AtSign size={14} className="shrink-0" />
                    <span>{selected.user.username}</span>
                    {selected.user.telegramId !== undefined && (
                      <span className="text-[11px]">
                        · Telegram ID {selected.user.telegramId}
                      </span>
                    )}
                  </div>
                )}
                {selected.customer?.comment && (
                  <div className="flex items-start gap-2 rounded-lg bg-adm-soft px-2.5 py-2 text-[12px] text-adm-muted">
                    <MessageSquare size={14} className="mt-0.5 shrink-0" />
                    {selected.customer.comment}
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-medium text-adm-muted">
                  Состав заказа
                </h3>
                <span className="text-[11px] text-adm-muted">
                  {selected.items.length} позиций
                </span>
              </div>
              <div className="divide-y divide-adm-line/80 rounded-xl border border-adm-line">
                {selected.items.map((item, index) => {
                  const product = item.productId
                    ? productMap.get(item.productId)
                    : undefined;
                  const image = product?.image
                    ? assetUrl(product.image)
                    : "";
                  return (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-adm-line bg-adm-soft">
                        {image ? (
                          <img
                            src={image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package size={15} className="text-adm-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-adm-ink">
                          {item.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-adm-muted">
                          {[item.size, item.color].filter(Boolean).join(" · ") ||
                            "Без варианта"}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[12px] font-medium tabular-nums text-adm-ink">
                          {formatPrice(item.price * item.qty)}
                        </div>
                        <div className="text-[11px] text-adm-muted">
                          {item.qty} × {formatPrice(item.price)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl bg-adm-soft px-4 py-3">
              <div className="flex items-center justify-between text-[12px] text-adm-muted">
                <span>Позиции</span>
                <span className="tabular-nums">
                  {formatPrice(
                    selected.items.reduce(
                      (sum, item) => sum + item.price * item.qty,
                      0,
                    ),
                  )}
                </span>
              </div>
              {selected.discount > 0 && (
                <div className="mt-1.5 flex items-center justify-between text-[12px] text-adm-green">
                  <span>Скидка</span>
                  <span className="tabular-nums">
                    −{formatPrice(selected.discount)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-adm-line pt-2 text-[14px] font-semibold text-adm-ink">
                <span>Итого</span>
                <span className="tabular-nums">{formatPrice(selected.total)}</span>
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
        active
          ? "bg-adm-blue text-white"
          : "bg-adm-soft text-adm-muted hover:text-adm-ink"
      }`}
      onClick={onClick}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[10px] tabular-nums ${
          active ? "bg-white/20 text-white" : "bg-adm-card text-adm-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
