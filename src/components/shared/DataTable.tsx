import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ColumnDef<T, V = any> {
  id?: string;
  header: React.ReactNode | ((info: { column: any }) => React.ReactNode);
  accessorKey?: keyof T | string;
  cell?: (info: { row: { original: T }; getValue: () => V }) => React.ReactNode;
  enableSorting?: boolean;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pageSize?: number;
  pagination?: {
    page?: number;
    pageSize?: number;
    total?: number;
    onPageChange?: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyState,
  pageSize = 10,
  onRowClick,
  toolbar,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key?: string) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      const compare = String(valA).localeCompare(String(valB), 'vi', { numeric: true });
      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  if (isLoading) {
    return <LoadingSkeleton variant="table" />;
  }

  return (
    <div className={cn('space-y-4 w-full', className)}>
      {toolbar && <div>{toolbar}</div>}

      <div className="rounded-lg border border-neutral-200 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              {columns.map((col, idx) => {
                const key = String(col.accessorKey || col.id || idx);
                const isSortable = col.enableSorting !== false && !!col.accessorKey;

                return (
                  <TableHead
                    key={key}
                    onClick={() => isSortable && handleSort(col.accessorKey as string)}
                    className={cn(isSortable && 'cursor-pointer select-none hover:text-neutral-900')}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-neutral-600">
                      <span>{typeof col.header === 'function' ? col.header({ column: col }) : col.header}</span>
                      {isSortable && <ArrowUpDown size={12} className="text-neutral-400 shrink-0" />}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <TableRow
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-neutral-50/80 transition-colors')}
                >
                  {columns.map((col, colIdx) => {
                    const key = String(col.accessorKey || col.id || colIdx);
                    const cellValue = col.accessorKey ? row[col.accessorKey as string] : undefined;

                    return (
                      <TableCell key={key} className="text-xs text-neutral-800 py-3">
                        {col.cell
                          ? col.cell({
                              row: { original: row },
                              getValue: () => cellValue,
                            })
                          : cellValue !== undefined
                          ? String(cellValue)
                          : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-neutral-400">
                  {emptyState || 'Không có dữ liệu'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-neutral-500">
          <div>
            Trang {currentPage} / {totalPages} ({data.length} bản ghi)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={14} className="mr-1" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Sau <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
