import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/cn';

export interface DateBadgeProps {
  date: string | Date;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Ô ngày kiểu Facebook Events (02-shared-components.md § 41)
 * Dòng 1: tháng viết hoa (THG 10)
 * Dòng 2: ngày số đậm (05)
 */
export const DateBadge: React.FC<DateBadgeProps> = ({
  date,
  size = 'md',
  className,
}) => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  const valid = isValid(parsed);
  const monthNum = valid ? format(parsed, 'M', { locale: vi }) : '10';
  const dayNum = valid ? format(parsed, 'dd', { locale: vi }) : '05';

  return (
    <div
      className={cn(
        'shrink-0 rounded-md border border-neutral-200 bg-surface flex flex-col items-center justify-center select-none text-center',
        size === 'sm' ? 'h-10 w-10' : 'h-11 w-11',
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-tier-danger-fg leading-none">
        THG {monthNum}
      </span>
      <span
        className={cn(
          'font-bold text-neutral-900 tabular-nums leading-tight mt-0.5',
          size === 'sm' ? 'text-sm' : 'text-base',
        )}
      >
        {dayNum}
      </span>
    </div>
  );
};
