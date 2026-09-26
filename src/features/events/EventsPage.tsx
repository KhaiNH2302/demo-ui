import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Video,
  CheckCircle2,
  CalendarPlus,
  Share2,
  Building2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/components/ui/Toast';
import type { PublicEventItem } from '@/mocks/data/events';

export const EventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedDateIdx, setSelectedDateIdx] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery<PublicEventItem[]>({
    queryKey: ['events', activeTab],
    queryFn: () => apiClient.get('/events', { params: { tab: activeTab } }),
  });

  const registerMutation = useMutation({
    mutationFn: ({ id, registered }: { id: string; registered: boolean }) =>
      registered
        ? apiClient.delete(`/events/${id}/register`)
        : apiClient.post(`/events/${id}/register`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['nav', 'counters'] });
      toast({
        title: variables.registered ? 'Đã hủy đăng ký sự kiện' : 'Đăng ký tham gia thành công!',
        description: variables.registered
          ? 'Bạn đã hủy chỗ tham gia sự kiện này.'
          : 'Vé tham dự và thông tin chi tiết đã được gửi về thông báo của bạn.',
        variant: variables.registered ? 'default' : 'success',
      });
    },
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

  const handleDownloadIcs = (event: PublicEventItem, e: React.MouseEvent) => {
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
    toast({ title: 'Đã tải tệp lịch .ics', description: 'Bạn có thể mở tệp để thêm vào Google/Apple Calendar.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={CalendarDays}
        title="Sự kiện"
        description="Khám phá các workshop, sự kiện công nghệ và hoạt động giao lưu của các câu lạc bộ trong trường"
      />

      {/* 14-Day Date Strip */}
      <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="text-xs font-semibold text-neutral-500 mb-2 px-1">Lịch hoạt động 14 ngày tới</div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dateStrip.map((item, idx) => {
            const isSelected = selectedDateIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDateIdx(isSelected ? null : idx)}
                className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-1.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <span className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                  {item.dayName}
                </span>
                <span className="text-base font-bold leading-tight">{item.dayNumber}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>
                  Thg {item.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-neutral-100 p-1 rounded-xl">
          <TabsTrigger value="upcoming" className="rounded-lg text-xs font-semibold">
            Sắp diễn ra
          </TabsTrigger>
          <TabsTrigger value="registered" className="rounded-lg text-xs font-semibold">
            Đã đăng ký
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg text-xs font-semibold">
            Đã qua
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : !events || events.length === 0 ? (
            <EmptyState
              title="Chưa có sự kiện nào"
              description="Hiện tại không có sự kiện nào phù hợp với bộ lọc này."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
                >
                  {/* Event Cover Image */}
                  {evt.coverUrl && (
                    <div className="relative h-44 w-full bg-neutral-100 overflow-hidden">
                      <img
                        src={evt.coverUrl}
                        alt={evt.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5">
                        <Building2 size={13} />
                        <span>{evt.clubName}</span>
                      </div>
                      {evt.isOnline && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1">
                          <Video size={13} />
                          <span>Online</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-brand-600">
                        <CalendarDays size={15} />
                        <span>{new Date(evt.startAt).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })}</span>
                      </div>

                      <Link to={`/events/${evt.id}`}>
                        <h3 className="font-bold text-lg text-neutral-900 leading-snug hover:text-brand-600 transition-colors">
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
                          <span>Đã đăng ký: {evt.registeredCount}/{evt.capacity} người</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadIcs(evt, e)}
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-medium"
                        title="Thêm vào Lịch (.ics)"
                      >
                        <CalendarPlus size={15} />
                        <span className="hidden sm:inline">Lưu lịch</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/events/${evt.id}`}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs transition-colors"
                        >
                          Chi tiết
                        </Link>

                        {evt.status !== 'Finished' && (
                          <button
                            type="button"
                            onClick={() =>
                              registerMutation.mutate({ id: evt.id, registered: !!evt.registeredByMe })
                            }
                            disabled={registerMutation.isPending}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                              evt.registeredByMe
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200'
                                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                            }`}
                          >
                            {evt.registeredByMe ? (
                              <>
                                <CheckCircle2 size={14} />
                                <span>Đã đăng ký</span>
                              </>
                            ) : (
                              <span>Đăng ký tham gia</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventsPage;
