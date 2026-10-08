import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (nextPage: number) => void;
  variant?: 'numbered' | 'load-more';
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onChange,
  variant = 'numbered',
  loading = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (variant === 'load-more') {
    const shown = Math.min(total, page * pageSize);
    const remaining = Math.max(0, total - shown);
    if (remaining === 0) return null;

    return (
      <div className="pt-4 flex flex-col items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page + 1)}
          loading={loading}
        >
          Tải thêm ({remaining} còn lại)
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
      <span className="whitespace-nowrap">
        Trang <strong className="font-medium text-neutral-900">{page}</strong> / {totalPages} · Tổng{' '}
        <strong className="font-medium text-neutral-900">{total}</strong> mục
      </span>
      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => onChange(page - 1)}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Trước
        </Button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === page ? 'primary' : 'secondary'}
            size="sm"
            disabled={loading}
            onClick={() => onChange(pageNumber)}
            className="min-w-9"
          >
            {pageNumber}
          </Button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages || loading}
          onClick={() => onChange(page + 1)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Sau
        </Button>
      </div>
    </div>
  );
};
