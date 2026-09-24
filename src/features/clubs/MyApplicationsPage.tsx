import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StatusTimeline } from '@/components/shared/StatusTimeline';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Building2, Calendar, Video, MapPin, AlertCircle, Edit3, ArrowRight } from 'lucide-react';
import type { ClubApplication } from '@/types/entities';

export const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();

  const applicationsQuery = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: () => apiClient.get<ClubApplication[]>('/applications/me'),
  });

  const getTimelineSteps = (status: ClubApplication['status']) => {
    if (status === 'NeedsSupplement') {
      return [
        { label: 'Nộp đơn', status: 'completed' as const },
        { label: 'Cần bổ sung', status: 'current' as const },
        { label: 'Duyệt hồ sơ', status: 'upcoming' as const },
        { label: 'Phỏng vấn', status: 'upcoming' as const },
        { label: 'Kết quả', status: 'upcoming' as const },
      ];
    }
    return [
      {
        label: 'Nộp đơn',
        status: 'completed' as const,
      },
      {
        label: 'Duyệt hồ sơ',
        status: status === 'Submitted' ? ('current' as const) : ('completed' as const),
      },
      {
        label: 'Phỏng vấn',
        status: status === 'Interview' ? ('current' as const) : ['Accepted', 'Rejected'].includes(status) ? ('completed' as const) : ('upcoming' as const),
      },
      {
        label: status === 'Rejected' ? 'Từ chối' : 'Trúng tuyển',
        status: ['Accepted', 'Rejected'].includes(status) ? ('completed' as const) : ('upcoming' as const),
      },
    ];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn ứng tuyển CLB của tôi"
        description="Theo dõi tiến độ xét duyệt và lịch phỏng vấn của các câu lạc bộ bạn đã ứng tuyển"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Câu lạc bộ', href: '/clubs' },
          { label: 'Đơn ứng tuyển' },
        ]}
        actions={
          <Button onClick={() => navigate('/clubs')}>
            Khám phá thêm CLB
          </Button>
        }
      />

      <QueryBoundary queries={[applicationsQuery]}>
        {applicationsQuery.data && applicationsQuery.data.length === 0 ? (
          <EmptyState
            title="Bạn chưa nộp đơn vào CLB nào"
            description="Tìm kiếm câu lạc bộ phù hợp với đam mê của bạn và nộp đơn ngay hôm nay!"
            action={
              <Button onClick={() => navigate('/clubs')}>
                Xem danh sách CLB
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {applicationsQuery.data?.map((app) => (
              <Card key={app.id} className="overflow-hidden">
                <CardHeader className="bg-[var(--surface-muted)]/50 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" /> Mã CLB: {app.clubId}
                      </CardTitle>
                      <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
                        Đợt tuyển: {app.recruitmentId} • Nộp ngày: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <StatusBadge status={app.status} domain="clubs" />
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Timeline */}
                  <div className="py-2">
                    <StatusTimeline steps={getTimelineSteps(app.status)} />
                  </div>

                  {/* Supplement Request Alert */}
                  {app.status === 'NeedsSupplement' && (
                    <div className="p-4 rounded-lg bg-[var(--status-attention-bg)] border border-[var(--status-attention-border)] space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--status-attention-fg)]">
                        <AlertCircle className="w-4 h-4" /> Yêu cầu bổ sung thông tin từ CLB
                      </div>
                      <p className="text-sm text-[var(--status-attention-fg)]">
                        {app.supplementNote || 'Vui lòng cập nhật bổ sung câu trả lời hoặc tài liệu đính kèm.'}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => navigate(`/clubs/${app.clubId}/apply?applicationId=${app.id}`)}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Bổ sung hồ sơ ngay
                      </Button>
                    </div>
                  )}

                  {/* Interview Information */}
                  {app.interview && (
                    <div className="p-4 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">
                          Lịch phỏng vấn đã xếp
                        </span>
                        <Badge variant="secondary">
                          {String(app.interview.type || app.interview.mode).toLowerCase() === 'online' ? 'Phỏng vấn Online' : 'Phỏng vấn Offline'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[var(--text-main)] pt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                          <span>Thời gian: {new Date(app.interview.scheduledAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {String(app.interview.type || app.interview.mode).toLowerCase() === 'online' ? (
                            <Video className="w-4 h-4 text-[var(--text-muted)]" />
                          ) : (
                            <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                          <span>
                            {(app.interview.locationOrLink || app.interview.location || '').startsWith('http') ? (
                              <a
                                href={app.interview.locationOrLink || app.interview.location}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                Link phòng họp Google Meet / Teams
                              </a>
                            ) : (
                              `Địa điểm: ${app.interview.locationOrLink || app.interview.location || 'Chưa cập nhật'}`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 bg-[var(--surface-card)]">
                  <span className="text-xs text-[var(--text-subtle)]">
                    Mã hồ sơ: {app.id}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/clubs/${app.clubId}`)}>
                    Xem trang CLB <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
};

export default MyApplicationsPage;
