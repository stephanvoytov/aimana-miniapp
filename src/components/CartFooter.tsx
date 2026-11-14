import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/state/store";

/**
 * Панель оформления заказа — содержимое плавающей пилюли (см. App).
 * Итог слева, плотная CTA справа — как в iOS.
 */
export function CartFooter() {
  const { cartCount, cartTotal, setCheckoutOpen } = useStore();

  return (
    <div className="flex items-center gap-3 px-2.5 py-2">
      <div className="shrink-0 pl-1.5">
        <div className="text-[12px] text-hint">Итого · {cartCount} шт.</div>
        <div className="text-[17px] font-semibold leading-tight">
          {formatPrice(cartTotal)}
        </div>
      </div>
      <Button
        size="lg"
        className="flex-1"
        onClick={() => setCheckoutOpen(true)}
      >
        Оформить заказ
      </Button>
    </div>
  );
}
