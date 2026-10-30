import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function FeedFilterSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        {...props}
        className="w-full cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-surface py-2 pl-3 pr-9 text-sm text-neutral-700 outline-hidden transition-colors hover:border-neutral-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={14}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  );
}
