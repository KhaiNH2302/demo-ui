import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { FormField } from '@/components/shared/FormField';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { ShieldCheck, Plus, Trash2, ShieldAlert } from 'lucide-react';
import type { User } from '@/types/entities';

export const AdminManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSystemAdmin = user?.roles.includes('system_admin');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ userId: '', role: 'manager' as 'system_admin' | 'manager' });
  const [revokeUserId, setRevokeUserId] = useState<string | null>(null);

  const adminsQuery = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => apiClient.get<User[]>('/admin/admins'),
    enabled: isSystemAdmin,
  });

  const addAdminMutation = useMutation({
    mutationFn: () => apiClient.post('/admin/admins', addForm),
    onSuccess: () => {
      toast.success('Thêm quản trị viên thành công!');
      setIsAddOpen(false);
      setAddForm({ userId: '', role: 'manager' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: () => toast.error('Không thể thêm quản trị viên.'),
  });

  const revokeMutation = useMutation({
    mutationFn: (targetId: string) => apiClient.delete(`/admin/admins/${targetId}`),
    onSuccess: () => {
      toast.success('Đã thu hồi quyền quản trị viên!');
      setRevokeUserId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi thu hồi quyền.';
      toast.error(msg);
      setRevokeUserId(null);
    },
  });

  if (!isSystemAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-[var(--status-danger-fg)] mx-auto" />
        <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Trang phân quyền Quản trị viên chỉ dành riêng cho Quản trị viên Hệ thống (System Admin).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân quyền Quản trị viên"
        description="Quản lý danh sách tài khoản được cấp quyền Quản trị hệ thống và Quản trị trường"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Phân quyền' },
        ]}
        actions={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Thêm Quản trị viên
          </Button>
        }
      />

      <QueryBoundary queries={[adminsQuery]}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-3">Quản trị viên</th>
                  <th className="px-6 py-3">Phạm vi phân quyền</th>
                  <th className="px-6 py-3">Cơ sở / Trường</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {adminsQuery.data?.map((admin) => (
                  <tr key={admin.id} className="hover:bg-[var(--surface-muted)]/50">
                    <td className="px-6 py-4">
                      <UserMiniCard userId={admin.id} />
                    </td>
                    <td className="px-6 py-4">
                      {admin.roles.includes('system_admin') ? (
                        <Badge variant="primary" className="font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Toàn hệ thống (System)
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Quản lý nghiệp vụ (Manager)
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {admin.school || 'Tất cả cơ sở'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--status-danger-fg)]"
                        onClick={() => setRevokeUserId(admin.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Thu hồi quyền
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </QueryBoundary>

      {/* Add Admin Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tài khoản Quản trị viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Mã người dùng (User ID)" required>
              <Input
                placeholder="Ví dụ: usr_student_01..."
                value={addForm.userId}
                onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Cấp độ phân quyền" required>
              <Select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                options={[
                  { label: 'Quản lý nghiệp vụ (Manager)', value: 'manager' },
                  { label: 'Quản trị viên Hệ thống (System Admin)', value: 'system_admin' },
                ]}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => addAdminMutation.mutate()} loading={addAdminMutation.isPending}>
              Cấp quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Reason Dialog */}
      <ReasonDialog
        open={!!revokeUserId}
        onOpenChange={() => setRevokeUserId(null)}
        title="Xác nhận thu hồi quyền quản trị"
        description="Người dùng này sẽ mất toàn bộ quyền truy cập vào cổng Admin Portal."
        label="Lý do thu hồi quyền"
        placeholder="Nhập lý do thực hiện..."
        onConfirm={() => {
          if (!revokeUserId) return;
          revokeMutation.mutate(revokeUserId);
        }}
      />
    </div>
  );
};

export default AdminManagementPage;
