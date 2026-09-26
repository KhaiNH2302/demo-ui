import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Users,
  Building2,
  Share2,
  CheckCircle2,
  CalendarPlus,
  Video,
  UserCheck,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import type { PublicEventItem } from '@/mocks/data/events';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery<PublicEventItem>({
    queryKey: ['events', id],
    queryFn: () => apiClient.get(`/events/${id}`),
  });

  const registerMutation = useMutation({
    mutationFn: ({ registered }: { registered: boolean }) =>
      registered
        ? apiClient.delete(`/events/${id}/register`)
        : apiClient.post(`/events/${id}/register`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['nav', 'counters'] });
      toast({
        title: variables.registered ? 'Đã hủy đăng ký sự kiện' : 'Đăng ký tham gia thành công!',
        description: variables.registered
          ? 'Bạn đã hủy chỗ tham gia sự kiện này.'
          : 'Vé tham dự và nhắc hẹn đã được lưu vào hệ thống.',
        variant: variables.registered ? 'default' : 'success',
      });
    },
  });

  if (isLoading || !event) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chi tiết sự kiện" backHref="/events" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={event.title}
        backHref="/events"
        breadcrumb={[
          { label: 'Sự kiện', href: '/events' },
          { label: event.clubName, href: `/clubs/${event.clubId}` },
          { label: 'Chi tiết sự kiện' },
        ]}
      />

      {/* Cover Image */}
      {event.coverUrl && (
        <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden shadow-md">
          <img
            src={event.coverUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
            <div className="text-white space-y-1.5">
              <span className="px-3 py-1 rounded-lg bg-brand-600 font-semibold text-xs inline-block">
                {event.clubName}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{event.title}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Registration Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2/3): Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Info Highlights */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Thông tin sự kiện</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <CalendarDays size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-900 block">Thời gian diễn ra</span>
                  <span className="text-neutral-600">
                    {new Date(event.startAt).toLocaleString('vi-VN', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-900 block">Địa điểm</span>
                  <span className="text-neutral-600">{event.location}</span>
                </div>
              </div>

              {event.speaker && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <UserCheck size={18} className="text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-900 block">Diễn giả / Khách mời</span>
                    <span className="text-neutral-600">{event.speaker}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-neutral-900">Nội dung chi tiết</h2>
            <div className="text-sm text-neutral-700 leading-relaxed space-y-3">
              <p>{event.description}</p>
              <p>
                Tham gia sự kiện để có cơ hội học hỏi kinh nghiệm, mở rộng mạng lưới quan hệ
                với bạn học và các chuyên gia trong ngành, đồng thời nhận điểm rèn luyện và chứng chỉ
                từ Ban Chủ nhiệm CLB.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (1/3, Sticky Action Card) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
              {event.clubLogoUrl ? (
                <img
                  src={event.clubLogoUrl}
                  alt={event.clubName}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-neutral-200"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center">
                  {event.clubName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-xs text-neutral-400 block">Đơn vị tổ chức</span>
                <Link
                  to={`/clubs/${event.clubId}`}
                  className="font-bold text-sm text-neutral-900 hover:text-brand-600 truncate block"
                >
                  {event.clubName}
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Số lượng đăng ký:</span>
                <span className="font-bold text-neutral-900">
                  {event.registeredCount} / {event.capacity}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full"
                  style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                registerMutation.mutate({ registered: !!event.registeredByMe })
              }
              disabled={registerMutation.isPending || (event.status === 'Finished')}
              className={`w-full py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                event.registeredByMe
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-100'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {event.registeredByMe ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Đã đăng ký (Bấm để hủy)</span>
                </>
              ) : (
                <span>Đăng ký tham gia ngay</span>
              )}
            </button>

            <p className="text-[11px] text-neutral-400 text-center leading-tight">
              Sự kiện hoàn toàn miễn phí cho sinh viên Đại học FPT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
