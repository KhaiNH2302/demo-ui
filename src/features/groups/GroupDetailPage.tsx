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
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
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
  Target,
  MapPin,
  Briefcase,
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

  const [openingChat, setOpeningChat] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [appliedRole, setAppliedRole] = useState('');
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

  const handleOpenChat = async () => {
    try {
      setOpeningChat(true);
      const conv = await apiClient.post<Conversation>(`/groups/${id}/conversation`);
      navigate(`/chats/${conv.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Không thể mở kênh chat.');
    } finally {
      setOpeningChat(false);
    }
  };

  const joinMutation = useMutation({
    mutationFn: ({ message, role }: { message?: string; role?: string }) =>
      apiClient.post(`/groups/${id}/join-requests`, { message, appliedRole: role }),
    onSuccess: (res: any) => {
      if (res?.joined) {
        toast.success('Tham gia nhóm thành công!');
      } else {
        toast.success('Đã gửi yêu cầu tham gia nhóm!');
      }
      setIsJoinDialogOpen(false);
      setJoinMessage('');
      setAppliedRole('');
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
      invalidateGroupQueries(queryClient);
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể rời nhóm.'),
  });

  const myRequests = myRequestsQuery.data || [];
  const myPendingRequest = myRequests.find((r) => r.groupId === id && r.status === 'Pending');

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
              isMember ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={handleOpenChat}
                    loading={openingChat}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Kênh chat nội bộ
                  </Button>
                  {isOwner && (
                    <Button variant="outline" onClick={() => navigate(`/groups/${id}/manage`)}>
                      <Settings className="w-4 h-4 mr-2" /> Quản lý nhóm
                    </Button>
                  )}
                </div>
              ) : null
            }
          />

          {/* CoverHeader with AvatarStack & Status Badges */}
          <CoverHeader
            title={group.name}
            subtitle={`Mục tiêu: ${group.purpose} • ${group.topic}`}
            badge={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tier={isFull ? 'danger' : 'neutral'}>
                  <Users className="w-3.5 h-3.5 mr-1 inline" />
                  {group.memberCount}/{group.memberLimit} thành viên
                </Badge>
                {group.targetGoal && (
                  <Badge tier="attention">
                    <Target className="w-3.5 h-3.5 mr-1 inline" /> {group.targetGoal}
                  </Badge>
                )}
                {group.campus && (
                  <Badge tier="neutral">
                    <MapPin className="w-3.5 h-3.5 mr-1 inline" /> {group.campus}
                  </Badge>
                )}
                <Badge tier="brand">
                  {group.joinMode === 'direct' ? 'Tham gia trực tiếp' : 'Cần xét duyệt'}
                </Badge>
                {isClosed && <Badge tier="danger">Nhóm đã đóng</Badge>}
              </div>
            }
            actions={
              <div className="flex items-center gap-2.5">
                {isMember && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenChat}
                    loading={openingChat}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-brand-600" /> Kênh chat nội bộ
                  </Button>
                )}
                <AvatarStack
                  users={group.members?.map((m) => ({ name: m.userId })) || [{ name: group.name }]}
                  max={4}
                  size="sm"
                />
              </div>
            }
          />

          {/* Main Group Content Card */}
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Owner Info & Location */}
              <div className="p-4 rounded-lg bg-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[var(--text-muted)] block mb-1">Trưởng nhóm sáng lập:</span>
                  <UserMiniCard userId={group.ownerId} showMajor />
                </div>
                {group.location && (
                  <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>{group.location}</span>
                  </div>
                )}
              </div>

              {/* Role Matrix: Roles Needed vs Filled */}
              {group.rolesNeeded && group.rolesNeeded.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-primary" /> Vị trí nhóm đang cần tuyển & Đã có
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.rolesNeeded.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300"
                      >
                        🔍 Cần tuyển: {role}
                      </span>
                    ))}
                    {group.rolesFilled?.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200"
                      >
                        ✓ Đã có: {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills required */}
              {group.skills && group.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Kỹ năng & Yêu cầu mong muốn
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
                    <Clock className="w-4 h-4 text-primary" /> Khung giờ sinh hoạt / Họp nhóm
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
                    <BookOpen className="w-4 h-4 text-primary" /> Mô tả & Cam kết làm việc
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenChat}
                    loading={openingChat}
                  >
                    <MessageSquare className="w-4 h-4 mr-1.5" /> Mở kênh chat nội bộ
                  </Button>
                  <Button onClick={() => navigate(`/groups/${id}/manage`)}>
                    <Settings className="w-4 h-4 mr-2" /> Vào trang quản lý nhóm
                  </Button>
                </div>
              ) : isMember ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                  <span className="flex items-center text-sm text-[var(--status-success-fg)] font-medium">
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Bạn đã là thành viên chính thức của nhóm
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOpenChat}
                      loading={openingChat}
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" /> Mở kênh chat nội bộ
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLeaveOpen(true)}>
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Rời nhóm
                    </Button>
                  </div>
                </div>
              ) : myPendingRequest ? (
                <Button disabled variant="secondary">
                  <Clock className="w-4 h-4 mr-2" /> Đang chờ trưởng nhóm xét duyệt
                </Button>
              ) : isFull ? (
                <Button disabled variant="outline">
                  Nhóm đã đủ thành viên
                </Button>
              ) : group.joinMode === 'direct' ? (
                <Button onClick={() => joinMutation.mutate({})} loading={joinMutation.isPending}>
                  <UserPlus className="w-4 h-4 mr-2" /> Tham gia ngay
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setAppliedRole(group.rolesNeeded?.[0] || '');
                    setIsJoinDialogOpen(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Gửi yêu cầu tham gia
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Leave Group Dialog */}
          <ConfirmDialog
            open={leaveOpen}
            onOpenChange={leaveDialog.changeOpen}
            title="Rời nhóm"
            description="Bạn sẽ không còn quyền truy cập chat nhóm sau khi rời."
            loading={leaveMutation.isPending}
            onConfirm={() => leaveDialog.submit(() => leaveMutation.mutateAsync())}
          />

          {/* Join Group Dialog */}
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gửi yêu cầu tham gia nhóm {group.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {group.rolesNeeded && group.rolesNeeded.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-800">
                      Chọn vị trí bạn muốn đảm nhận:
                    </label>
                    <Select
                      options={group.rolesNeeded.map((r) => ({ value: r, label: r }))}
                      value={appliedRole}
                      onValueChange={setAppliedRole}
                    />
                  </div>
                )}
                <p className="text-xs text-[var(--text-muted)]">
                  Hãy viết lời giới thiệu ngắn về kỹ năng, kinh nghiệm và cam kết tiến độ:
                </p>
                <Textarea
                  placeholder="Ví dụ: Chào bạn, mình có kinh nghiệm làm React và muốn cùng làm phần Frontend. Mình cam kết tham gia họp đầy đủ..."
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
                  onClick={() => joinMutation.mutate({ message: joinMessage, role: appliedRole })}
                  loading={joinMutation.isPending}
                >
                  Xác nhận gửi đơn
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
