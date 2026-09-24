import React from 'react';
import { cn } from '@/lib/cn';

export interface KanbanColumn<T> {
  key?: string;
  id?: string;
  title: string;
  items: T[];
  badgeColor?: string;
  badgeVariant?: any;
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, columnKey?: string) => React.ReactNode;
  onDropItem?: (itemId: string, fromColumn: string, toColumn: string) => void;
  onCardMove?: (itemId: string, targetColId: string) => void;
  className?: string;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  className,
}: KanbanBoardProps<T>) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4', className)}>
      {columns.map((col, idx) => {
        const colKey = col.key || col.id || `col_${idx}`;
        return (
          <div
            key={colKey}
            className="flex flex-col rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 min-w-[260px]"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200">
              <h4 className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                <span>{col.title}</span>
              </h4>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-200/70 px-1.5 text-[11px] font-bold text-neutral-700">
                {col.items.length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[160px]">
              {col.items.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4 border border-dashed border-neutral-200 rounded-md text-[11px] text-neutral-400 text-center">
                  Không có mục nào
                </div>
              ) : (
                col.items.map((item) => (
                  <div key={item.id} className="transition-transform duration-150 hover:-translate-y-0.5">
                    {renderCard(item, colKey)}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
