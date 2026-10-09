import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
} from 'lucide-react';
import * as HoverCard from '@radix-ui/react-hover-card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { localDateKey, localEventTime } from '@/lib/calendarDate';
import type { CalendarEventItem } from './EventDetailDialog';

export interface MonthCalendarProps {
  events: CalendarEventItem[];
  currentDate?: Date;
  onSelectEvent: (event: CalendarEventItem) => void;
  className?: string;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  events,
  currentDate = new Date(),
  onSelectEvent,
  className,
}) => {
  const referenceDateKey = localDateKey(currentDate);
  const referenceDate = useMemo(() => new Date(`${referenceDateKey}T00:00:00`), [referenceDateKey]);
  const [viewDate, setViewDate] = useState<Date>(new Date(referenceDate));
  const [selectedMobileDate, setSelectedMobileDate] = useState<Date | null>(new Date(referenceDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthLabel = useMemo(() => {
    return `Tháng ${month + 1}, ${year}`;
  }, [month, year]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date(referenceDate));
    setSelectedMobileDate(new Date(referenceDate));
  };

  // Calendar cells generation: 7 columns x 5 or 6 rows
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is index 0 in our display. JS getDay() returns 0 for Sunday, 1 for Monday...
    const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateKey: string;
    }[] = [];

    const todayStr = referenceDateKey;

    // Leading days from previous month
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const key = localDateKey(d);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: key === todayStr,
        dateKey: key,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = localDateKey(d);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: key === todayStr,
        dateKey: key,
      });
    }

    // Trailing days to fill 42 cells (6 rows * 7 cols) or 35 cells
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const key = localDateKey(d);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: key === todayStr,
        dateKey: key,
      });
    }

    return days;
  }, [year, month, referenceDateKey]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of events) {
      if (!ev.startAt) continue;
      const key = localDateKey(ev.startAt);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  const selectedMobileKey = selectedMobileDate ? localDateKey(selectedMobileDate) : '';
  const selectedMobileEvents = selectedMobileKey ? eventsByDate.get(selectedMobileKey) || [] : [];

  const getPillStyle = (ev: CalendarEventItem) => {
    if (ev.sourceType === 'club') {
      return 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100';
    }
    if (ev.programType === 'Volunteer') {
      return 'bg-tier-success-bg text-tier-success-text border-tier-success-border hover:bg-emerald-100/60';
    }
    return 'bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100';
  };

  const getDotStyle = (ev: CalendarEventItem) => {
    if (ev.sourceType === 'club') return 'bg-brand-500';
    if (ev.programType === 'Volunteer') return 'bg-tier-success-dot';
    return 'bg-accent-500';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Calendar Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">{monthLabel}</h2>
            <span className="text-xs text-neutral-500 hidden sm:inline">
              Lịch tổng hợp sự kiện CLB &amp; Chương trình
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs h-8 px-2.5"
          >
            Hôm nay
          </Button>

          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-surface">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Tháng trước"
              className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Tháng sau"
              className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 7x6 Grid Container */}
      <div className="rounded-xl border border-neutral-200 bg-surface shadow-xs overflow-hidden">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/70 text-center text-xs font-semibold text-neutral-600 py-2.5">
          {WEEKDAYS.map((w, idx) => (
            <div key={w} className={cn(idx >= 5 && 'text-neutral-400')}>
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100">
          {calendarDays.map((dayItem) => {
            const dayEvents = eventsByDate.get(dayItem.dateKey) || [];
            const isSelected = selectedMobileKey === dayItem.dateKey;

            return (
              <div
                key={dayItem.dateKey}
                onClick={() => setSelectedMobileDate(dayItem.date)}
                className={cn(
                  'min-h-[75px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col transition-colors cursor-pointer select-none',
                  !dayItem.isCurrentMonth && 'bg-neutral-50/40 text-neutral-400 opacity-60',
                  isSelected && 'ring-2 ring-brand-500/40 bg-brand-50/20 sm:ring-0 sm:bg-transparent',
                  'hover:bg-neutral-50/70'
                )}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full',
                      dayItem.isToday
                        ? 'bg-brand-600 text-white font-bold shadow-xs'
                        : dayItem.isCurrentMonth
                        ? 'text-neutral-800'
                        : 'text-neutral-400'
                    )}
                  >
                    {dayItem.date.getDate()}
                  </span>

                  {/* Mobile event dots (< 640px) */}
                  <div className="flex sm:hidden items-center gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={cn('h-1.5 w-1.5 rounded-full', getDotStyle(e))}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-neutral-400 font-bold">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop Pills (>= 640px) */}
                <div className="hidden sm:flex flex-col gap-1 flex-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const timeStr = localEventTime(ev.startAt);
                    return (
                      <HoverCard.Root key={ev.id} openDelay={200} closeDelay={150}>
                        <HoverCard.Trigger asChild>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(ev);
                            }}
                            className={cn(
                              'text-[11px] px-1.5 py-0.5 rounded text-left truncate font-medium border transition-colors cursor-pointer w-full block',
                              getPillStyle(ev)
                            )}
                          >
                            <span className="font-bold mr-1 opacity-75">{timeStr}</span>
                            <span>{ev.title}</span>
                          </button>
                        </HoverCard.Trigger>

                        <HoverCard.Portal>
                          <HoverCard.Content
                            side="top"
                            align="center"
                            sideOffset={6}
                            className="z-50 w-72 rounded-xl bg-surface border border-neutral-200 p-3.5 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 text-xs space-y-2 text-neutral-700"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                                {ev.sourceLabel}
                              </span>
                              {ev.registeredByMe && (
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={11} /> Đã đăng ký
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs text-neutral-900 leading-snug line-clamp-2">
                              {ev.title}
                            </h4>

                            <div className="space-y-1 text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-neutral-400 shrink-0" />
                                <span>{timeStr} — {ev.mode}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin size={12} className="text-neutral-400 shrink-0" />
                                <span className="truncate">{ev.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-neutral-400 shrink-0" />
                                <span>{ev.registeredCount} / {ev.capacity} đã đăng ký</span>
                              </div>
                            </div>
                          </HoverCard.Content>
                        </HoverCard.Portal>
                      </HoverCard.Root>
                    );
                  })}

                  {dayEvents.length > 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dayEvents[0]) onSelectEvent(dayEvents[0]);
                      }}
                      className="text-[10px] text-brand-600 font-semibold hover:underline text-left px-1 mt-auto"
                    >
                      +{dayEvents.length - 3} sự kiện nữa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Selected Date Detail (< 640px) */}
      <div className="block sm:hidden bg-surface p-4 rounded-xl border border-neutral-200 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-xs font-bold text-neutral-900">
            Sự kiện ngày {selectedMobileDate?.getDate()}/{selectedMobileDate ? selectedMobileDate.getMonth() + 1 : ''}
          </h3>
          <span className="text-xs text-neutral-500">
            {selectedMobileEvents.length} sự kiện
          </span>
        </div>

        {selectedMobileEvents.length === 0 ? (
          <p className="text-xs text-neutral-400 py-3 text-center">
            Không có sự kiện nào trong ngày này.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedMobileEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                    {ev.sourceLabel}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {localEventTime(ev.startAt)}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{ev.title}</h4>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                  <span className="truncate">{ev.location}</span>
                  <span>·</span>
                  <span>{ev.registeredCount}/{ev.capacity} chỗ</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
