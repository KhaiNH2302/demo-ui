import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TimeInput24Props {
  value: string; // Format "HH:mm" (e.g. "07:30")
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimeInput24: React.FC<TimeInput24Props> = ({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'HH:mm',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const hoursListRef = useRef<HTMLDivElement>(null);
  const minutesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const currentHour = value && value.includes(':') ? value.split(':')[0] : '07';
  const currentMinute = value && value.includes(':') ? value.split(':')[1] : '00';

  // Scroll active hour/minute into view when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const hourEl = hoursListRef.current?.querySelector('[data-selected="true"]');
        hourEl?.scrollIntoView({ block: 'nearest' });

        const minEl = minutesListRef.current?.querySelector('[data-selected="true"]');
        minEl?.scrollIntoView({ block: 'nearest' });
      }, 50);
    }
  }, [open]);

  // Handle direct text typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9:]/g, '');

    // Auto-insert ':' after 2 digits if user didn't type it
    if (raw.length === 2 && !raw.includes(':') && raw.length > inputValue.length) {
      const h = parseInt(raw, 10);
      if (h >= 0 && h <= 23) {
        raw = `${raw}:`;
      }
    }

    if (raw.length > 5) {
      raw = raw.slice(0, 5);
    }

    setInputValue(raw);

    // If matches complete HH:mm, validate & dispatch
    if (raw.length === 5) {
      const parts = raw.split(':');
      if (parts.length === 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          onChange(raw);
        }
      }
    }
  };

  const handleInputBlur = () => {
    // Validate on blur, revert to valid value if broken
    if (inputValue.length === 5) {
      const parts = inputValue.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChange(inputValue);
        return;
      }
    }
    setInputValue(value);
  };

  const handleSelectHour = (h: string) => {
    const newTime = `${h}:${currentMinute}`;
    onChange(newTime);
  };

  const handleSelectMinute = (m: string) => {
    const newTime = `${currentHour}:${m}`;
    onChange(newTime);
  };

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <input
        type="text"
        disabled={disabled}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        maxLength={5}
        className={cn(
          'w-28 h-9 px-2.5 pr-8 text-xs font-mono font-medium rounded-md border border-neutral-300 bg-surface text-neutral-900',
          'focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors',
          'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
          'dark:border-neutral-700 dark:text-neutral-100 dark:disabled:bg-neutral-800'
        )}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Chọn giờ"
            className="absolute right-1.5 p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-40"
          >
            <Clock className="w-4 h-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-56 p-2 z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-300 px-2">
            <span>Giờ (00–23)</span>
            <span>Phút (00–59)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 h-44">
            {/* Hours column */}
            <div
              ref={hoursListRef}
              className="overflow-y-auto space-y-0.5 pr-1 scrollbar-thin"
            >
              {HOURS.map((h) => {
                const isSelected = h === currentHour;
                return (
                  <button
                    key={h}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelectHour(h)}
                    className={cn(
                      'w-full py-1 px-2 text-xs rounded text-center font-mono font-medium transition-colors',
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minutes column */}
            <div
              ref={minutesListRef}
              className="overflow-y-auto space-y-0.5 pr-1 scrollbar-thin border-l border-neutral-100 dark:border-neutral-800 pl-1"
            >
              {MINUTES.map((m) => {
                const isSelected = m === currentMinute;
                return (
                  <button
                    key={m}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelectMinute(m)}
                    className={cn(
                      'w-full py-1 px-2 text-xs rounded text-center font-mono font-medium transition-colors',
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs px-1">
            <span className="font-mono text-neutral-500">
              Đang chọn: <strong className="text-brand-600 font-semibold">{currentHour}:{currentMinute}</strong>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Xong
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
