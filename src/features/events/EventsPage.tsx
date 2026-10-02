import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  LayoutGrid,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Building2,
  HeartHandshake,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { MonthCalendar } from '@/components/shared/MonthCalendar';
import { EventDetailDialog, type CalendarEventItem } from '@/components/shared/EventDetailDialog';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/format';

export const EventsPage: React.FC = () => {
  const [sourceFilter, setSourceFilter] = useState<'all' | 'club' | 'volunteer' | 'workshop'>('all');
  const [onlyRegistered, setOnlyRegistered] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<CalendarEventItem[]>({
    queryKey: ['events', sourceFilter, onlyRegistered],
    queryFn: () =>
      apiClient.get('/events', {
        params: {
          source: sourceFilter,
          registered: onlyRegistered ? 'true' : undefined,
        },
      }),
  });

  const sources = [
    { value: 'all', label: 'Tất cả nguồn' },
    { value: 'club', label: 'Sự kiện CLB' },
    { value: 'volunteer', label: 'Tình nguyện' },
    { value: 'workshop', label: 'Workshop' },
  ];

  const handleDownloadIcs = (event: CalendarEventItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SCS FPT//Event//VI\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description.replace(/\n/g, '\\n')}\nLOCATION:${event.location}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Đã tải tệp lịch .ics',
      description: 'Mở tệp để thêm vào Google hoặc Apple Calendar.',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={CalendarDays}
        title="Lịch sự kiện tổng hợp"
        description="Theo dõi tập trung lịch hoạt động, seminar, workshop và chiến dịch tình nguyện trong toàn trường theo dạng lịch tháng"
      />

      {/* Control bar: Source Filter Dropdown + Registered Only Toggle + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-neutral-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <FilterSelect
            label="Nguồn"
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v as any)}
            options={sources}
          />

          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
            <Switch
              id="registered-toggle"
              checked={onlyRegistered}
              onCheckedChange={setOnlyRegistered}
            />
            <label
              htmlFor="registered-toggle"
              className="text-xs font-medium text-neutral-700 cursor-pointer select-none"
            >
              Chỉ sự kiện đã đăng ký
            </label>
          </div>
        </div>

        {/* View Mode Toggle: Calendar vs Grid */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-surface text-brand-700 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <CalendarIcon size={14} />
            <span>Lịch tháng</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-surface text-brand-700 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Danh sách thẻ</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : !events || events.length === 0 ? (
        <EmptyState
          title="Chưa có sự kiện nào"
          description="Hiện tại không có sự kiện hoặc chương trình nào khớp với bộ lọc này."
        />
      ) : viewMode === 'calendar' ? (
        <MonthCalendar
          events={events}
          onSelectEvent={(ev) => setSelectedEvent(ev)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((evt) => (
            <Card
              key={`${evt.sourceType}_${evt.id}`}
              className="overflow-hidden hover:border-neutral-300 transition-colors flex flex-col justify-between cursor-pointer"
              onClick={() => setSelectedEvent(evt)}
            >
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        {evt.sourceType === 'club' ? (
                          <Building2 size={15} />
                        ) : (
                          <HeartHandshake size={15} />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-neutral-900 block line-clamp-1">
                          {evt.sourceLabel}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {evt.mode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {evt.registeredByMe && (
                        <Badge tier="success" size="sm" dot>
                          Đã đăng ký
                        </Badge>
                      )}
                      <Badge
                        tier={evt.status === 'Published' ? 'pending' : 'neutral'}
                        size="sm"
                      >
                        {evt.status === 'Published' ? 'Đang mở' : 'Đã kết thúc'}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 hover:text-brand-600 transition-colors line-clamp-2">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-neutral-700">
                      <Clock size={14} className="text-neutral-400" />
                      {formatDateTime(evt.startAt)}
                    </span>
                    <span className="flex items-center gap-1.5 line-clamp-1">
                      <MapPin size={14} className="text-neutral-400" />
                      {evt.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                    <Users size={13} className="text-neutral-400" />
                    <span>{evt.registeredCount}/{evt.capacity}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDownloadIcs(evt, e)}
                  leftIcon={<Download size={14} />}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  Lưu .ics
                </Button>

                <Link
                  to={evt.detailUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>Xem chi tiết</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Event Detail Dialog (preview on click) */}
      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
};

export default EventsPage;
