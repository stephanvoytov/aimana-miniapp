import { useEffect, useRef } from "react";

/**
 * Горизонтальная лента (чипсы, постеры): тач-свайп — нативный, мышь —
 * перетаскивание, колесо — в том числе вертикальное. Один хук на все
 * ленты, чтобы поведение не расходилось между экранами.
 *
 * Важно: pointer capture включается только после порога движения. Иначе
 * клик после обычного тапа уходил бы в контейнер, а не в чипс/кнопку.
 */
export function useScrollX<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // колесо: вертикальное -> горизонтальное, только когда есть куда листать
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };

    let down = false;
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let snap = "";

    const onDown = (e: PointerEvent) => {
      // тач оставляем браузеру: нативный скролл и инерция лучше ручных
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (el.scrollWidth <= el.clientWidth) return;
      down = true;
      dragging = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };

    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) <= 4) return;
        dragging = true;
        // snap мешает тянуть: включаем обратно на отпускании
        snap = el.style.scrollSnapType;
        el.style.scrollSnapType = "none";
        el.style.cursor = "grabbing";
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // синтетическое событие без активного указателя — тянуть всё равно можно
        }
      }
      el.scrollLeft = startLeft - dx;
    };

    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      if (!dragging) return; // обычный тап — клик должен дойти до кнопки
      dragging = false;
      el.style.scrollSnapType = snap;
      el.style.cursor = "";
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      // перетаскивание не должно заканчиваться кликом по карточке/чипсу
      const stop = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      el.addEventListener("click", stop, true);
      window.setTimeout(() => el.removeEventListener("click", stop, true), 0);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return ref;
}
