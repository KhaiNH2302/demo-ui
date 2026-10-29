import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { AIResultCard } from '@/components/shared/AIResultCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { toast } from '@/components/ui/Toast';
import { invalidateGroupQueries } from './groupQueries';
import { createGroupDialogAction } from './groupDialog';
import {
  Users,
  UserPlus,
  Sparkles,
  Settings,
  AlertTriangle,
  Check,
  X,
  Trash2,
  MessageSquare,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type { Group, GroupMember, GroupJoinRequest, AiMemberSuggestion, User } from '@/types/entities';

interface GroupDetailData extends Group {
  members: GroupMember[];
  status?: 'Active' | 'Closed';
}

export const GroupManagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const currentTab = searchParams.get('tab') || 'requests';

  // Group Details
  const groupQuery = useQuery({
    queryKey: queryKeys.groups.detail(id!),
    queryFn: () => apiClient.get<GroupDetailData>(`/groups/${id}`),
    enabled: !!id,
  });

  // Join Requests
  const requestsQuery = useQuery({
    queryKey: queryKeys.groups.joinRequests(id!),
    queryFn: () => apiClient.get<GroupJoinRequest[]>(`/groups/${id}/join-requests`),
    enabled: !!id && !!user && groupQuery.data?.ownerId === user.id,
  });

  // AI Member Suggestions
  const suggestionsQuery = useQuery({
    queryKey: queryKeys.groups.suggestedMembers(id!),
    queryFn: () => apiClient.get<AiMemberSuggestion[]>(`/groups/${id}/ai-suggested-members`),
    enabled: !!id && !!user && groupQuery.data?.ownerId === user.id && groupQuery.data?.status !== 'Closed',
  });

  // Action Mutations
  const approveRejectMutation = useMutation({
    mutationFn: ({ reqId, decision }: { reqId: string; decision: 'approve' | 'reject' }) =>
      apiClient.post(`/groups/${id}/join-requests/${reqId}/${decision}`),
    onSuccess: (_, vars) => {
      toast.success(vars.decision === 'approve' ? 'Đã duyệt thành viên vào nhóm!' : 'Đã từ chối yêu cầu.');
      invalidateGroupQueries(queryClient);
    },
    onError: (error: Error) => toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại.'),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Group>) => apiClient.put(`/groups/${id}/settings`, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin nhóm thành công!');
      invalidateGroupQueries(queryClient);
    },
    onError: (error: Error) => toast.error(error.message || 'Cập nhật thất bại.'),
  });

  const inviteMutation = useMutation({
    mutationFn: (userId: string) => apiClient.post(`/groups/${id}/invitations`, { userId }),
    onSuccess: () => { toast.success('Đã gửi lời mời tham gia nhóm.'); invalidateGroupQueries(queryClient); },
    onError: (error: Error) => toast.error(error.message || 'Không thể gửi lời mời.'),
  });
  const removeMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/groups/${id}/members/${userId}`),
    onSuccess: () => { toast.success('Đã xóa thành viên khỏi nhóm.'); setRemoveMemberId(null); invalidateGroupQueries(queryClient); },
    onError: (error: Error) => toast.error(error.message || 'Không thể xóa thành viên.'),
  });
  const closeMutation = useMutation({
    mutationFn: (reason: string) => apiClient.post(`/groups/${id}/close`, { reason }),
    onSuccess: async () => { toast.success('Đã đóng nhóm.'); setIsCloseGroupOpen(false); await invalidateGroupQueries(queryClient); navigate('/groups/me'); },
    onError: (error: Error) => toast.error(error.message || 'Không thể đóng nhóm.'),
  });
  const messageInvitationMutation = useMutation({
    mutationFn: (message: string) => apiClient.post<{ id: string }>(`/groups/${id}/message-invitations`, { userId: directChatTarget?.id, message }),
    onSuccess: async (conversation) => { toast.success('Đã gửi tin nhắn mời trò chuyện.'); setIsDirectChatOpen(false); await invalidateGroupQueries(queryClient); navigate(`/chats/${conversation.id}`); },
    onError: (error: Error) => toast.error(error.message || 'Không thể gửi lời mời trò chuyện.'),
  });

  // Form State for Settings
  const [settingsForm, setSettingsForm] = useState<Partial<Group>>({});
  const [initializedGroupId, setInitializedGroupId] = useState<string | null>(null);

  // Modal States
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [isCloseGroupOpen, setIsCloseGroupOpen] = useState(false);
  const [directChatTarget, setDirectChatTarget] = useState<User | null>(null);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);
  const [removeDialog] = useState(() => createGroupDialogAction((open) => { if (!open) setRemoveMemberId(null); }));
  const [closeDialog] = useState(() => createGroupDialogAction(setIsCloseGroupOpen));
  const [messageDialog] = useState(() => createGroupDialogAction(setIsDirectChatOpen));

  const handleOpenDirectChat = async (userId: string) => {
    try {
      const targetUser = await apiClient.get<User>(`/users/${userId}`);
      setDirectChatTarget(targetUser);
      setIsDirectChatOpen(true);
    } catch {
      toast.error('Không thể tải thông tin sinh viên.');
    }
  };

  const group = groupQuery.data;

  // Initialize form when group data arrives
  if (group && initializedGroupId !== group.id) {
    setSettingsForm({
      name: group.name,
      purpose: group.purpose,
      topic: group.topic,
      skills: group.skills,
      activityTime: group.activityTime,
      interests: group.interests,
      joinMode: group.joinMode,
      memberLimit: group.memberLimit,
    });
    setInitializedGroupId(group.id);
  }

  // Security Check: Only Owner
  if (group && group.ownerId !== user?.id) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-[var(--status-danger-fg)] mx-auto" />
        <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Bạn không phải trưởng nhóm của nhóm này nên không thể xem trang quản lý.
        </p>
        <Button onClick={() => navigate(`/groups/${id}`)}>Quay lại nhóm</Button>
      </div>
    );
  }

  const isFull = group ? group.memberCount >= group.memberLimit : false;
  const isClosed = group?.status === 'Closed';

  return (
    <QueryBoundary queries={[groupQuery]}>
      {group && (
        <div className="space-y-6">
          <PageHeader
            title={`Quản lý: ${group.name}`}
            description={`Chế độ tham gia: ${group.joinMode === 'direct' ? 'Trực tiếp' : 'Xét duyệt'} • Sức chứa: ${group.memberCount}/${group.memberLimit}`}
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Tìm nhóm', href: '/groups' },
              { label: group.name, href: `/groups/${id}` },
              { label: 'Quản lý' },
            ]}
          />

          {isClosed && <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">Nhóm đã đóng. Danh sách thành viên và chat nhóm đã ngừng hoạt động.</div>}

          <Tabs
            value={currentTab}
            onValueChange={(v) => setSearchParams({ tab: v })}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="requests">
                Yêu cầu duyệt ({requestsQuery.data?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="members">
                Thành viên ({group.memberCount}/{group.memberLimit})
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                Gợi ý AI
              </TabsTrigger>
              <TabsTrigger value="settings">
                Cài đặt nhóm
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: JOIN REQUESTS */}
            <TabsContent value="requests" className="mt-6 space-y-4">
              {isFull && (
                <div className="p-3 bg-[var(--status-attention-bg)] border border-[var(--status-attention-border)] rounded-lg text-sm text-[var(--status-attention-fg)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Nhóm đã đủ thành viên ({group.memberCount}/{group.memberLimit}). Tăng sức chứa hoặc xóa thành viên trước khi duyệt thêm.
                  </span>
                </div>
              )}

              {isFull && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">🎉 Nhóm đã đủ thành viên ({group.memberCount}/{group.memberLimit})</h4>
                      <p className="text-xs text-emerald-800">
                        Hệ thống đã tự động khóa tuyển thành viên mới và kích hoạt kênh Chat nhóm.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/chats`)}
                    leftIcon={<MessageSquare size={14} />}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Mở kênh Chat nhóm
                  </Button>
                </div>
              )}

              <QueryBoundary queries={[requestsQuery]}>
                {requestsQuery.data && requestsQuery.data.length === 0 ? (
                  <EmptyState
                    title="Không có yêu cầu chờ duyệt"
                    description="Hiện tại không có sinh viên nào đang gửi yêu cầu tham gia."
                  />
                ) : (
                  <div className="space-y-3">
                    {requestsQuery.data?.map((req) => (
                      <Card key={req.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <UserMiniCard userId={req.userId} showMajor />
                            {req.message && (
                              <p className="text-sm bg-[var(--surface-muted)] p-2.5 rounded-md text-[var(--text-main)] italic">
                                "{req.message}"
                              </p>
                            )}
                            <span className="text-xs text-[var(--text-muted)] block">
                              Gửi lúc: {new Date(req.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveRejectMutation.mutate({ reqId: req.id, decision: 'reject' })}
                              loading={approveRejectMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1 text-[var(--status-danger-fg)]" /> Từ chối
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => approveRejectMutation.mutate({ reqId: req.id, decision: 'approve' })}
                              disabled={isFull || isClosed}
                              loading={approveRejectMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-1" /> Chấp nhận
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </QueryBoundary>
            </TabsContent>

            {/* TAB 2: MEMBERS */}
            <TabsContent value="members" className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Sức chứa nhóm</h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Đã có {group.memberCount} trên tổng số {group.memberLimit} thành viên tối đa
                    </p>
                  </div>
                </div>
                <Badge variant={isFull ? 'danger' : 'neutral'}>
                  {group.memberCount}/{group.memberLimit} thành viên
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.members?.map((m) => (
                  <Card key={m.userId}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <UserMiniCard userId={m.userId} showMajor />
                      <div className="flex items-center gap-2">
                        {m.role === 'owner' ? (
                          <Badge variant="attention">Trưởng nhóm</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)]"
                            onClick={() => setRemoveMemberId(m.userId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 3: AI SUGGESTIONS */}
            <TabsContent value="suggestions" className="mt-6 space-y-4">
              <div className="p-4 bg-[var(--status-pending-bg)] border border-[var(--status-pending-border)] rounded-lg text-sm text-[var(--status-pending-fg)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>
                  Hệ thống AI phân tích hồ sơ sinh viên có kỹ năng và lịch rảnh tương thích nhất với yêu cầu của nhóm bạn.
                </span>
              </div>

              {isClosed ? <EmptyState title="Nhóm đã đóng" description="Không thể mời thêm thành viên vào nhóm đã đóng." /> : <QueryBoundary queries={[suggestionsQuery]}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestionsQuery.data?.map((sug) => (
                    <AIResultCard
                      key={sug.userId}
                      score={sug.score}
                      reasons={sug.reasons}
                    >
                      <div className="space-y-4 pt-2">
                        <UserMiniCard userId={sug.userId} showMajor />
                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => inviteMutation.mutate(sug.userId)}
                            loading={inviteMutation.isPending && inviteMutation.variables === sug.userId}
                            disabled={isFull || isClosed || inviteMutation.isPending}
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Mời vào nhóm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Nhắn tin trực tiếp"
                            onClick={() => handleOpenDirectChat(sug.userId)}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </AIResultCard>
                  ))}
                </div>
              </QueryBoundary>}
            </TabsContent>

            {/* TAB 4: SETTINGS */}
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chỉnh sửa thông tin nhóm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Tên nhóm" required>
                    <Input
                      value={settingsForm.name || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Mục đích" required>
                      <Select
                        value={settingsForm.purpose}
                        onValueChange={(purpose) => setSettingsForm({ ...settingsForm, purpose })}
                        options={[
                          { label: 'Học tập', value: 'Học tập' },
                          { label: 'Dự án / Hackathon', value: 'Dự án' },
                          { label: 'Rèn luyện kỹ năng', value: 'Kỹ năng' },
                          { label: 'Sở thích / Giao lưu', value: 'Sở thích' },
                        ]}
                      />
                    </FormField>

                    <FormField label="Chủ đề / Đề tài">
                      <Input
                        value={settingsForm.topic || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, topic: e.target.value })}
                      />
                    </FormField>
                  </div>

                  <FormField label="Kỹ năng cần thiết">
                    <TagInput
                      tags={settingsForm.skills || []}
                      onChange={(tags) => setSettingsForm({ ...settingsForm, skills: tags })}
                      placeholder="Nhập kỹ năng rồi bấm Enter..."
                    />
                  </FormField>

                  <FormField label="Khung giờ sinh hoạt">
                    <ScheduleInput
                      value={settingsForm.activityTime || []}
                      onChange={(slots) => setSettingsForm({ ...settingsForm, activityTime: slots })}
                    />
                  </FormField>

                  <FormField label="Mô tả / Yêu cầu chi tiết">
                    <Textarea
                      rows={3}
                      value={settingsForm.interests || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, interests: e.target.value })}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField label="Chế độ tham gia">
                      <RadioGroup
                        name="joinMode"
                        value={settingsForm.joinMode || 'approval'}
                        onChange={(val) => setSettingsForm({ ...settingsForm, joinMode: val as any })}
                        options={[
                          { label: 'Cần phê duyệt (Khuyến nghị)', value: 'approval' },
                          { label: 'Tham gia trực tiếp', value: 'direct' },
                        ]}
                      />
                    </FormField>

                    <FormField label="Số lượng thành viên tối đa">
                      <Input
                        type="number"
                        min={2}
                        max={30}
                        value={settingsForm.memberLimit || 5}
                        onChange={(e) => setSettingsForm({ ...settingsForm, memberLimit: Number(e.target.value) })}
                      />
                    </FormField>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsCloseGroupOpen(true)}
                    disabled={isClosed}
                  >
                    Đóng nhóm này
                  </Button>
                  <Button
                    onClick={() => updateSettingsMutation.mutate(settingsForm)}
                    loading={updateSettingsMutation.isPending}
                    disabled={isClosed}
                  >
                    Lưu thay đổi
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Remove Member Dialog */}
          <ConfirmDialog
            open={!!removeMemberId}
            onOpenChange={removeDialog.changeOpen}
            title="Xóa thành viên khỏi nhóm"
            description="Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm? Họ sẽ không thể truy cập tài nguyên nhóm nữa."
            variant="danger"
            loading={removeMutation.isPending}
            onConfirm={() => removeDialog.submit(() => removeMutation.mutateAsync(removeMemberId!))}
          />

          {/* Close Group Reason Dialog */}
          <ReasonDialog
            open={isCloseGroupOpen}
            onOpenChange={closeDialog.changeOpen}
            title="Xác nhận đóng nhóm"
            description="Khi đóng nhóm, toàn bộ thành viên sẽ rời nhóm và bài đăng sẽ không còn hiển thị tìm kiếm."
            label="Lý do đóng nhóm"
            placeholder="Ví dụ: Đã hoàn thành đồ án môn học..."
            loading={closeMutation.isPending}
            onConfirm={(reason) => closeDialog.submit(() => closeMutation.mutateAsync(reason))}
          />

          {/* Start Direct Conversation Dialog */}
          <ReasonDialog
            open={isDirectChatOpen}
            onOpenChange={messageDialog.changeOpen}
            title={`Nhắn tin cho ${directChatTarget?.fullName || 'sinh viên'}`}
            description={`Về lời mời tham gia nhóm ${group.name}`}
            label="Nội dung tin nhắn"
            placeholder="Chào bạn, nhóm mình đang tìm thành viên..."
            confirmLabel="Gửi tin nhắn"
            loading={messageInvitationMutation.isPending}
            onConfirm={(message) => messageDialog.submit(() => messageInvitationMutation.mutateAsync(message))}
          />
        </div>
      )}
    </QueryBoundary>
  );
};

export default GroupManagePage;
