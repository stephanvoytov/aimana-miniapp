import { ChevronRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/products";
import {
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  formatOrderDate,
  orderStatus,
} from "@/lib/orders";
import { TAB_PATHS, orderPath, useAppBack } from "@/lib/routes";
import { cn, formatPrice } from "@/lib/utils";
import { useStore, type Order } from "@/state/store";

const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

export function OrdersScreen() {
  const { orders, go } = useStore();
  const navigate = useNavigate();
  const back = useAppBack(TAB_PATHS.profile);

  if (orders.length === 0) {
    return (
      <div className="pb-5">
        <ScreenHeader title="Мои заказы" onBack={back} />
        <div className="flex flex-col items-center gap-2 px-8 pt-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-field">
            <Package size={26} strokeWidth={1.6} className="text-hint" />
          </div>
          <div className="mt-2 text-[17px] font-semibold">Заказов пока нет</div>
          <div className="text-[15px] leading-relaxed text-hint">
            Оформите первый заказ — он появится здесь, вместе с составом и
            статусом.
          </div>
          <Button
            variant="field"
            className="mt-4"
            onClick={() => go("catalog")}
          >
            В каталог
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-5">
      <ScreenHeader title="Мои заказы" onBack={back} />
      <div className="px-4 pt-1 text-[13px] text-hint">
        Всего: {orders.length}
      </div>

      <div className="mt-3 space-y-2.5 px-4">
        {orders.map((order) => (
          <OrderCard
            key={`${order.id}-${order.date}`}
            order={order}
            onOpen={() => navigate(orderPath(order.id))}
          />
        ))}
      </div>

      <div className="mt-4 px-4 text-center text-[12px] leading-relaxed text-hint">
        История заказов хранится на этом устройстве
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: () => void;
}) {
  const status = orderStatus(order);
  const items = order.items ?? [];
  const photos = items
    .map((item) =>
      item.productId ? productById.get(item.productId)?.image : undefined,
    )
    .filter((src): src is string => Boolean(src))
    .slice(0, 3);

  return (
    <button
      className="w-full rounded-[20px] border border-line bg-page p-3.5 text-left transition-transform duration-150 active:scale-[0.99]"
      onClick={onOpen}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[15px] font-semibold">
          Заказ {order.id}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium",
            ORDER_STATUS_CLASS[status],
          )}
        >
          {ORDER_STATUS_LABEL[status]}
        </span>
      </div>

      <div className="mt-1 text-[13px] text-hint">
        {formatOrderDate(order.date)} · {order.count} шт.
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          {photos.length > 0 && (
            <div className="flex shrink-0 -space-x-2.5">
              {photos.map((src, i) => (
                <span
                  key={`${src}-${i}`}
                  className="size-11 overflow-hidden rounded-xl border-2 border-page bg-card"
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                </span>
              ))}
            </div>
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] text-hint">
            {items
              .slice(0, 2)
              .map((item) => item.name)
              .join(", ")}
            {items.length > 2 ? "…" : ""}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[14px] text-hint">Итого</span>
        <span className="flex items-center gap-0.5 text-[16px] font-semibold">
          {formatPrice(order.total)}
          <ChevronRight size={17} strokeWidth={2} className="text-hint" />
        </span>
      </div>
    </button>
  );
}
