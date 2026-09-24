import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatScheduleSlot } from '@/lib/format';
import type { ScheduleSlot } from '@/types/entities';

export interface ScheduleCompareProps {
  labelA?: string;
  slotsA?: ScheduleSlot[];
  labelB?: string;
  slotsB?: ScheduleSlot[];
}

export const ScheduleCompare: React.FC<ScheduleCompareProps> = ({
  labelA = 'Lịch học của bạn',
  slotsA = [],
  labelB = 'Lịch học đối tác',
  slotsB = [],
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
      <div>
        <div className="text-xs font-semibold text-neutral-700 mb-2">{labelA}</div>
        {slotsA.length === 0 ? (
          <p className="text-meta text-neutral-400">Chưa khai báo lịch</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {slotsA.map((s, i) => (
              <Badge key={i} tier="neutral" size="sm">
                {formatScheduleSlot(s)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-neutral-700 mb-2">{labelB}</div>
        {slotsB.length === 0 ? (
          <p className="text-meta text-neutral-400">Chưa khai báo lịch</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {slotsB.map((s, i) => (
              <Badge key={i} tier="pending" size="sm">
                {formatScheduleSlot(s)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
