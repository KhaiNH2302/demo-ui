import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { Users, Clock, BookOpen, Sparkles, Settings, UserPlus, LogOut, CheckCircle } from 'lucide-react';
import type { Group, GroupMember, GroupJoinRequest } from '@/types/entities';

interface GroupDetailData extends Group {
  members: (GroupMember & { user?: any })[];
}

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  const groupQuery = useQuery({
    queryKey: queryKeys.groups.detail(id!),
    queryFn: () => apiClient.get<GroupDetailData>(`/groups/${id}`),
    enabled: !!id,
  });

  const myRequestsQuery = useQuery({
    queryKey: ['join-requests', 'mine'],
    queryFn: () => apiClient.get<GroupJoinRequest[]>('/join-requests/mine'),
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: (message?: string) => apiClient.post(`/groups/${id}/join-requests`, { message }),
    onSuccess: (res: any) => {
      if (res?.joined) {
        toast.success('Tham gia nhóm thành công!');
      } else {
        toast.success('Đã gửi yêu cầu tham gia nhóm!');
      }
      setIsJoinDialogOpen(false);
      setJoinMessage('');
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id!) });
      queryClient.invalidateQueries({ queryKey: ['join-requests', 'mine'] });
    },
    onError: () => {
      toast.error('Gửi yêu cầu thất bại, vui lòng thử lại.');
    },
  });

  const group = groupQuery.data;
  const myRequests = myRequestsQuery.data || [];
  const myPendingRequest = myRequests.find((r) => r.groupId === id && r.status === 'Pending');

  const isOwner = user?.id === group?.ownerId;
  const isMember = isOwner || group?.members?.some((m) => m.userId === user?.id);
  const isFull = group ? group.memberCount >= group.memberLimit : false;

  return (
    <QueryBoundary queries={[groupQuery]}>
      {group && (
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            title={group.name}
            description={`Chủ đề: ${group.topic || 'Chung'}`}
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tìm nhóm', href: '/groups' },
              { label: group.name },
            ]}
            actions={
              isOwner ? (
                <Button onClick={() => navigate(`/groups/${id}/manage`)}>
                  <Settings className="w-4 h-4 mr-2" /> Quản lý nhóm
                </Button>
              ) : null
            }
          />

          {/* Group Overview Card */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {group.purpose === 'study'
                      ? 'Học tập'
                      : group.purpose === 'project'
                      ? 'Dự án'
                      : group.purpose === 'skill'
                      ? 'Kỹ năng'
                      : 'Sở thích'}
                  </Badge>
                  <Badge variant={isFull ? 'danger' : 'neutral'} className="text-sm">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    {group.memberCount}/{group.memberLimit} thành viên
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {group.joinMode === 'direct' ? 'Tham gia trực tiếp' : 'Xét duyệt yêu cầu'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Owner Info */}
              <div className="p-4 rounded-lg bg-[var(--surface-muted)] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--text-muted)] block mb-1">Trưởng nhóm:</span>
                  <UserMiniCard userId={group.ownerId} showMajor />
                </div>
              </div>

              {/* Skills required */}
              {group.skills && group.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Kỹ năng cần tìm
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill, idx) => (
                      <Badge key={idx} variant="neutral">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Time */}
              {group.activityTime && group.activityTime.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" /> Khung giờ sinh hoạt
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.activityTime.map((slot: any, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs rounded bg-[var(--surface-sunken)] text-[var(--text-muted)] font-mono"
                      >
                        {typeof slot === 'string' ? slot : `${slot.day}: ${slot.start}-${slot.end}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests & Description */}
              {group.interests && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" /> Mục tiêu & Yêu cầu cụ thể
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] whitespace-pre-line bg-[var(--surface-card)] p-3 rounded-md border border-[var(--border-subtle)]">
                    {group.interests}
                  </p>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Danh sách thành viên ({group.members?.length || 1})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {group.members?.map((m) => (
                    <div key={m.userId} className="p-3 border border-[var(--border-subtle)] rounded-lg flex items-center justify-between">
                      <UserMiniCard userId={m.userId} />
                      {m.role === 'owner' && <Badge variant="attention">Chủ nhóm</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
              {isOwner ? (
                <Button onClick={() => navigate(`/groups/${id}/manage`)}>
                  <Settings className="w-4 h-4 mr-2" /> Vào trang quản lý nhóm
                </Button>
              ) : isMember ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center text-sm text-[var(--status-success-fg)] font-medium">
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Bạn đã là thành viên của nhóm
                  </span>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Đã gửi yêu cầu rời nhóm')}>
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Rời nhóm
                  </Button>
                </div>
              ) : myPendingRequest ? (
                <Button disabled variant="secondary">
                  <Clock className="w-4 h-4 mr-2" /> Đang chờ duyệt yêu cầu
                </Button>
              ) : isFull ? (
                <Button disabled variant="outline">
                  Nhóm đã đủ thành viên
                </Button>
              ) : group.joinMode === 'direct' ? (
                <Button onClick={() => joinMutation.mutate()} loading={joinMutation.isPending}>
                  <UserPlus className="w-4 h-4 mr-2" /> Tham gia ngay
                </Button>
              ) : (
                <Button onClick={() => setIsJoinDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" /> Gửi yêu cầu tham gia
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Join Group Dialog */}
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gửi yêu cầu tham gia nhóm {group.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-[var(--text-muted)]">
                  Hãy viết lời giới thiệu ngắn về bản thân, kỹ năng hoặc lý do bạn muốn đồng hành cùng nhóm:
                </p>
                <Textarea
                  placeholder="Ví dụ: Chào bạn, mình có kinh nghiệm làm React 1 năm và rất hào hứng với đề tài này..."
                  rows={4}
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={() => joinMutation.mutate(joinMessage)}
                  loading={joinMutation.isPending}
                >
                  Xác nhận gửi
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </QueryBoundary>
  );
};

export default GroupDetailPage;
