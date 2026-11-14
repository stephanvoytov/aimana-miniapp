import { ChevronLeft } from "lucide-react";

/** Шапка вложенного экрана: возврат + заголовок. */
export function ScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 pt-2">
      <button
        className="flex size-10 shrink-0 items-center justify-center rounded-full outline-none transition-opacity active:opacity-60"
        aria-label="Назад"
        onClick={onBack}
      >
        <ChevronLeft size={22} strokeWidth={2.2} />
      </button>
      <h1 className="min-w-0 truncate text-[22px] font-semibold">{title}</h1>
    </div>
  );
}
