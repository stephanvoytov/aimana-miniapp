import { Package } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/products";
import {
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  formatOrderDate,
  orderStatus,
} from "@/lib/orders";
import { ORDERS_PATH, useAppBack } from "@/lib/routes";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/state/store";

const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

export function OrderDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useStore();
  const back = useAppBack(ORDERS_PATH);

  const order = orders.find((o) => o.id === id) ?? null;

  if (!order) {
    return (
      <div className="pb-5">
        <ScreenHeader title="Детали заказа" onBack={back} />
        <div className="flex flex-col items-center gap-2 px-8 pt-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-field">
            <Package size={26} strokeWidth={1.6} className="text-hint" />
          </div>
          <div className="mt-2 text-[17px] font-semibold">Заказ не найден</div>
          <div className="text-[15px] leading-relaxed text-hint">
            Он мог быть оформлен на другом устройстве или удалён из истории.
          </div>
          <Button
            variant="field"
            className="mt-4"
            onClick={() => navigate(ORDERS_PATH, { replace: true })}
          >
            К заказам
          </Button>
        </div>
      </div>
    );
  }

  const status = orderStatus(order);
  const items = order.items ?? [];
  const goods = items.length
    ? items.reduce((sum, item) => sum + item.price * item.qty, 0)
    : order.total;
  const discount = Math.max(0, goods - order.total);

  return (
    <div className="pb-5">
      <ScreenHeader title="Детали заказа" onBack={back} />

      {/* статус и сумма */}
      <div className="mx-4 mt-3 rounded-[22px] bg-field p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] text-hint">Заказ {order.id}</div>
            <div className="mt-1 text-[24px] font-semibold leading-tight">
              {formatPrice(order.total)}
            </div>
            <div className="mt-1 text-[13px] text-hint">
              {formatOrderDate(order.date)} · {order.count} шт.
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium",
              ORDER_STATUS_CLASS[status],
            )}
          >
            {ORDER_STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {/* состав */}
      {items.length > 0 && (
        <div className="mt-5 px-4">
          <div className="mb-2 text-[13px] font-medium text-hint">
            Состав заказа
          </div>
          <div className="overflow-hidden rounded-[20px] border border-line">
            {items.map((item, index) => {
              const product = item.productId
                ? productById.get(item.productId)
                : undefined;
              return (
                <div
                  key={`${item.name}-${item.size ?? ""}-${item.color ?? ""}-${index}`}
                  className={cn("flex gap-3 p-3", index > 0 && "border-t border-line")}
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-card">
                    {product ? (
                      <img
                        src={product.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-hint">
                        <Package size={22} strokeWidth={1.6} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium leading-snug">
                      {item.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[13px] text-hint">
                      {item.size && item.size !== "one-size" && (
                        <span>размер {item.size}</span>
                      )}
                      {item.color && (
                        <span
                          className="size-3 rounded-full border border-line"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </div>
                    <div className="mt-1 text-[13px] text-hint">
                      {item.qty} × {formatPrice(item.price)}
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5 text-[15px] font-semibold">
                    {formatPrice(item.price * item.qty)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* итоги */}
      <div className="mx-4 mt-4 rounded-2xl bg-field px-4">
        <SummaryRow
          label={
            items.length > 0 ? `Товары (${order.count} шт.)` : "Сумма заказа"
          }
          value={formatPrice(goods)}
        />
        {discount > 0 && (
          <SummaryRow
            label="Скидка"
            value={`−${formatPrice(discount)}`}
            valueClass="text-[#34c759]"
          />
        )}
        <SummaryRow label="Доставка" value="При подтверждении" />
        <div className="flex items-baseline justify-between border-t border-line py-3">
          <span className="text-[15px] font-medium">Итого</span>
          <span className="text-[17px] font-semibold">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* получатель */}
      {order.customer && (
        <div className="mx-4 mt-4 rounded-2xl bg-field p-4">
          <div className="text-[13px] text-hint">Получатель</div>
          <div className="mt-1 text-[15px] font-medium">
            {order.customer.name}
          </div>
          <div className="text-[14px] text-hint">{order.customer.phone}</div>
          {order.customer.comment && (
            <div className="mt-2 border-t border-line pt-2 text-[13px] leading-relaxed">
              {order.customer.comment}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div className="mx-4 mt-4 rounded-2xl bg-field p-4 text-[13px] leading-relaxed text-hint">
          Состав этого заказа не сохранился — остались только сумма и дата.
        </div>
      )}

      <div className="mt-4 px-4 text-center text-[12px] leading-relaxed text-hint">
        Вопросы по заказу — в поддержке приложения
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[15px]">
      <span className="text-hint">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
