import { Children, isValidElement, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

function optionLabels(children: ReactNode): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; label?: string; children?: ReactNode }>(child)) return;
    if (child.type === "option") {
      const label = child.props.label || Children.toArray(child.props.children).join("");
      options.push({ value: String(child.props.value ?? label), label });
    } else options.push(...optionLabels(child.props.children));
  });
  return options;
}

export function FeedFilterSelect({
  className,
  children,
  fitContent = false,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { fitContent?: boolean }) {
  const options = fitContent ? optionLabels(children) : [];
  const selectedLabel = options.find((option) => option.value === String(props.value ?? props.defaultValue ?? ""))?.label || options[0]?.label || "";
  return (
    <div className={cn("relative min-w-0", fitContent && "inline-grid w-fit max-w-full shrink-0 align-middle", className)}>
      {fitContent && <span aria-hidden="true" className="pointer-events-none invisible min-w-0 overflow-hidden whitespace-pre rounded-lg border border-transparent py-2 pl-3 pr-9 text-sm">{selectedLabel}</span>}
      <select
        {...props}
        className={cn("w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-surface py-2 pl-3 pr-9 text-sm text-neutral-700 outline-hidden transition-colors hover:border-neutral-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-default disabled:bg-neutral-50", fitContent && "absolute inset-0 h-full text-ellipsis")}
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
