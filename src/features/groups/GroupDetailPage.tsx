import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { invalidateGroupQueries } from './groupQueries';
import { createGroupDialogAction } from './groupDialog';
import { CoverHeader } from '@/components/shared/CoverHeader';
import { AvatarStack } from '@/components/shared/AvatarStack';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { ChatWindow } from '@/components/shared/ChatWindow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import {
  Users,
  Clock,
  BookOpen,
  Sparkles,
  Settings,
  UserPlus,
  LogOut,
  CheckCircle,
  MessageSquare,
  Info,
} from 'lucide-react';
import type { Group, GroupMember, GroupJoinRequest, Conversation } from '@/types/entities';

interface GroupDetailData extends Group {
  members: (GroupMember & { user?: any })[];
  status?: 'Active' | 'Closed';
  closedReason?: string;
}

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveDialog] = useState(() => createGroupDialogAction(setLeaveOpen));

  const groupQuery = useQuery({
    queryKey: queryKeys.groups.detail(id!),
    queryFn: () => apiClient.get<GroupDetailData>(`/groups/${id}`),
    enabled: !!id,
  });

  const myRequestsQuery = useQuery({
    queryKey: queryKeys.groups.myJoinRequests,
    queryFn: () => apiClient.get<GroupJoinRequest[]>('/join-requests/mine'),
    enabled: !!user,
  });

  const group = groupQuery.data;
  const isOwner = !!user && user.id === group?.ownerId;
  const isClosed = group?.status === 'Closed';
  const isMember = !!user && !isClosed && (isOwner || !!group?.members?.some((member) => member.userId === user.id));
  const groupConversationQuery = useQuery<Conversation>({
    queryKey: ['chat', 'group', id],
    queryFn: () => apiClient.post<Conversation>(`/groups/${id}/conversation`),
    enabled: !!id && isMember && activeTab === 'chat',
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
      invalidateGroupQueries(queryClient);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gửi yêu cầu thất bại, vui lòng thử lại.');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiClient.post(`/groups/${id}/leave`),
    onSuccess: () => {
      toast.success('Bạn đã rời nhóm.');
      setLeaveOpen(false);
      setActiveTab('info');
      invalidateGroupQueries(queryClient);
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể rời nhóm.'),
  });
  const myRequests = myRequestsQuery.data || [];
  const myPendingRequest = myRequests.find((r) => r.groupId === id && r.status === 'Pending');

  const isFull = group ? group.memberCount >= group.memberLimit : false;

  const tabOptions = [
    { value: 'info', label: 'Thông tin', icon: Info },
    ...(isMember ? [{ value: 'chat', label: 'Chat nhóm', icon: MessageSquare }] : []),
  ];

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

          {/* CoverHeader with AvatarStack & Status Badges */}
          <CoverHeader
            title={group.name}
            subtitle={`Mục tiêu: ${group.purpose} • ${group.topic}`}
            badge={
              <div className="flex items-center gap-2">
                <Badge tier={isFull ? 'danger' : 'neutral'}>
                  <Users className="w-3.5 h-3.5 mr-1 inline" />
                  {group.memberCount}/{group.memberLimit} thành viên
                </Badge>
                <Badge tier="brand">
                  {group.joinMode === 'direct' ? 'Tham gia trực tiếp' : 'Cần duyệt'}
                </Badge>
                {isClosed && <Badge tier="danger">Nhóm đã đóng</Badge>}
              </div>
            }
            actions={
              <div className="flex items-center gap-2">
                <AvatarStack
                  users={group.members?.map((m) => ({ name: m.userId })) || [{ name: group.name }]}
                  max={4}
                  size="sm"
                />
              </div>
            }
          />

          {/* Segmented Control Tabs */}
          {isMember && (
            <div className="flex items-center justify-start pb-1">
              <SegmentedControl
                options={tabOptions}
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as 'info' | 'chat')}
                size="md"
              />
            </div>
          )}

          {/* Content Area */}
          {activeTab === 'chat' && isMember ? (
            <div className="h-[520px]">
              <QueryBoundary query={groupConversationQuery}>
                {groupConversationQuery.data && (
                  <ChatWindow conversationId={groupConversationQuery.data.id} conversation={groupConversationQuery.data} />
                )}
              </QueryBoundary>
            </div>
          ) : (
            <Card>
              <CardContent className="space-y-6 pt-6">
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
                    <Users className="w-4 h-4 text-primary" /> Danh sách thành viên ({group.members?.length || 0})
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
                {isClosed ? (
                  <span className="text-sm text-neutral-500">Nhóm đã đóng{group.closedReason ? `: ${group.closedReason}` : '.'}</span>
                ) : isOwner ? (
                  <Button onClick={() => navigate(`/groups/${id}/manage`)}>
                    <Settings className="w-4 h-4 mr-2" /> Vào trang quản lý nhóm
                  </Button>
                ) : isMember ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center text-sm text-[var(--status-success-fg)] font-medium">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Bạn đã là thành viên của nhóm
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setLeaveOpen(true)}>
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
          )}

          {/* Join Group Dialog */}
          <ConfirmDialog
            open={leaveOpen}
            onOpenChange={leaveDialog.changeOpen}
            title="Rời nhóm"
            description="Bạn sẽ không còn quyền truy cập chat nhóm sau khi rời."
            loading={leaveMutation.isPending}
            onConfirm={() => leaveDialog.submit(() => leaveMutation.mutateAsync())}
          />
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
