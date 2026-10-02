import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FilterSelectOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ElementType;
}

export interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  icon?: React.ElementType;
  className?: string;
  allLabel?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  icon: TriggerIcon,
  className,
  allLabel = 'Tất cả',
}) => {
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : allLabel;
  const isFiltered = value !== '' && value !== 'all';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none',
            isFiltered
              ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold'
              : 'bg-surface border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100',
            className
          )}
        >
          {TriggerIcon && <TriggerIcon size={14} className={isFiltered ? 'text-brand-600' : 'text-neutral-500'} />}
          <span className="text-neutral-500 dark:text-neutral-400 font-normal">{label}:</span>
          <span>{displayLabel}</span>
          <ChevronDown size={13} className="text-neutral-400 ml-0.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[12rem] p-1">
        <DropdownMenuLabel className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {options.map((option) => {
          const isSelected = option.value === value;
          const OptionIcon = option.icon;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer transition-colors',
                isSelected && 'bg-brand-50/60 text-brand-700 font-semibold'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {OptionIcon && (
                  <OptionIcon size={14} className={isSelected ? 'text-brand-600' : 'text-neutral-400'} />
                )}
                <span className="truncate">{option.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {option.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                      isSelected
                        ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    )}
                  >
                    {option.count}
                  </span>
                )}
                {isSelected && <Check size={14} className="text-brand-600" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
