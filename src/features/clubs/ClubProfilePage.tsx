import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Users, Sparkles, Building, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import type { Club, Recruitment, ClubEvent, ClubMembership } from '@/types/entities';

export const ClubProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const clubQuery = useQuery({
    queryKey: queryKeys.clubs.detail(id!),
    queryFn: () => apiClient.get<Club>(`/clubs/${id}`),
    enabled: !!id,
  });

  const recruitmentsQuery = useQuery({
    queryKey: queryKeys.clubs.recruitments(id!),
    queryFn: () => apiClient.get<Recruitment[]>(`/clubs/${id}/recruitments`),
    enabled: !!id,
  });

  const eventsQuery = useQuery({
    queryKey: queryKeys.clubs.events(id!),
    queryFn: () => apiClient.get<ClubEvent[]>(`/clubs/${id}/events`),
    enabled: !!id,
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.clubs.members(id!),
    queryFn: () => apiClient.get<ClubMembership[]>(`/clubs/${id}/members`),
    enabled: !!id,
  });

  const club = clubQuery.data;
  const recruitments = recruitmentsQuery.data || [];
  const openRecruitment = recruitments.find((r) => r.status === 'Published');
  const events = eventsQuery.data || [];
  const upcomingEvents = events.filter((e) => e.status !== 'Finished').slice(0, 3);
  const members = membersQuery.data || [];

  const isMember = user ? members.some((m) => m.userId === user.id && m.status === 'Active') : false;
  const isManager = user?.id === club?.managerId;

  return (
    <QueryBoundary queries={[clubQuery]}>
      {club && (
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            title={club.name}
            description={`Lĩnh vực: ${club.field}`}
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Câu lạc bộ', href: '/clubs' },
              { label: club.name },
            ]}
            actions={
              isMember || isManager ? (
                <Button onClick={() => navigate(`/clubs/${id}/workspace/overview`)}>
                  Vào Club Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : openRecruitment ? (
                <Button onClick={() => navigate(`/clubs/${id}/apply`)}>
                  <Sparkles className="w-4 h-4 mr-1.5" /> Ứng tuyển ngay
                </Button>
              ) : null
            }
          />

          {/* Club Hero Banner */}
          <Card className="overflow-hidden border-[var(--border-subtle)]">
            <div className="h-36 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 flex items-end">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface-card)] border-2 border-[var(--border-subtle)] shadow-sm flex items-center justify-center font-bold text-2xl text-primary">
                  {club.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">{club.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{club.field}</Badge>
                    <Badge variant="success">Hoạt động chính thức</Badge>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2">Giới thiệu về câu lạc bộ</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
                  {club.description}
                </p>
              </div>

              {/* Management Board */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Ban Chủ nhiệm / Đại diện CLB
                </h3>
                <div className="flex items-center gap-3">
                  <UserMiniCard userId={club.managerId} showMajor />
                  <Badge variant="attention">Chủ nhiệm CLB</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Recruitment Block */}
          {openRecruitment ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base text-primary">Đợt tuyển thành viên đang mở</CardTitle>
                </div>
                <Badge variant="success">Đang nhận hồ sơ</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <h4 className="font-semibold text-sm">{openRecruitment.title}</h4>
                <p className="text-sm text-[var(--text-muted)]">{openRecruitment.criteria}</p>
                <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Hạn nộp: {new Date(openRecruitment.deadline).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Chỉ tiêu còn lại:{' '}
                    <strong className="text-primary font-bold ml-1">
                      {openRecruitment.quota - openRecruitment.acceptedCount}/{openRecruitment.quota}
                    </strong>
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                {isMember ? (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/clubs/${id}/workspace/overview`)}>
                    Bạn đã là thành viên CLB
                  </Button>
                ) : (
                  <Button onClick={() => navigate(`/clubs/${id}/apply`)}>
                    Nộp đơn ứng tuyển ngay <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <div className="p-4 rounded-lg bg-[var(--surface-muted)] text-center text-sm text-[var(--text-muted)]">
              Câu lạc bộ hiện chưa có đợt tuyển thành viên nào đang mở.
            </div>
          )}

          {/* Upcoming Events */}
          <div>
            <h3 className="text-base font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Sự kiện sắp tới ({upcomingEvents.length})
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Chưa có sự kiện công khai nào sắp diễn ra.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map((evt) => (
                  <Card key={evt.id}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="neutral" className="text-xs">
                          {evt.status === 'Ongoing' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                        </Badge>
                        <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1">
                          <Users className="w-3 h-3" /> Sức chứa: {evt.capacity}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2">{evt.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{evt.description}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-subtle)]">
                        <Clock className="w-3.5 h-3.5" /> {new Date(evt.startAt).toLocaleString('vi-VN')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </QueryBoundary>
  );
};

export default ClubProfilePage;
