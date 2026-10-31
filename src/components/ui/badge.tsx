import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "error"
  | "warning"
  | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "border-border text-foreground",
    success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    error: "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
    warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
    info: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
