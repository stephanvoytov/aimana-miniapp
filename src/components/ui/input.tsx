import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type ?? "text"}
    className={cn(
      "h-12 w-full rounded-2xl border border-transparent bg-field px-4 text-[16px] text-ink outline-none placeholder:text-hint focus:border-accent/60",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
