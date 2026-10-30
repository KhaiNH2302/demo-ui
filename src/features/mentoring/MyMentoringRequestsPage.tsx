import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarClock, Check, Clock, MessageSquare, Plus, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMentorRequestActions } from '@/features/mentor/useMentorRequestActions';
import type { MentoringRequest } from '@/types/entities';
import { RequestPlanDetails } from './RequestPlanDetails';
import { MyNeedPosts } from './MyNeedPosts';
import { ClassesPanel } from './ClassesPanel';

type RequestTab = 'all' | 'pending' | 'accepted' | 'rejected' | 'classes' | 'posts';

const isRequestTab = (value: string | null): value is RequestTab =>
  value === 'all' || value === 'pending' || value === 'accepted' || value === 'rejected' || value === 'classes' || value === 'posts';

export const MyMentoringRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<RequestTab>(isRequestTab(initialTab) ? initialTab : 'all');
  const [rejectId, setRejectId] = useState<string | null>(null);

  const requestsQuery = useQuery({
    queryKey: ['mentoring', 'requests', 'me'],
    queryFn: () => apiClient.get<MentoringRequest[]>('/mentoring/requests/me'),
  });
  const { accept, reject } = useMentorRequestActions({ onRejected: () => setRejectId(null) });

  const requests = requestsQuery.data || [];
  const items = requests.filter((request) => {
    if (tab === 'pending') return request.status === 'PENDING_MENTOR_RESPONSE';
    if (tab === 'accepted') return request.status === 'ACCEPTED';
    if (tab === 'rejected') return request.status === 'REJECTED';
    return true;
  });

  const isIncoming = (request: MentoringRequest) =>
    Boolean(request.recipientId && request.recipientId === user?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yêu cầu Mentoring"
        description="Theo dõi yêu cầu đã gửi, phản hồi lời đề nghị từ Mentor và quản lý bài nhờ kèm của bạn."
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring', href: '/mentoring' }, { label: 'Yêu cầu' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/mentoring')}>Mở Mentoring Feed</Button>
            <Button onClick={() => navigate('/mentoring')}><Plus className="mr-1.5 h-4 w-4" /> Tạo kết nối mới</Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as RequestTab)}>
        <TabsList className="flex w-full max-w-3xl justify-start overflow-x-auto">
          <TabsTrigger value="all">Tất cả ({requests.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ phản hồi ({requests.filter((request) => request.status === 'PENDING_MENTOR_RESPONSE').length})</TabsTrigger>
          <TabsTrigger value="accepted">Đã kết nối ({requests.filter((request) => request.status === 'ACCEPTED').length})</TabsTrigger>
          <TabsTrigger value="rejected">Đã từ chối ({requests.filter((request) => request.status === 'REJECTED').length})</TabsTrigger>
          <TabsTrigger value="classes">Lớp học của tôi</TabsTrigger>
          <TabsTrigger value="posts">Bài nhờ kèm của tôi</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {tab === 'posts' && <MyNeedPosts requests={requests} onViewOffers={() => setTab('pending')} />}
          {tab === 'classes' && <ClassesPanel />}
          {tab !== 'posts' && tab !== 'classes' && (
          <QueryBoundary query={requestsQuery}>
            {items.length === 0 ? (
              <EmptyState
                title="Không có yêu cầu nào"
                description="Chưa có yêu cầu Mentoring trong danh mục này."
                action={<Button onClick={() => navigate('/mentoring')}>Bắt đầu kết nối</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {items.map((request) => {
                  const incoming = isIncoming(request);
                  const counterpartId = incoming
                    ? request.requesterId || request.mentorId
                    : request.recipientId || request.mentorId;
                  return (
                    <Card key={request.id} className="flex flex-col justify-between">
                      <CardHeader className="space-y-3 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={request.status} domain="mentoring" />
                            <Badge variant={incoming ? 'attention' : 'secondary'}>
                              {incoming ? 'Nhận được' : 'Đã gửi'}
                            </Badge>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <Clock className="h-3 w-3" /> {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <CardTitle className="text-base">{request.topic}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="line-clamp-3 rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">{request.content}</p>
                        <RequestPlanDetails request={request} />
                        {request.rejectReason && (
                          <div className="flex gap-1.5 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs text-rose-700">
                            <AlertCircle className="h-4 w-4 shrink-0" /> Lý do từ chối: {request.rejectReason}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" /> Hạn phản hồi: {request.deadline ? new Date(request.deadline).toLocaleDateString('vi-VN') : 'Chưa đặt'}
                          </span>
                          <Badge variant="outline">{request.sourceType === 'POST' ? 'Mentoring Feed' : 'Tìm trực tiếp'}</Badge>
                        </div>
                        <div className="border-t border-neutral-100 pt-3">
                          <p className="mb-1 text-xs text-neutral-500">{incoming ? 'Người gửi' : 'Người nhận'}</p>
                          <UserMiniCard userId={counterpartId} showMajor />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                        {incoming && request.status === 'PENDING_MENTOR_RESPONSE' ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setRejectId(request.id)}>
                              <X className="mr-1 h-3.5 w-3.5" /> Từ chối
                            </Button>
                            <Button size="sm" onClick={() => accept.mutate(request.id)} loading={accept.isPending && accept.variables === request.id}>
                              <Check className="mr-1 h-3.5 w-3.5" /> Chấp nhận
                            </Button>
                          </>
                        ) : request.status === 'ACCEPTED' ? (
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="text-xs text-neutral-600">Đã kết nối. Nhắn tin để chốt lịch buổi đầu.</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setTab('classes')}>
                                Lớp học
                              </Button>
                              <Button size="sm" onClick={() => navigate(`/chats?targetUser=${counterpartId}`)}>
                                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Nhắn tin
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => navigate(`/users/${counterpartId}`)}>Xem hồ sơ</Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </QueryBoundary>
          )}
        </TabsContent>
      </Tabs>

      <ReasonDialog
        open={Boolean(rejectId)}
        onOpenChange={() => setRejectId(null)}
        title="Từ chối yêu cầu Mentoring"
        description="Hệ thống sẽ thông báo kết quả trực tiếp cho bên gửi."
        label="Lý do từ chối (tùy chọn)"
        placeholder="Nhập lý do ngắn gọn..."
        onConfirm={(reason) => {
          if (!rejectId) return;
          reject.mutate({ id: rejectId, reason });
        }}
      />
    </div>
  );
};

export default MyMentoringRequestsPage;
