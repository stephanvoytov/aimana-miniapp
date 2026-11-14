import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { useScrollX } from "@/lib/useScrollX";
import { cn } from "@/lib/utils";

/**
 * Полноэкранный просмотр фото. Открывается тапом по кадру галереи,
 * стартует с того же индекса. Свайп / перетаскивание / колесо листают
 * кадры, Escape и крестик закрывают (Radix Dialog).
 */
export function Lightbox({
  open,
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-[80] bg-black" />
        <Dialog.Content className="lightbox-panel fixed inset-0 z-[80] bg-black text-white outline-none">
          <Dialog.Title className="sr-only">Фото: {alt}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Полноэкранный просмотр фотографий. Свайп — следующее фото,
            Escape — закрыть.
          </Dialog.Description>
          <LightboxCarousel
            images={images}
            alt={alt}
            start={index}
            onIndexChange={onIndexChange}
            onClose={onClose}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LightboxCarousel({
  images,
  alt,
  start,
  onIndexChange,
  onClose,
}: {
  images: string[];
  alt: string;
  start: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useScrollX<HTMLDivElement>();
  const [active, setActive] = useState(start);

  // при открытии сразу показываем кадр, по которому тапнули
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = start * el.clientWidth;
    // только на монтировании: ручной свайп не должен отскакивать
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const step = el.clientWidth;
    if (!step) return;
    const next = Math.min(images.length - 1, Math.round(el.scrollLeft / step));
    setActive(next);
    onIndexChange(next);
  };

  const scrollTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto select-none touch-pan-x"
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="flex h-full w-full shrink-0 snap-center items-center justify-center px-3 py-16"
          >
            <img
              src={src}
              alt={i === 0 ? alt : ""}
              draggable={false}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <div className="rounded-full bg-white/12 px-3 py-1 text-[13px] tabular-nums text-white/80">
          {active + 1} / {images.length}
        </div>
        <button
          type="button"
          className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/12 text-white transition-colors active:bg-white/25"
          aria-label="Закрыть просмотр"
          onClick={onClose}
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      {images.length > 1 && (
        <div
          className="absolute inset-x-0 z-10 flex justify-center gap-2"
          style={{ bottom: "max(18px, env(safe-area-inset-bottom))" }}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={cn(
                "size-2 rounded-full transition-colors duration-200",
                i === active ? "bg-white" : "bg-white/30",
              )}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === active}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
