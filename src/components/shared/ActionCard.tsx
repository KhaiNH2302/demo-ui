import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export interface ActionCardMetaRow {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

export interface ActionCardProps {
  statusBadge?: React.ReactNode;
  metaRows?: ActionCardMetaRow[];
  capacityBar?: {
    current: number;
    max: number;
    label?: string;
  };
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}

/**
 * Hộp hành động sticky cột phải trên trang chi tiết (CL3, PG2, G2, M2, S2)
 * theo 04-reuse-plan.md § 2.2
 */
export const ActionCard: React.FC<ActionCardProps> = ({
  statusBadge,
  metaRows = [],
  capacityBar,
  primaryAction,
  secondaryActions,
  note,
  className,
}) => {
  const pct =
    capacityBar && capacityBar.max > 0
      ? Math.min(100, Math.round((capacityBar.current / capacityBar.max) * 100))
      : 0;

  return (
    <Card className={cn('p-5 space-y-4 lg:sticky lg:top-20', className)}>
      {statusBadge && (
        <div className="flex items-center justify-between gap-2">{statusBadge}</div>
      )}

      {capacityBar && capacityBar.max > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-600">{capacityBar.label || 'Chỉ tiêu đăng ký'}</span>
            <strong className="font-semibold text-neutral-900 tabular-nums">
              {capacityBar.current}/{capacityBar.max} chỗ
            </strong>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct >= 100 ? 'bg-tier-warning-dot' : 'bg-brand-600',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {metaRows.length > 0 && (
        <dl className="space-y-2.5 text-xs border-t border-neutral-100 pt-3">
          {metaRows.map((row, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-neutral-500 shrink-0">
                {row.icon}
                <span>{row.label}</span>
              </dt>
              <dd className="text-neutral-900 font-medium text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {primaryAction && <div className="pt-1">{primaryAction}</div>}

      {secondaryActions && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100">
          {secondaryActions}
        </div>
      )}

      {note && <div className="text-xs text-neutral-500 leading-relaxed">{note}</div>}
    </Card>
  );
};
