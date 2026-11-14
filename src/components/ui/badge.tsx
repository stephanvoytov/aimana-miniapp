import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-full px-3 py-1 text-[12px] font-medium leading-none",
  {
    variants: {
      variant: {
        soft: "bg-field text-hint",
        outline: "border border-line text-hint",
        /* поверх фото: белая плашка с тёмным текстом, как в iOS; цвет
           текста фиксированный — на фото тёмная тема не должна «слепить» */
        photo: "bg-white/95 px-2 py-0.5 text-[11px] text-black",
      },
    },
    defaultVariants: { variant: "soft" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
