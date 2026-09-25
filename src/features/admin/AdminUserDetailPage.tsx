import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { Shield, Lock, Unlock, AlertTriangle, History, ArrowLeft } from 'lucide-react';
import type { User, ViolationReport, AuditLog } from '@/types/entities';

interface UserDetailResponse {
  user: User;
  reports: ViolationReport[];
  auditLogs: AuditLog[];
}

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reasonAction, setReasonAction] = useState<'lock' | 'unlock' | 'restrict' | null>(null);

  const userQuery = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => apiClient.get<UserDetailResponse>(`/admin/users/${id}`),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, reason }: { action: 'lock' | 'unlock' | 'restrict'; reason: string }) =>
      apiClient.put(`/admin/users/${id}`, { action, reason }),
    onSuccess: (_, vars) => {
      toast.success(`Đã thực hiện thao tác: ${vars.action} tài khoản thành công!`);
      setReasonAction(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', id] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra.';
      toast.error(msg);
    },
  });

  const data = userQuery.data;
  const user = data?.user;
  const reports = data?.reports || [];
  const auditLogs = data?.auditLogs || [];

  return (
    <QueryBoundary queries={[userQuery]}>
      {user && (
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            title={`Hồ sơ người dùng: ${user.fullName}`}
            description={`Email: ${user.email} • ID: ${user.id}`}
            backHref="/admin/users"
            breadcrumbs={[
              { label: 'Admin Portal', href: '/admin' },
              { label: 'Người dùng', href: '/admin/users' },
              { label: user.fullName },
            ]}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại
                </Button>
                {user.status === 'active' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setReasonAction('lock')}
                  >
                    <Lock className="w-4 h-4 mr-1.5" /> Khóa tài khoản
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setReasonAction('unlock')}
                  >
                    <Unlock className="w-4 h-4 mr-1.5" /> Mở khóa tài khoản
                  </Button>
                )}
              </div>
            }
          />

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="info">Thông tin chung</TabsTrigger>
              <TabsTrigger value="reports">Lịch sử vi phạm ({reports.length})</TabsTrigger>
              <TabsTrigger value="audit">Nhật ký tác vụ ({auditLogs.length})</TabsTrigger>
            </TabsList>

            {/* TAB 1: INFO */}
            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <UserMiniCard userId={user.id} showMajor />
                    <StatusBadge status={user.status} domain="common" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block">Email trường:</span>
                      <span className="font-semibold">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block">Mã số sinh viên:</span>
                      <span className="font-semibold">{user.studentCode || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block">Trường / Cơ sở:</span>
                      <span className="font-semibold">{user.school || 'FPT University'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block">Chuyên ngành:</span>
                      <span className="font-semibold">{user.major || 'Kỹ thuật phần mềm'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-muted)] block mb-1">Các vai trò phân quyền:</span>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((r, i) => (
                        <Badge key={i} variant="secondary">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: REPORTS */}
            <TabsContent value="reports" className="mt-6">
              {reports.length === 0 ? (
                <div className="p-8 text-center bg-[var(--surface-card)] rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                  Người dùng này chưa có báo cáo vi phạm nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="danger">{r.reason}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(r.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      {r.details && <p className="text-xs text-[var(--text-main)] mt-2">{r.details}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: AUDIT */}
            <TabsContent value="audit" className="mt-6">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center bg-[var(--surface-card)] rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                  Chưa có tác vụ quản trị nào được ghi lại trên tài khoản này.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">{log.action}</span>
                        <span className="text-[var(--text-muted)]">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Lý do: {log.reason}</p>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Reason Dialog for Lock / Unlock */}
          <ReasonDialog
            open={!!reasonAction}
            onOpenChange={() => setReasonAction(null)}
            title={
              reasonAction === 'lock'
                ? 'Xác nhận khóa tài khoản'
                : reasonAction === 'unlock'
                ? 'Xác nhận mở khóa tài khoản'
                : 'Hạn chế quyền người dùng'
            }
            description="Mọi thao tác thay đổi trạng thái tài khoản bắt buộc phải có lý do giải trình được ghi vào nhật ký kiểm toán hệ thống (Audit Log)."
            label="Lý do xử lý"
            placeholder="Nhập lý do chi tiết..."
            onConfirm={(reason) => {
              if (!reasonAction) return;
              actionMutation.mutate({ action: reasonAction, reason });
            }}
          />
        </div>
      )}
    </QueryBoundary>
  );
};

export default AdminUserDetailPage;
