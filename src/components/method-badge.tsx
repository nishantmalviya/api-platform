import type { HttpMethod } from "@/contracts/api";
import { cn } from "@/lib/utils";

export const METHOD_TEXT_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-purple-600 dark:text-purple-400",
  DELETE: "text-red-600 dark:text-red-400",
  HEAD: "text-cyan-600 dark:text-cyan-400",
  OPTIONS: "text-slate-600 dark:text-slate-400",
};

export interface MethodBadgeProps {
  method: HttpMethod;
  className?: string;
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-20 shrink-0 items-center justify-start rounded text-xs font-bold tracking-wide whitespace-nowrap",
        METHOD_TEXT_COLORS[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
