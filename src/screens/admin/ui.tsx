import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  ORDER_STATUS_META,
  formatDelta,
  type OrderStatus,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full rounded-xl border border-adm-line bg-adm-card px-3 text-[14px] text-adm-ink outline-none transition placeholder:text-adm-muted/70 focus:border-adm-blue focus:ring-4 focus:ring-adm-blue/10 disabled:bg-adm-soft disabled:text-adm-muted";

export const textareaClass =
  "min-h-[96px] w-full resize-none rounded-xl border border-adm-line bg-adm-card px-3 py-2.5 text-[14px] leading-relaxed text-adm-ink outline-none transition placeholder:text-adm-muted/70 focus:border-adm-blue focus:ring-4 focus:ring-adm-blue/10";

export const btnPrimary =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-adm-blue px-4 text-[13px] font-medium text-white transition hover:bg-[#1d4ed8] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btnSecondary =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-adm-line bg-adm-card px-4 text-[13px] font-medium text-adm-ink transition hover:bg-adm-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-adm-line bg-adm-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-adm-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] text-adm-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Pill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.new;
  return <Pill label={meta.label} className={meta.pill} />;
}

export function DeltaPill({
  value,
  current,
}: {
  value: number | null;
  current: number;
}) {
  if (value === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-adm-blue-soft px-2 py-1 text-[11px] font-medium text-adm-blue">
        {current > 0 ? "новое" : "—"}
      </span>
    );
  }

  const tone =
    value > 0
      ? "bg-adm-green-soft text-adm-green"
      : value < 0
        ? "bg-adm-red-soft text-adm-red"
        : "bg-adm-soft text-adm-muted";
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-medium tabular-nums",
        tone,
      )}
      title="К предыдущему периоду"
    >
      {Icon && <Icon size={12} strokeWidth={2.4} />}
      {formatDelta(value)}
    </span>
  );
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12px] font-medium text-adm-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-adm-muted">{hint}</span>}
    </label>
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, "cursor-pointer appearance-none pr-9")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-adm-muted"
      />
    </div>
  );
}

export function Drawer({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-overlay fixed inset-0 z-50 bg-[#101828]/35 backdrop-blur-[1px]" />
        <Dialog.Content className="admin-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] flex-col bg-adm-card shadow-[-16px_0_48px_rgba(16,24,40,0.14)] outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-adm-line px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-[18px] font-semibold text-adm-ink">
                {title}
              </Dialog.Title>
              {subtitle && (
                <p className="mt-0.5 truncate text-[12px] text-adm-muted">
                  {subtitle}
                </p>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-adm-muted transition hover:bg-adm-soft hover:text-adm-ink"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {subtitle || title}
          </Dialog.Description>
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>
          {footer && (
            <div className="border-t border-adm-line px-5 py-4 sm:px-6">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Удалить",
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="admin-overlay fixed inset-0 z-[60] bg-[#101828]/40" />
        <Dialog.Content className="admin-modal fixed left-1/2 top-1/2 z-[60] w-[calc(100%-32px)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-adm-line bg-adm-card p-5 shadow-[0_24px_64px_rgba(16,24,40,0.2)] outline-none">
          <Dialog.Title className="text-[17px] font-semibold text-adm-ink">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-1.5 text-[13px] leading-relaxed text-adm-muted">
            {description}
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={onClose}
              disabled={busy}
            >
              Отмена
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-adm-red px-4 text-[13px] font-medium text-white transition hover:bg-[#a91f1f] disabled:pointer-events-none disabled:opacity-50"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AdminToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6 sm:justify-end">
      <div className="anim-toast flex items-center gap-2 rounded-xl bg-[#15171c] px-4 py-3 text-[13px] font-medium text-white shadow-[0_12px_32px_rgba(16,24,40,0.24)]">
        <CheckCircle2 size={16} className="text-[#6ee7a8]" />
        {message}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-adm-soft text-adm-muted">
        {icon}
      </div>
      <div className="mt-3 text-[14px] font-medium text-adm-ink">{title}</div>
      {description && (
        <div className="mt-1 max-w-xs text-[12px] text-adm-muted">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
