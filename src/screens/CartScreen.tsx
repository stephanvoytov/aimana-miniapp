import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { PRODUCTS, type Product } from "@/data/products";
import { cn, formatPrice } from "@/lib/utils";
import { haptic, sendToBot } from "@/lib/telegram";
import { api, DEMO_MODE } from "@/lib/api";
import { useStore } from "@/state/store";

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

export function CartScreen() {
  const {
    cart,
    cartCount,
    cartTotal,
    cartDiscount,
    setLineQty,
    clearCart,
    addOrder,
    go,
    showToast,
    checkoutOpen,
    setCheckoutOpen,
  } = useStore();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-8 pb-4 pt-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-field">
          <Plus size={26} className="rotate-45 text-hint" />
        </div>
        <div className="mt-2 text-[17px] font-semibold">Корзина пуста</div>
        <div className="text-[15px] text-hint">
          Добавьте товары из каталога — позиции останутся здесь даже после
          закрытия приложения
        </div>
        <Button variant="field" className="mt-4" onClick={() => go("catalog")}>
          В каталог
        </Button>
      </div>
    );
  }

  // цена за единицу: детали заказа считают строку как price × qty
  const orderItems = cart.map((l) => {
    const p = byId.get(l.productId);
    return {
      productId: l.productId,
      name: p?.name ?? l.productId,
      size: l.size,
      color: l.color,
      qty: l.qty,
      price: p?.price ?? 0,
    };
  });

  const submitOrder = (customer: {
    name: string;
    phone: string;
    comment: string;
  }) => {
    haptic("success");
    const sent = sendToBot({
      action: "checkout",
      customer,
      items: orderItems.map((item) => ({
        ...item,
        price: item.price * item.qty,
      })),
      total: cartTotal,
    });

    // локальная запись нужна в обоих режимах: детали заказа читают её
    const saveOrder = (id: string) =>
      addOrder({
        id,
        date: new Date().toISOString(),
        count: cartCount,
        total: cartTotal,
        status: "new",
        items: orderItems,
        customer,
      });

    if (!DEMO_MODE) {
      api
        .createOrder(customer, cartDiscount)
        .then((res: { id?: string } | null) => {
          saveOrder(
            res?.id || `№${String(Date.now()).slice(-4)}`,
          );
          setCheckoutOpen(false);
          clearCart();
          showToast(sent ? "Заказ отправлен в чат бота" : "Заказ оформлен");
        })
        .catch(() => {
          showToast("Не удалось оформить заказ");
        });
      return;
    }
    // локальный режим
    saveOrder(`№${String(Date.now()).slice(-4)}`);
    setCheckoutOpen(false);
    clearCart();
    showToast(sent ? "Заказ отправлен в чат бота" : "Заказ оформлен (демо)");
  };

  return (
    <div className="pb-5">
      <div className="flex items-baseline justify-between px-4 pt-4">
        <h2 className="text-[22px] font-semibold">Корзина</h2>
        <span className="text-[13px] text-hint">{cartCount} шт.</span>
      </div>

      <div className="mt-2 space-y-2 px-4">
        {cart.map((line) => {
          const product = byId.get(line.productId);
          if (!product) return null;
          return (
            <CartItem
              key={line.lineId}
              line={line}
              product={product}
              onDec={() => setLineQty(line.lineId, line.qty - 1)}
              onInc={() => setLineQty(line.lineId, line.qty + 1)}
              onRemove={() => setLineQty(line.lineId, 0)}
            />
          );
        })}
      </div>

      {/* скидка: единственное место, где нужна расшифровка. Итог не
          дублируем — он живёт в нижней панели оформления */}
      {cartDiscount > 0 && (
        <div className="mx-4 mt-4 rounded-2xl bg-field px-4">
          <SummaryRow
            label={`Товары (${cartCount} шт.)`}
            value={formatPrice(cartTotal + cartDiscount)}
          />
          <SummaryRow
            label="Скидка"
            value={`−${formatPrice(cartDiscount)}`}
            valueClass="text-[#34c759]"
          />
        </div>
      )}

      <CheckoutSheet
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        count={cartCount}
        total={cartTotal}
        onSubmit={submitOrder}
      />
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
      <span className={cn(valueClass)}>{value}</span>
    </div>
  );
}

function CartItem({
  line,
  product,
  onDec,
  onInc,
  onRemove,
}: {
  line: { size: string; color: string; qty: number };
  product: Product;
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
}) {
  const atMax = line.qty >= product.stock;

  return (
    <div className="flex gap-3 rounded-2xl bg-field p-3">
      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-card">
        <img
          src={product.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="truncate text-[15px] font-medium leading-snug">
            {product.name}
          </div>
          <button
            className="shrink-0 text-hint active:text-ink"
            aria-label="Удалить из корзины"
            onClick={onRemove}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-0.5 flex items-center gap-2 text-[13px] text-hint">
          {line.size !== "one-size" && <span>размер {line.size}</span>}
          <span
            className="size-3 rounded-full border border-line"
            style={{ backgroundColor: line.color }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              className="flex size-8 items-center justify-center rounded-lg bg-page text-ink active:opacity-60"
              aria-label="Меньше"
              onClick={onDec}
            >
              <Minus size={15} />
            </button>
            <span
              key={line.qty}
              className="anim-num w-7 text-center text-[15px] font-medium tabular-nums"
            >
              {line.qty}
            </span>
            <button
              className={cn(
                "flex size-8 items-center justify-center rounded-lg bg-page active:opacity-60",
                atMax ? "text-hint/50" : "text-ink",
              )}
              aria-label="Больше"
              disabled={atMax}
              onClick={onInc}
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="text-[15px] font-semibold">
            {formatPrice(product.price * line.qty)}
          </div>
        </div>

        {atMax && (
          <div className="mt-1 text-right text-[12px] text-hint">
            Весь остаток — {product.stock} шт.
          </div>
        )}
      </div>
    </div>
  );
}

type Customer = { name: string; phone: string; comment: string };

function CheckoutSheet({
  open,
  onOpenChange,
  count,
  total,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  total: number;
  onSubmit: (c: Customer) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.replace(/\D/g, "").length >= 10;

  const submit = () => {
    setTouched(true);
    if (!nameOk || !phoneOk) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      comment: comment.trim(),
    });
    setName("");
    setPhone("");
    setComment("");
    setTouched(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Оформление заказа">
      <div className="space-y-3 pb-2 pt-1">
        <div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            autoComplete="name"
          />
          {touched && !nameOk && (
            <div className="px-1 pt-1 text-[13px] text-[#e53935]">
              Укажите имя
            </div>
          )}
        </div>
        <div>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Телефон"
            inputMode="tel"
            autoComplete="tel"
          />
          {touched && !phoneOk && (
            <div className="px-1 pt-1 text-[13px] text-[#e53935]">
              Укажите телефон
            </div>
          )}
        </div>
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий к заказу"
        />

        <div className="flex items-baseline justify-between pt-1 text-[15px]">
          <span className="text-hint">{count} шт.</span>
          <span className="font-semibold">{formatPrice(total)}</span>
        </div>

        <Button size="lg" className="w-full" onClick={submit}>
          Отправить заказ
        </Button>
        <div className="pt-1 text-center text-[13px] leading-relaxed text-hint">
          Оплата и доставка — по ссылке или в чате поддержки после подтверждения
        </div>
      </div>
    </Sheet>
  );
}
