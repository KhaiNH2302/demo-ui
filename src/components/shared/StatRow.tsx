import React from 'react';
import { cn } from '@/lib/cn';

export interface StatItem {
  label: string;
  value: number | string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
  active?: boolean;
}

export interface StatRowProps {
  items: StatItem[];
  className?: string;
}

export const StatRow: React.FC<StatRowProps> = ({ items, className }) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm',
        className,
      )}
    >
      {items.map((item, idx) => {
        const toneColor =
          item.tone === 'danger'
            ? 'text-tier-danger-fg'
            : item.tone === 'warning'
              ? 'text-tier-warning-fg'
              : item.tone === 'success'
                ? 'text-tier-good-fg'
                : 'text-neutral-900';

        const inner = (
          <span className="inline-flex items-baseline gap-1.5">
            <span className="text-neutral-600">{item.label}:</span>
            <strong className={cn('font-semibold tabular-nums', toneColor)}>
              {item.value}
            </strong>
          </span>
        );

        return (
          <React.Fragment key={item.label}>
            {idx > 0 && <span className="text-neutral-200 select-none">·</span>}
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  'hover:underline focus:outline-none',
                  item.active && 'underline font-semibold text-brand-700',
                )}
              >
                {inner}
              </button>
            ) : (
              inner
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
