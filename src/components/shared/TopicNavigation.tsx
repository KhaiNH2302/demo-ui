import {
  LayoutGrid,
  House,
  UtensilsCrossed,
  CarFront,
  School,
  Lightbulb,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { LIFE_TOPICS } from "@/lib/studentLife";
import { cn } from "@/lib/cn";

const icons: Record<string, LucideIcon> = {
  "": LayoutGrid,
  housing: House,
  food: UtensilsCrossed,
  transport: CarFront,
  campus: School,
  experience: Lightbulb,
  conversation: MessagesSquare,
};

export function TopicNavigation({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Chủ đề đời sống"
      className="overflow-x-auto rounded-xl border border-neutral-200 bg-surface p-1"
    >
      <div className="grid grid-flow-col auto-cols-[96px] gap-1 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-7">
        {[{ value: "", label: "Tất cả" }, ...LIFE_TOPICS].map((item) => {
          const Icon = icons[item.value];
          const selected = value === item.value;
          return (
            <button
              type="button"
              key={item.value}
              aria-pressed={selected}
              onClick={() => onChange(item.value)}
              className={cn(
                "flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-500",
                selected
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-brand-700",
              )}
            >
              <Icon
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0"
              />
              <span className="flex min-h-7 items-center justify-center text-[11px] font-medium leading-3.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
