import React from 'react';
import { Link } from 'react-router-dom';
import { DateBadge } from './DateBadge';
import { EntityRow } from './EntityRow';

export interface UpcomingItem {
  id: string;
  title: string;
  startAt: string;
  organizerName?: string;
  categoryLabel?: string;
  location?: string;
  href?: string;
  type?: 'program' | 'opportunity' | 'event';
}

export interface UpcomingListProps {
  items: UpcomingItem[];
  title?: string;
  emptyText?: string;
  maxItems?: number;
  viewAllHref?: string;
}

export const UpcomingList: React.FC<UpcomingListProps> = ({
  items,
  title = 'Sắp diễn ra',
  emptyText = 'Chưa có hoạt động sắp diễn ra.',
  maxItems = 4,
  viewAllHref,
}) => {
  const visible = items.slice(0, maxItems);

  return (
    <div className="space-y-2.5">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {viewAllHref && (
            <Link to={viewAllHref} className="text-xs font-medium text-brand-600 hover:underline">
              Xem tất cả →
            </Link>
          )}
        </div>
      )}
      {visible.length === 0 ? (
        <p className="text-xs text-neutral-500 py-2">{emptyText}</p>
      ) : (
        <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-surface overflow-hidden">
          {visible.map((item) => {
            const href =
              item.href ||
              (item.type === 'opportunity' ? `/opportunities/${item.id}` : `/programs/${item.id}`);
            const subtitleParts = [item.organizerName || item.categoryLabel, item.location].filter(Boolean);
            return (
              <EntityRow
                key={item.id}
                dense
                href={href}
                leading={<DateBadge date={item.startAt} size="sm" />}
                title={item.title}
                subtitle={subtitleParts.join(' · ')}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
