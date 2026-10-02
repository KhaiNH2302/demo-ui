import React from 'react';
import type { ScheduleSlot } from '@/types/entities';
import { cn } from '@/lib/cn';
import { Clock, AlertTriangle } from 'lucide-react';

interface WeeklyScheduleGridProps {
  theirSchedule?: ScheduleSlot[];
  mySchedule?: ScheduleSlot[];
  theirName?: string;
  myName?: string;
  className?: string;
}

const DAYS: { key: ScheduleSlot['day']; label: string }[] = [
  { key: 'Mon', label: 'Thứ 2' },
  { key: 'Tue', label: 'Thứ 3' },
  { key: 'Wed', label: 'Thứ 4' },
  { key: 'Thu', label: 'Thứ 5' },
  { key: 'Fri', label: 'Thứ 6' },
  { key: 'Sat', label: 'Thứ 7' },
  { key: 'Sun', label: 'Chủ nhật' },
];

function isOverlap(a: ScheduleSlot, b: ScheduleSlot): boolean {
  if (a.day !== b.day) return false;
  return !(a.end <= b.start || a.start >= b.end);
}

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  theirSchedule = [],
  mySchedule = [],
  theirName = 'Đối tác',
  myName = 'Bạn',
  className,
}) => {
  const hasComparison = mySchedule.length > 0;

  // Find all overlaps
  const overlaps: { their: ScheduleSlot; mine: ScheduleSlot }[] = [];
  if (hasComparison) {
    for (const t of theirSchedule) {
      for (const m of mySchedule) {
        if (isOverlap(t, m)) {
          overlaps.push({ their: t, mine: m });
        }
      }
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" />
            <span className="text-neutral-700">Lịch {theirName}</span>
          </div>

          {hasComparison && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-neutral-700">Lịch {myName}</span>
            </div>
          )}

          {hasComparison && overlaps.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              <span>Trùng lịch ({overlaps.length} ca)</span>
            </div>
          )}
        </div>

        {hasComparison && (
          <span className="text-neutral-500 text-[11px]">
            {overlaps.length === 0 ? '✓ Không trùng lịch học' : '⚠ Có lịch học trùng ca'}
          </span>
        )}
      </div>

      {/* Grid: 7 days columns for desktop, list for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {DAYS.map((day) => {
          const theirSlots = theirSchedule.filter((s) => s.day === day.key);
          const mySlots = mySchedule.filter((s) => s.day === day.key);
          const hasAny = theirSlots.length > 0 || mySlots.length > 0;

          return (
            <div
              key={day.key}
              className={cn(
                'rounded-lg border p-2.5 flex flex-col justify-start min-h-[110px] text-xs transition-colors',
                hasAny
                  ? 'border-neutral-200 bg-surface'
                  : 'border-neutral-200/50 bg-neutral-50/50 text-neutral-400'
              )}
            >
              <span className="font-semibold text-neutral-800 border-b border-neutral-200 pb-1 mb-2">
                {day.label}
              </span>

              {!hasAny ? (
                <span className="text-[11px] text-neutral-400 italic">Trống</span>
              ) : (
                <div className="space-y-1.5 flex-1">
                  {/* Their Slots */}
                  {theirSlots.map((slot, i) => {
                    const hasConflict = mySlots.some((m) => isOverlap(slot, m));
                    return (
                      <div
                        key={`their-${i}`}
                        className={cn(
                          'p-1.5 rounded text-[11px] font-mono leading-tight border transition-colors',
                          hasConflict
                            ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200'
                            : 'bg-brand-50 border-brand-200 text-brand-900 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-200'
                        )}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{slot.start}–{slot.end}</span>
                          {hasConflict && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                        </div>
                        <span className="text-[10px] opacity-80">{theirName}</span>
                      </div>
                    );
                  })}

                  {/* My Slots */}
                  {mySlots.map((slot, i) => {
                    const hasConflict = theirSlots.some((t) => isOverlap(t, slot));
                    return (
                      <div
                        key={`mine-${i}`}
                        className={cn(
                          'p-1.5 rounded text-[11px] font-mono leading-tight border transition-colors',
                          hasConflict
                            ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                        )}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{slot.start}–{slot.end}</span>
                          {hasConflict && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                        </div>
                        <span className="text-[10px] opacity-80">{myName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
