import React from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedControlOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  badge?: number | string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: (SegmentedControlOption | string)[];
  value: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  onValueChange,
  size = 'md',
  className,
  fullWidth = false,
}) => {
  const handleChange = onValueChange || onChange;

  const normalizedOptions: SegmentedControlOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const sizeStyles = {
    sm: 'p-0.5 text-xs gap-1',
    md: 'p-1 text-xs gap-1.5',
    lg: 'p-1.5 text-sm gap-2',
  };

  const itemSizeStyles = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-4 py-2',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl bg-neutral-100/90 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 shadow-inner select-none overflow-x-auto max-w-full',
        sizeStyles[size],
        fullWidth && 'w-full flex',
        className
      )}
      role="tablist"
    >
      {normalizedOptions.map((opt) => {
        const isSelected = opt.value === value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && handleChange?.(opt.value)}
            className={cn(
              'inline-flex items-center justify-center font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer',
              itemSizeStyles[size],
              fullWidth && 'flex-1',
              isSelected
                ? 'bg-surface text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-surface/50',
              opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            {Icon && <Icon size={size === 'sm' ? 14 : 16} className={cn('mr-1.5', isSelected ? 'text-brand-600' : 'text-neutral-400')} />}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  'ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  isSelected ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
