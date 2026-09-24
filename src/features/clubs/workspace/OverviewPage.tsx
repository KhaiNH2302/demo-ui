import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, CheckSquare, Users, DollarSign, Plus, ArrowRight, Clock } from 'lucide-react';
import type { ClubEvent, EventTask } from '@/types/entities';

export const ClubOverviewPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');

  const summaryQuery = useQuery({
    queryKey: ['clubs', clubId, 'dashboard-summary'],
    queryFn: () => apiClient.get<{ eventsCount: number; tasksCount: number; pendingApps: number; pendingExpenses: number }>(`/clubs/${clubId}/dashboard-summary`),
    enabled: !!clubId,
  });

  const eventsQuery = useQuery({
    queryKey: queryKeys.clubs.events(clubId!),
    queryFn: () => apiClient.get<ClubEvent[]>(`/clubs/${clubId}/events`),
    enabled: !!clubId,
  });

  const isManager = role === 'manager';
  const isTreasurer = role === 'treasurer';

  const upcomingEvents = (eventsQuery.data || []).filter((e) => e.status !== 'Finished').slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan hoạt động"
        description="Theo dõi sự kiện, tiến độ nhiệm vụ và công việc nội bộ câu lạc bộ"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Workspace' },
          { label: 'Tổng quan' },
        ]}
      />

      <QueryBoundary queries={[summaryQuery]}>
        {summaryQuery.data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Sự kiện sắp tới"
              value={summaryQuery.data.eventsCount}
              icon={<Calendar className="w-5 h-5" />}
              description="Sự kiện đã lên lịch"
            />
            <SummaryCard
              title="Nhiệm vụ cần làm"
              value={summaryQuery.data.tasksCount}
              icon={<CheckSquare className="w-5 h-5" />}
              description="Đầu việc đang phụ trách"
            />
            {(isManager || isTreasurer) && (
              <>
                <SummaryCard
                  title="Đơn ứng tuyển mới"
                  value={summaryQuery.data.pendingApps}
                  icon={<Users className="w-5 h-5" />}
                  description="Chờ xét duyệt hồ sơ"
                />
                <SummaryCard
                  title="Đề nghị chi chờ duyệt"
                  value={summaryQuery.data.pendingExpenses}
                  icon={<DollarSign className="w-5 h-5" />}
                  description="Khoản chi cần phê duyệt"
                />
              </>
            )}
          </div>
        )}
      </QueryBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming events preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Sự kiện CLB sắp diễn ra
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/clubs/${clubId}/workspace/events`)}>
              Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">Chưa có sự kiện nào sắp diễn ra.</p>
            ) : (
              upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 border border-[var(--border-subtle)] rounded-lg flex items-center justify-between hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                  onClick={() => navigate(`/clubs/${clubId}/workspace/events/${evt.id}`)}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">{evt.title}</div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" /> {new Date(evt.startAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <Badge variant="neutral">{evt.status === 'Ongoing' ? 'Đang diễn ra' : 'Sắp diễn ra'}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-1 justify-start text-left"
              onClick={() => navigate(`/clubs/${clubId}/workspace/tasks`)}
            >
              <span className="font-semibold text-sm flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-primary" /> Bảng nhiệm vụ (Kanban)
              </span>
              <span className="text-xs text-[var(--text-muted)]">Xem và cập nhật tiến độ công việc</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-1 justify-start text-left"
              onClick={() => navigate(`/clubs/${clubId}/workspace/chat`)}
            >
              <span className="font-semibold text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Kênh Chat CLB
              </span>
              <span className="text-xs text-[var(--text-muted)]">Trao đổi trực tuyến cùng thành viên</span>
            </Button>

            {isManager && (
              <>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-1 justify-start text-left"
                  onClick={() => navigate(`/clubs/${clubId}/workspace/recruitments`)}
                >
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" /> Quản lý Đợt tuyển
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Tạo đợt tuyển và duyệt hồ sơ</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-1 justify-start text-left"
                  onClick={() => navigate(`/clubs/${clubId}/workspace/events/new`)}
                >
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-primary" /> Tạo sự kiện mới
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Lên kế hoạch tổ chức sự kiện</span>
                </Button>
              </>
            )}

            {isTreasurer && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-1 justify-start text-left"
                onClick={() => navigate(`/clubs/${clubId}/workspace/finance`)}
              >
                <span className="font-semibold text-sm flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-primary" /> Quỹ & Tài chính
                </span>
                <span className="text-xs text-[var(--text-muted)]">Ghi thu chi và đối soát số dư</span>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClubOverviewPage;
