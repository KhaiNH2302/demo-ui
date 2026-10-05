import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare, Clock, Plus, AlertCircle, ArrowRight } from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';

export const MyMentoringRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const requestsQuery = useQuery({
    queryKey: ['mentoring', 'requests', 'me'],
    queryFn: () => apiClient.get<MentoringRequest[]>('/mentoring/requests/me'),
  });

  const allRequests = requestsQuery.data || [];
  const filteredRequests = allRequests.filter((r) => {
    if (tab === 'pending') return r.status === 'PENDING_MENTOR_RESPONSE';
    if (tab === 'accepted') return r.status === 'ACCEPTED';
    if (tab === 'rejected') return r.status === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yêu cầu đã gửi"
        description="Phía học viên: theo dõi phản hồi của Mentor với các yêu cầu bạn đã gửi, mở chat khi được chấp nhận"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentoring · Học viên', href: '/mentoring' },
          { label: 'Yêu cầu đã gửi' },
        ]}
        actions={
          <Button onClick={() => navigate('/mentoring')}>
            <Plus className="w-4 h-4 mr-1.5" /> Gửi yêu cầu mới
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">Tất cả ({allRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Chờ Mentor ({allRequests.filter((r) => r.status === 'PENDING_MENTOR_RESPONSE').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Được nhận ({allRequests.filter((r) => r.status === 'ACCEPTED').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Từ chối ({allRequests.filter((r) => r.status === 'REJECTED').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <QueryBoundary queries={[requestsQuery]}>
            {filteredRequests.length === 0 ? (
              <EmptyState
                title="Không có yêu cầu nào"
                description="Bạn chưa gửi yêu cầu Mentoring nào trong danh mục này."
                action={
                  <Button onClick={() => navigate('/mentoring')}>
                    Tìm Mentor ngay
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRequests.map((req) => (
                  <Card key={req.id} className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={req.status} domain="mentoring" />
                        <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <CardTitle className="text-base mt-2">{req.topic}</CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      <p className="text-xs text-[var(--text-muted)] line-clamp-3 bg-[var(--surface-muted)] p-2.5 rounded-md">
                        {req.content}
                      </p>

                      {req.rejectReason && (
                        <div className="p-2.5 rounded bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-xs text-[var(--status-danger-fg)] flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Lý do từ chối: {req.rejectReason}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Đã gửi tới Mentor:</span>
                        <UserMiniCard userId={req.mentorId} showMajor />
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 border-t border-[var(--border-subtle)] flex justify-end">
                      {req.status === 'ACCEPTED' ? (
                        <Button size="sm" onClick={() => navigate('/chats')}>
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Mở phòng trao đổi
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/mentoring/mentors/${req.mentorId}`)}
                        >
                          Xem hồ sơ Mentor
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyMentoringRequestsPage;
