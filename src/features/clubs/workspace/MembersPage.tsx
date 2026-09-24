import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { toast } from '@/components/ui/Toast';
import { Users, MoreVertical, Shield, UserX, Award, CheckCircle } from 'lucide-react';
import type { ClubMembership, ClubRole } from '@/types/entities';

export const ClubMembersPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const queryClient = useQueryClient();
  const { user, getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');
  const isManager = role === 'manager';

  const [selectedMember, setSelectedMember] = useState<ClubMembership | null>(null);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState<ClubRole>('member');
  const [reasonAction, setReasonAction] = useState<'suspend' | 'leave' | null>(null);

  const membersQuery = useQuery({
    queryKey: queryKeys.clubs.members(clubId!),
    queryFn: () => apiClient.get<ClubMembership[]>(`/clubs/${clubId}/members`),
    enabled: !!clubId,
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: { role?: ClubRole; status?: any; reason?: string } }) =>
      apiClient.put(`/clubs/${clubId}/members/${userId}`, updates),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành viên thành công!');
      setIsChangeRoleOpen(false);
      setReasonAction(null);
      setSelectedMember(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.members(clubId!) });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Bạn không đủ quyền hạn thực hiện thao tác này';
      toast.error(msg);
    },
  });

  const handleRoleChange = () => {
    if (!selectedMember) return;
    updateMemberMutation.mutate({
      userId: selectedMember.userId,
      updates: { role: newRole },
    });
  };

  const handleStatusChangeWithReason = (reason: string) => {
    if (!selectedMember || !reasonAction) return;
    const targetStatus = reasonAction === 'suspend' ? 'Suspended' : 'Left';
    updateMemberMutation.mutate({
      userId: selectedMember.userId,
      updates: { status: targetStatus, reason },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách thành viên"
        description="Quản lý nhân sự, phân quyền vai trò và theo dõi điểm đóng góp hoạt động"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Workspace', href: `/clubs/${clubId}/workspace/overview` },
          { label: 'Thành viên' },
        ]}
      />

      <QueryBoundary queries={[membersQuery]}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {membersQuery.data?.map((m) => (
              <Card key={m.userId} className="flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={m.status} domain="clubs" />
                    {isManager && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(m);
                              setNewRole(m.role);
                              setIsChangeRoleOpen(true);
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" /> Đổi vai trò
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {m.status === 'Active' ? (
                            <DropdownMenuItem
                              className="text-[var(--status-attention-fg)]"
                              onClick={() => {
                                setSelectedMember(m);
                                setReasonAction('suspend');
                              }}
                            >
                              Tạm ngưng sinh hoạt
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-[var(--status-success-fg)]"
                              onClick={() => {
                                updateMemberMutation.mutate({
                                  userId: m.userId,
                                  updates: { status: 'Active' },
                                });
                              }}
                            >
                              Kích hoạt lại
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-[var(--status-danger-fg)]"
                            onClick={() => {
                              setSelectedMember(m);
                              setReasonAction('leave');
                            }}
                          >
                            <UserX className="w-4 h-4 mr-2" /> Ghi nhận rời CLB
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <UserMiniCard userId={m.userId} showMajor />

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold capitalize">
                        {m.role === 'manager'
                          ? 'Chủ nhiệm'
                          : m.role === 'treasurer'
                          ? 'Thủ quỹ'
                          : 'Thành viên'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--status-success-fg)] font-medium">
                      <Award className="w-3.5 h-3.5" />
                      <span>{m.contributionScore} điểm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </QueryBoundary>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay đổi vai trò thành viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-[var(--text-muted)]">
              Chọn vai trò phân quyền mới cho thành viên:
            </p>
            <FormField label="Vai trò mới" required>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as ClubRole)}
                options={[
                  { label: 'Thành viên (Member)', value: 'member' },
                  { label: 'Thủ quỹ (Treasurer)', value: 'treasurer' },
                  { label: 'Chủ nhiệm (Manager)', value: 'manager' },
                ]}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeRoleOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRoleChange} loading={updateMemberMutation.isPending}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Dialog for Suspend or Leave */}
      <ReasonDialog
        open={!!reasonAction}
        onOpenChange={() => setReasonAction(null)}
        title={reasonAction === 'suspend' ? 'Tạm ngưng sinh hoạt thành viên' : 'Ghi nhận rời câu lạc bộ'}
        description={
          reasonAction === 'suspend'
            ? 'Thành viên sẽ tạm thời bị khóa quyền truy cập kênh nội bộ.'
            : 'Xác nhận thành viên đã rời CLB.'
        }
        label="Lý do bắt buộc"
        placeholder="Nhập lý do thực hiện..."
        onConfirm={handleStatusChangeWithReason}
      />
    </div>
  );
};

export default ClubMembersPage;
