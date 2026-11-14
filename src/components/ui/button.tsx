import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[16px] font-medium outline-none transition-[transform,opacity,background-color,color] duration-150 ease-out active:scale-[0.97] active:opacity-80 disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent/50",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-ink",
        field: "bg-field text-ink",
        outline: "border border-line bg-transparent text-ink",
        ghost: "bg-transparent text-ink",
        link: "bg-transparent text-accent",
      },
      size: {
        default: "h-11 px-4 text-[15px]",
        lg: "h-12 rounded-2xl px-5 text-[16px]",
        chip: "h-10 rounded-full px-5 text-[15px]",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
