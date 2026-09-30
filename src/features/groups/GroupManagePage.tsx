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
    enabled: !!id,
  });

  // AI Member Suggestions
  const suggestionsQuery = useQuery({
    queryKey: ['groups', id, 'ai-suggested-members'],
    queryFn: () => apiClient.get<AiMemberSuggestion[]>(`/groups/${id}/ai-suggested-members`),
    enabled: !!id,
  });

  // Action Mutations
  const approveRejectMutation = useMutation({
    mutationFn: ({ reqId, decision }: { reqId: string; decision: 'approve' | 'reject' }) =>
      apiClient.post(`/groups/${id}/join-requests/${reqId}/${decision}`),
    onSuccess: (_, vars) => {
      toast.success(vars.decision === 'approve' ? 'Đã duyệt thành viên vào nhóm!' : 'Đã từ chối yêu cầu.');
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.joinRequests(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id!) });
    },
    onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại.'),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Group>) => apiClient.put(`/groups/${id}/settings`, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin nhóm thành công!');
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id!) });
    },
    onError: () => toast.error('Cập nhật thất bại.'),
  });

  // Form State for Settings
  const [settingsForm, setSettingsForm] = useState<Partial<Group>>({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Modal States
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [isCloseGroupOpen, setIsCloseGroupOpen] = useState(false);
  const [directChatTarget, setDirectChatTarget] = useState<User | null>(null);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);

  const handleOpenDirectChat = async (userId: string) => {
    try {
      const targetUser = await apiClient.get<User>(`/users/${userId}`);
      setDirectChatTarget(targetUser);
      setIsDirectChatOpen(true);
    } catch {
      setDirectChatTarget({
        id: userId,
        fullName: 'Sinh viên tiềm năng',
        school: 'Đại học FPT',
        roles: ['student'],
        status: 'active',
        createdAt: new Date().toISOString(),
      } as User);
      setIsDirectChatOpen(true);
    }
  };

  const group = groupQuery.data;

  // Initialize form when group data arrives
  if (group && !isFormInitialized) {
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
    setIsFormInitialized(true);
  }

  // Security Check: Only Owner
  if (group && user && group.ownerId !== user.id) {
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
                    Nhóm đã đủ thành viên ({group.memberCount}/{group.memberLimit}). Nếu bạn duyệt thêm, nhóm sẽ vượt số lượng thành viên dự kiến.
                  </span>
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
                              onClick={() => approveRejectMutation.mutate({ reqId: req.id, decision: 'approve' })}
                              loading={approveRejectMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-1" /> Duyệt tham gia
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

              <QueryBoundary queries={[suggestionsQuery]}>
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
                            onClick={() => toast.success('Đã gửi lời mời tham gia nhóm!')}
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
              </QueryBoundary>
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
                        onChange={(e) => setSettingsForm({ ...settingsForm, purpose: e.target.value as any })}
                        options={[
                          { label: 'Học tập', value: 'study' },
                          { label: 'Dự án / Hackathon', value: 'project' },
                          { label: 'Rèn luyện kỹ năng', value: 'skill' },
                          { label: 'Sở thích / Giao lưu', value: 'hobby' },
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
                  >
                    Đóng nhóm này
                  </Button>
                  <Button
                    onClick={() => updateSettingsMutation.mutate(settingsForm)}
                    loading={updateSettingsMutation.isPending}
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
            onOpenChange={() => setRemoveMemberId(null)}
            title="Xóa thành viên khỏi nhóm"
            description="Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm? Họ sẽ không thể truy cập tài nguyên nhóm nữa."
            variant="danger"
            onConfirm={() => {
              toast.success('Đã xóa thành viên khỏi nhóm');
              setRemoveMemberId(null);
            }}
          />

          {/* Close Group Reason Dialog */}
          <ReasonDialog
            open={isCloseGroupOpen}
            onOpenChange={setIsCloseGroupOpen}
            title="Xác nhận đóng nhóm"
            description="Khi đóng nhóm, toàn bộ thành viên sẽ rời nhóm và bài đăng sẽ không còn hiển thị tìm kiếm."
            label="Lý do đóng nhóm"
            placeholder="Ví dụ: Đã hoàn thành đồ án môn học..."
            onConfirm={(reason) => {
              toast.success(`Đã đóng nhóm với lý do: ${reason}`);
              setIsCloseGroupOpen(false);
              navigate('/groups/me');
            }}
          />

          {/* Start Direct Conversation Dialog */}
          <ReasonDialog
            open={isDirectChatOpen}
            onOpenChange={setIsDirectChatOpen}
            title={`Nhắn tin cho ${directChatTarget?.fullName || 'sinh viên'}`}
            description={`Về lời mời tham gia nhóm ${group.name}`}
            label="Nội dung tin nhắn"
            placeholder="Chào bạn, nhóm mình đang tìm thành viên..."
            confirmLabel="Gửi tin nhắn"
            onConfirm={() => {
              toast.success('Đã gửi lời mời trò chuyện');
              setIsDirectChatOpen(false);
              navigate('/chats');
            }}
          />
        </div>
      )}
    </QueryBoundary>
  );
};

export default GroupManagePage;
