import React from 'react';
import { Button } from '@/components/ui/Button';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  onClear,
  showClear = true,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 mb-4', className)}>
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {children}
      </div>
      {onClear && showClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-neutral-500 hover:text-neutral-900"
          leftIcon={<RotateCcw size={14} />}
        >
          Xóa lọc
        </Button>
      )}
    </div>
  );
};
