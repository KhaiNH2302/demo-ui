import { useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { currentLifeDate } from "@/lib/studentLifeDetails";
import { cn } from "@/lib/cn";

export function RideDateFilter({ value, onChange, allowAny = true }: {
  value: string;
  onChange: (date: string) => void;
  allowAny?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState(value);
  const now = new Date();
  const today = currentLifeDate(0, now);
  const tomorrow = currentLifeDate(1, now);
  const label = !value ? allowAny ? "Ngày đi" : "Chọn ngày" : value === today ? "Hôm nay"
    : value === tomorrow ? "Ngày mai" : value.split("-").reverse().join("/");
  const choose = (date: string) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => {
      setOpen(next);
      if (next) { setCustom(false); setDraft(value || today); }
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Ngày đi: ${!value ? allowAny ? "mọi ngày" : "chưa chọn" : value === today || value === tomorrow ? `${label}, ${value.split("-").reverse().join("/")}` : label}`}
          className={cn(
            "inline-flex min-h-[38px] max-w-full items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
            value ? "border-brand-200 text-brand-700" : "border-neutral-200 text-neutral-700 hover:border-neutral-300",
          )}
        >
          <CalendarDays size={15} aria-hidden="true" className="shrink-0" />
          <span>{label}</span>
          <ChevronDown size={14} aria-hidden="true" className="ml-1 shrink-0 text-neutral-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 max-w-[calc(100vw-2rem)] space-y-1 p-2">
        <div role="group" aria-label="Chọn nhanh ngày đi" className="space-y-1">
          {[
            { date: "", label: "Mọi ngày" },
            { date: today, label: "Hôm nay" },
            { date: tomorrow, label: "Ngày mai" },
          ].filter((item) => allowAny || item.date).map((item) => (
            <button
              key={item.label} type="button" aria-pressed={value === item.date}
              onClick={() => choose(item.date)}
              className={cn("flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50", value === item.date ? "bg-brand-50 text-brand-700" : "text-neutral-700")}
            >
              {item.label}
              {value === item.date && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
          <button type="button" onClick={() => setCustom((current) => !current)} aria-expanded={custom} aria-controls="ride-custom-date" className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50">
            <CalendarDays size={14} aria-hidden="true" />Chọn ngày khác
          </button>
        </div>
        {custom && (
          <div id="ride-custom-date" className="space-y-3 border-t border-neutral-100 px-2 pb-1 pt-3">
            <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
              <span>Ngày khởi hành</span>
              <input autoFocus type="date" value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full min-w-0 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm text-neutral-800 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15" />
            </label>
            <Button type="button" size="sm" disabled={!draft} className="w-full" onClick={() => choose(draft)}>Áp dụng</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
