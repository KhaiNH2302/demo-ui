import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Users,
  Video,
  CheckCircle2,
  CalendarPlus,
  Building2,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface AggregatedEventItem {
  id: string;
  sourceType: 'club' | 'program';
  programType?: 'Volunteer' | 'Workshop';
  sourceLabel: string;
  clubId: string;
  clubName: string;
  clubLogo?: string;
  coverUrl?: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  mode: 'Offline' | 'Online' | 'Hybrid';
  location: string;
  capacity: number;
  registeredCount: number;
  registeredByMe: boolean;
  myStatus?: string;
  status: 'Published' | 'Finished';
  detailUrl: string;
  tags?: string[];
}

export const EventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'club' | 'volunteer' | 'workshop'>('all');
  const [selectedDateIdx, setSelectedDateIdx] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<AggregatedEventItem[]>({
    queryKey: ['events', activeTab, sourceFilter],
    queryFn: () =>
      apiClient.get('/events', {
        params: { tab: activeTab, source: sourceFilter },
      }),
  });

  // 14-day date strip generator
  const today = new Date();
  const dateStrip = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d,
      dayName: i === 0 ? 'Hôm nay' : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
      dayNumber: d.getDate(),
      month: d.getMonth() + 1,
    };
  });

  const handleDownloadIcs = (event: AggregatedEventItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SCS FPT//Event//VI\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Đã tải tệp lịch .ics',
      description: 'Bạn có thể mở tệp để thêm vào Google hoặc Apple Calendar.',
    });
  };

  const sources = [
    { key: 'all', label: 'Tất cả nguồn' },
    { key: 'club', label: 'Sự kiện CLB' },
    { key: 'volunteer', label: 'Tình nguyện' },
    { key: 'workshop', label: 'Workshop' },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={CalendarDays}
        title="Lịch sự kiện tổng hợp"
        description="Theo dõi tập trung lịch sự kiện từ các Câu lạc bộ và các kênh Tình nguyện & Workshop trong trường"
      />

      {/* 14-Day Date Strip */}
      <Card className="p-3.5">
        <div className="text-xs font-semibold text-neutral-500 mb-2 px-1">
          Lịch hoạt động 14 ngày tới
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dateStrip.map((item, idx) => {
            const isSelected = selectedDateIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDateIdx(isSelected ? null : idx)}
                className={`flex flex-col items-center justify-center min-w-[60px] py-2 px-2 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white font-bold'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-neutral-500'}`}>
                  {item.dayName}
                </span>
                <span className="text-base font-bold leading-tight">{item.dayNumber}</span>
                <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-neutral-500'}`}>
                  Thg {item.month}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Tabs & Source Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          <TabsList className="bg-neutral-100 p-1 rounded-xl">
            <TabsTrigger value="upcoming" className="rounded-lg text-xs font-semibold">
              Sắp diễn ra
            </TabsTrigger>
            <TabsTrigger value="registered" className="rounded-lg text-xs font-semibold">
              Đã đăng ký
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg text-xs font-semibold">
              Đã kết thúc
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {sources.map((src) => (
              <button
                key={src.key}
                type="button"
                onClick={() => setSourceFilter(src.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  sourceFilter === src.key
                    ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200'
                    : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : !events || events.length === 0 ? (
            <EmptyState
              title="Chưa có sự kiện nào"
              description="Hiện tại không có sự kiện hoặc chương trình nào khớp với bộ lọc này."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((evt) => (
                <Card
                  key={`${evt.sourceType}_${evt.id}`}
                  className="overflow-hidden hover:border-neutral-300 transition-colors flex flex-col justify-between"
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
                            <span className="text-xs font-semibold text-neutral-900 block">
                              {evt.sourceLabel}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {evt.sourceType === 'club'
                                ? 'Sự kiện Câu lạc bộ'
                                : evt.programType === 'Volunteer'
                                ? 'Chiến dịch Tình nguyện'
                                : 'Workshop Học thuật'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge tier={evt.mode === 'Online' ? 'brand' : 'neutral'} size="sm">
                            {evt.mode === 'Online' && <Video size={12} className="mr-1" />}
                            {evt.mode}
                          </Badge>
                          {evt.registeredByMe && (
                            <Badge tier="success" size="sm">
                              <CheckCircle2 size={12} className="mr-1" /> Đã đăng ký
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 pt-1">
                        <CalendarDays size={14} />
                        <span>
                          {new Date(evt.startAt).toLocaleString('vi-VN', {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <Link to={evt.detailUrl}>
                        <h3 className="font-bold text-base text-neutral-900 leading-snug hover:text-brand-600 transition-colors">
                          {evt.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="space-y-1 pt-1 text-xs text-neutral-500">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-neutral-400 shrink-0" />
                          <span>
                            Số lượng xác nhận: {evt.registeredCount}/{evt.capacity} chỗ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Read-only calendar links to source detail page */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadIcs(evt, e)}
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
                        title="Thêm vào Lịch (.ics)"
                      >
                        <CalendarPlus size={15} />
                        <span>Lưu lịch (.ics)</span>
                      </button>

                      <Link to={evt.detailUrl}>
                        <Button
                          variant="secondary"
                          size="sm"
                          rightIcon={<ArrowRight size={14} />}
                        >
                          Xem tại nguồn
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventsPage;
