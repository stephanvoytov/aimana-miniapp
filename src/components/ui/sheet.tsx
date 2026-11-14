import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/**
 * Bottom-sheet в духе Telegram.
 * Анимации открытия/закрытия — через data-state от Radix (см. index.css,
 * .sheet-panel/.sheet-overlay): Presence сам держит узел в DOM до
 * animationend и только потом unmount'ит. Никакой собственной машины
 * монтирования — иначе узел пересоздаётся и CSS-анимация дёргается заново.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="sheet-panel sheet-surface fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-[28px] outline-none"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line" />
          <Dialog.Title className="px-4 pt-3 text-[17px] font-semibold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {title}
          </Dialog.Description>
          <div className="px-4 pt-2">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
