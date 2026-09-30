import React from 'react';
import { Chip } from '@/components/ui/Chip';

export interface ActiveFilterItem {
  key: string;
  label: string;
  valueLabel: string;
}

export interface ActiveFilterChipsProps {
  filters: ActiveFilterItem[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onRemove,
  onClearAll,
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-neutral-500">Đang lọc:</span>
      {filters.map((f) => (
        <Chip key={f.key} size="sm" onRemove={() => onRemove(f.key)}>
          <span className="text-neutral-500">{f.label}:</span>{' '}
          <strong className="font-medium text-neutral-800">{f.valueLabel}</strong>
        </Chip>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-brand-600 hover:underline ml-1"
      >
        Xóa tất cả
      </button>
    </div>
  );
};
