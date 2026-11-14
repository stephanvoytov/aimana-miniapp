import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Package,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import {
  categoryLabel,
  formatAdminDateTime,
  formatNumber,
  pluralize,
  stockMeta,
  type AdminOrder,
  type AdminProduct,
  type AdminStats,
} from "@/lib/admin";
import { assetUrl, formatPrice } from "@/lib/utils";
import { SalesChart, type ChartMetric } from "@/screens/admin/SalesChart";
import {
  Card,
  DeltaPill,
  EmptyState,
  PageHeader,
  Pill,
  Select,
  StatusPill,
  btnSecondary,
} from "@/screens/admin/ui";

const RANGE_OPTIONS = [
  { value: "7", label: "7 дней" },
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
];

export function Dashboard({
  stats,
  products,
  orders,
  range,
  refreshing,
  onRangeChange,
  onRefresh,
  onOpenOrder,
  onOpenOrders,
  onOpenProducts,
  onEditProduct,
  onAddProduct,
}: {
  stats: AdminStats;
  products: AdminProduct[];
  orders: AdminOrder[];
  range: number;
  refreshing: boolean;
  onRangeChange: (days: number) => void;
  onRefresh: () => void;
  onOpenOrder: (id: string) => void;
  onOpenOrders: () => void;
  onOpenProducts: () => void;
  onEditProduct: (product: AdminProduct) => void;
  onAddProduct: () => void;
}) {
  const [metric, setMetric] = useState<ChartMetric>("revenue");

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const recentOrders = orders.slice(0, 5);
  const lowStock = useMemo(
    () =>
      products
        .filter((product) => product.stock <= 3)
        .sort((a, b) => a.stock - b.stock),
    [products],
  );

  const orderImage = (order: AdminOrder): string => {
    const item = order.items.find((line) => line.productId);
    if (!item?.productId) return "";
    const image = productMap.get(item.productId)?.image;
    return image ? assetUrl(image) : "";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Главная"
        subtitle={`Сводка по магазину за последние ${range} дней`}
        actions={
          <>
            <Select
              value={String(range)}
              onChange={(value) => onRangeChange(Number(value))}
              options={RANGE_OPTIONS}
              className="w-[132px]"
            />
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
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Выручка"
          value={formatPrice(Math.round(stats.revenue))}
          delta={stats.revenueDelta}
          current={stats.revenue}
        />
        <StatCard
          icon={ShoppingBag}
          label="Заказы"
          value={formatNumber(stats.orders)}
          delta={stats.ordersDelta}
          current={stats.orders}
        />
        <StatCard
          icon={ReceiptText}
          label="Средний чек"
          value={formatPrice(Math.round(stats.averageCheck))}
          delta={stats.averageCheckDelta}
          current={stats.averageCheck}
        />
        <StatCard
          icon={Users}
          label="Пользователи"
          value={formatNumber(stats.users)}
          footer={
            <span className="inline-flex items-center rounded-full bg-adm-blue-soft px-2 py-1 text-[11px] font-medium text-adm-blue">
              {stats.usersNew > 0
                ? `+${formatNumber(stats.usersNew)} за период`
                : "без новых"}
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-adm-ink">
                Динамика продаж
              </h2>
              <p className="mt-0.5 text-[12px] text-adm-muted">
                {stats.orders > 0
                  ? `${formatNumber(stats.orders)} ${pluralize(stats.orders, "заказ", "заказа", "заказов")} за период`
                  : "Заказов за период пока нет"}
              </p>
            </div>
            <div className="flex rounded-xl border border-adm-line bg-adm-soft p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                  metric === "revenue"
                    ? "bg-adm-blue text-white shadow-sm"
                    : "text-adm-muted hover:text-adm-ink"
                }`}
                onClick={() => setMetric("revenue")}
              >
                Выручка
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                  metric === "orders"
                    ? "bg-adm-blue text-white shadow-sm"
                    : "text-adm-muted hover:text-adm-ink"
                }`}
                onClick={() => setMetric("orders")}
              >
                Заказы
              </button>
            </div>
          </div>
          <div className="px-2 pb-1 pt-2">
            <SalesChart series={stats.series} metric={metric} />
          </div>
          <p className="px-5 pb-4 text-[11px] leading-relaxed text-adm-muted">
            Данные из реальных заказов. Отменённые заказы не входят в выручку.
          </p>
        </Card>

        <Card className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-5">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-adm-ink">
              Последние заказы
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-adm-blue transition hover:text-[#1d4ed8]"
              onClick={onOpenOrders}
            >
              Все заказы
              <ArrowRight size={13} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={20} />}
              title="Заказов пока нет"
              description="Новые заказы появятся здесь автоматически."
            />
          ) : (
            <div className="mt-2 flex-1 divide-y divide-adm-line/80">
              {recentOrders.map((order) => {
                const image = orderImage(order);
                return (
                  <button
                    key={order.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-adm-soft"
                    onClick={() => onOpenOrder(order.id)}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-adm-line bg-adm-soft">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={16} className="text-adm-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-adm-ink">
                          {order.id}
                        </span>
                        <StatusPill status={order.status} />
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-adm-muted">
                        {formatAdminDateTime(order.date)} · {order.count} шт.
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-adm-ink">
                      {formatPrice(order.total)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-adm-ink">
              Товары
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-adm-blue transition hover:text-[#1d4ed8]"
              onClick={onOpenProducts}
            >
              Все товары
              <ArrowRight size={13} />
            </button>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={<Package size={20} />}
              title="Товаров пока нет"
              description="Добавьте первый товар, чтобы он появился в каталоге."
              action={
                <button type="button" className={btnSecondary} onClick={onAddProduct}>
                  <PackagePlus size={15} />
                  Добавить товар
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-adm-line bg-adm-soft/70 text-[11px] font-medium uppercase tracking-wide text-adm-muted">
                    <th className="px-5 py-2.5 font-medium">Товар</th>
                    <th className="px-3 py-2.5 font-medium">Категория</th>
                    <th className="px-3 py-2.5 font-medium">Остаток</th>
                    <th className="px-5 py-2.5 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-adm-line/80">
                  {products.slice(0, 5).map((product) => {
                    const stock = stockMeta(product.stock);
                    return (
                      <tr
                        key={product.id}
                        className="cursor-pointer transition hover:bg-adm-soft"
                        onClick={() => onEditProduct(product)}
                      >
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-adm-line bg-adm-soft">
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
                              <div className="truncate text-[13px] font-medium text-adm-ink">
                                {product.name}
                              </div>
                              <div className="text-[11px] text-adm-muted">
                                {formatPrice(product.price)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-adm-muted">
                          {categoryLabel(product.category)}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] tabular-nums text-adm-ink">
                          {product.stock} шт.
                        </td>
                        <td className="px-5 py-2.5">
                          <Pill label={stock.label} className={stock.pill} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="min-w-0 space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
              <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-adm-ink">
                Низкий остаток
              </h2>
              {lowStock.length > 0 && (
                <span className="rounded-full bg-adm-amber-soft px-2 py-0.5 text-[11px] font-medium text-adm-amber">
                  {lowStock.length}
                </span>
              )}
            </div>

            {lowStock.length === 0 ? (
              <div className="flex items-center gap-2.5 px-5 pb-5 pt-2 text-[12px] text-adm-muted">
                <CheckCircle2 size={16} className="text-adm-green" />
                Все товары в наличии
              </div>
            ) : (
              <div className="divide-y divide-adm-line/80">
                {lowStock.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2.5 px-5 py-2.5"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-adm-line bg-adm-soft">
                      {product.image ? (
                        <img
                          src={assetUrl(product.image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={14} className="text-adm-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-adm-ink">
                        {product.name}
                      </div>
                      <div
                        className={`text-[11px] ${
                          product.stock === 0
                            ? "text-adm-red"
                            : "text-adm-amber"
                        }`}
                      >
                        {product.stock === 0
                          ? "нет в наличии"
                          : `${product.stock} шт.`}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-[11px] font-medium text-adm-blue transition hover:text-[#1d4ed8]"
                      onClick={() => onEditProduct(product)}
                    >
                      Пополнить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="px-5 pb-2 pt-5">
              <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-adm-ink">
                Быстрые действия
              </h2>
            </div>
            <div className="space-y-1 px-3 pb-3">
              <QuickAction
                icon={PackagePlus}
                label="Добавить товар"
                onClick={onAddProduct}
              />
              <a
                href="/?storefront=1"
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-[13px] font-medium text-adm-ink transition hover:bg-adm-soft"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-adm-soft text-adm-muted">
                  <Store size={15} />
                </span>
                Открыть витрину
                <ExternalLink size={13} className="ml-auto text-adm-muted" />
              </a>
              <QuickAction
                icon={RefreshCw}
                label={refreshing ? "Обновление..." : "Обновить данные"}
                onClick={onRefresh}
                disabled={refreshing}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  current,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: number | null;
  current?: number;
  footer?: ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-adm-blue-soft text-adm-blue">
        <Icon size={19} strokeWidth={1.9} />
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="whitespace-nowrap text-[25px] font-semibold tracking-[-0.03em] text-adm-ink tabular-nums">
          {value}
        </div>
        {delta !== undefined && (
          <DeltaPill value={delta} current={current ?? 0} />
        )}
        {footer}
      </div>
      <div className="mt-1 text-[12px] font-medium text-adm-muted">{label}</div>
    </Card>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-medium text-adm-ink transition hover:bg-adm-soft disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-adm-soft text-adm-muted">
        <Icon size={15} />
      </span>
      {label}
      <ArrowRight size={13} className="ml-auto text-adm-muted" />
    </button>
  );
}
