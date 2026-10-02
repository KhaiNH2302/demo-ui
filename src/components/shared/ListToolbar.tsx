import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/shared/FilterSelect';

export interface ToolbarChipItem {
  key: string;
  label: string;
  count?: number;
}

export interface ToolbarSortOption {
  value: string;
  label: string;
}

export interface ListToolbarProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  chips?: {
    items: ToolbarChipItem[];
    active: string;
    onChange: (key: string) => void;
    label?: string;
  };
  sort?: {
    options: ToolbarSortOption[];
    value: string;
    onChange: (val: string) => void;
  };
  moreFiltersCount?: number;
  onOpenMoreFilters?: () => void;
  rightSlot?: React.ReactNode;
}

export const ListToolbar: React.FC<ListToolbarProps> = ({
  search,
  chips,
  sort,
  moreFiltersCount = 0,
  onOpenMoreFilters,
  rightSlot,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {search && (
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || 'Tìm kiếm...'}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-neutral-200 bg-surface text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {sort && (
            <select
              value={sort.value}
              onChange={(e) => sort.onChange(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 bg-surface px-3 text-xs font-medium text-neutral-700 focus:outline-none focus:border-brand-500"
            >
              {sort.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {onOpenMoreFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenMoreFilters}
              leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
            >
              Lọc thêm{moreFiltersCount > 0 ? ` (${moreFiltersCount})` : ''}
            </Button>
          )}
          {rightSlot}
        </div>
      </div>

      {chips && chips.items.length > 0 && (
        <div className="flex items-center gap-2">
          <FilterSelect
            label={chips.label || 'Phân loại'}
            value={chips.active}
            onChange={chips.onChange}
            options={chips.items.map((item) => ({
              value: item.key,
              label: item.label,
              count: item.count,
            }))}
          />
        </div>
      )}
    </div>
  );
};
