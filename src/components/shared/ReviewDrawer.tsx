import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/Sheet';

export interface ReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Sheet bên phải chuẩn cho mọi luồng duyệt/xem chi tiết bản ghi (CL6, PG4, G3, M4, S2, A2-A8)
 * theo 04-reuse-plan.md § 2.2
 */
export const ReviewDrawer: React.FC<ReviewDrawerProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  statusBadge,
  children,
  actions,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          <SheetHeader className="border-b border-neutral-200 pb-4">
            <div className="flex items-center justify-between gap-2 pr-6">
              <SheetTitle className="text-base font-semibold text-neutral-900">
                {title}
              </SheetTitle>
              {statusBadge}
            </div>
            {subtitle && (
              <SheetDescription className="text-xs text-neutral-500">
                {subtitle}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="space-y-4">{children}</div>
        </div>

        {actions && (
          <div className="pt-4 mt-6 border-t border-neutral-200 flex items-center justify-end gap-2 sticky bottom-0 bg-surface py-3">
            {actions}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
