import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  selected?: boolean;
  count?: number;
  onClick?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active,
  selected,
  count,
  onClick,
  onRemove,
  icon,
  size = 'md',
  className,
}) => {
  const isSelected = Boolean(active ?? selected);
  const isInteractive = Boolean(onClick || onRemove);

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors select-none',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        isSelected
          ? 'bg-brand-50 text-brand-700 border-brand-200 font-semibold'
          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50',
        isInteractive && 'cursor-pointer',
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span className="text-[11px] opacity-75 tabular-nums">({count})</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Xóa bộ lọc"
          className="ml-0.5 rounded-full p-0.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};
