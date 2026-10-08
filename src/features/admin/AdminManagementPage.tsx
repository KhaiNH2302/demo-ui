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
import { ShieldCheck, Plus, Trash2, ShieldAlert, Pencil, Search } from 'lucide-react';
import type { User } from '@/types/entities';

export const AdminManagementPage: React.FC = () => {
  const managerPermissionOptions = [
    { key: 'dashboard', label: 'Dashboard tổng quan' },
    { key: 'users', label: 'Quản lý người dùng' },
    { key: 'clubs', label: 'CLB & đại diện CLB' },
    { key: 'programs', label: 'Sự kiện, Tình nguyện & Workshop' },
    { key: 'moderation', label: 'Kiểm duyệt nội dung' },
    { key: 'master_data', label: 'Dữ liệu danh mục' },
    { key: 'reports', label: 'Báo cáo & nhật ký' },
  ] as const;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSystemAdmin = user?.roles.includes('system_admin') || user?.roles.includes('super_admin');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserLabel, setSelectedUserLabel] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [addForm, setAddForm] = useState({
    userId: '',
    role: 'manager' as 'super_admin' | 'system_admin' | 'manager',
    permissions: managerPermissionOptions.map((item) => item.key),
  });
  const [revokeUserId, setRevokeUserId] = useState<string | null>(null);

  const adminsQuery = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => apiClient.get<User[]>('/admin/admins'),
    enabled: isSystemAdmin,
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'permission-search', userSearch],
    queryFn: () => apiClient.get<User[]>('/admin/users', { params: { search: userSearch } }),
    enabled: isAddOpen && userSearch.trim().length >= 2,
  });
  const hasSuperAdmin = Boolean(adminsQuery.data?.some((admin) => admin.roles.includes('super_admin')));

  const addAdminMutation = useMutation({
    mutationFn: () => apiClient.post('/admin/admins', {
      ...addForm,
      adminPermissions: addForm.role === 'manager' ? addForm.permissions : undefined,
    }),
    onSuccess: () => {
      toast.success('Thêm quản trị viên thành công!');
      setIsAddOpen(false);
      setAddForm({ userId: '', role: 'manager', permissions: managerPermissionOptions.map((item) => item.key) });
      setUserSearch('');
      setSelectedUserLabel('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: () => toast.error('Không thể thêm quản trị viên.'),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: () => apiClient.put(`/admin/admins/${editingAdmin?.id}/permissions`, {
      adminPermissions: editingPermissions,
    }),
    onSuccess: () => {
      toast.success('Đã cập nhật quyền Manager.');
      setEditingAdmin(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: () => toast.error('Không thể cập nhật quyền Manager.'),
  });

  const transferSuperAdminMutation = useMutation({
    mutationFn: () => apiClient.put(`/admin/admins/${user?.id}/transfer`, { targetUserId: transferTargetId }),
    onSuccess: () => {
      toast.success('Đã nhượng quyền Super Admin thành công.');
      setTransferOpen(false);
      setTransferTargetId('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: () => toast.error('Không thể nhượng quyền Super Admin.'),
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
                      {admin.roles.includes('super_admin') ? (
                        <Badge variant="primary" className="font-semibold">Super Admin</Badge>
                      ) : admin.roles.includes('system_admin') ? (
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
                      {admin.roles.includes('super_admin') && admin.id === user?.id && (
                        <Button variant="ghost" size="sm" onClick={() => setTransferOpen(true)}>
                          <Pencil className="w-4 h-4 mr-1" /> Nhượng quyền
                        </Button>
                      )}
                      {admin.roles.includes('manager') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAdmin(admin);
                            setEditingPermissions(admin.adminPermissions || managerPermissionOptions.map((item) => item.key));
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Chỉnh quyền
                        </Button>
                      )}
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
            <FormField label="Tìm người dùng" required>
              <div className="relative z-30">
                <div className="relative">
                  {userSearch && (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  )}
                  <Input
                    className={userSearch ? 'pl-7' : 'pl-3'}
                    placeholder="Tìm theo tên, email hoặc User ID..."
                    value={userSearch || selectedUserLabel}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedUserLabel('');
                      setAddForm({ ...addForm, userId: '' });
                    }}
                    required
                  />
                </div>
                {userSearch.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-lg">
                  {(usersQuery.data || []).map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-muted)] ${addForm.userId === candidate.id ? 'bg-brand-50' : ''}`}
                      onClick={() => {
                        setAddForm({ ...addForm, userId: candidate.id });
                        setUserSearch('');
                        setSelectedUserLabel(`${candidate.fullName} · ${candidate.email}`);
                      }}
                    >
                      <span className="block font-medium">{candidate.fullName}</span>
                      <span className="block text-xs text-[var(--text-muted)]">{candidate.email} · {candidate.id}</span>
                    </button>
                  ))}
                  {!usersQuery.isLoading && (usersQuery.data || []).length === 0 && (
                    <div className="px-3 py-2 text-sm text-[var(--text-muted)]">Không tìm thấy người dùng.</div>
                  )}
                  </div>
                )}
              </div>
            </FormField>
            <FormField label="Cấp độ phân quyền" required>
              <Select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                options={[
                  { label: 'Quản lý nghiệp vụ (Manager)', value: 'manager' },
                  ...(!hasSuperAdmin ? [{ label: 'Super Admin', value: 'super_admin' }] : []),
                  { label: 'Quản trị viên Hệ thống (System Admin)', value: 'system_admin' },
                ]}
              />
            </FormField>
            {addForm.role === 'manager' && (
              <FormField label="Manager được xem" required>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-3">
                  {managerPermissionOptions.map((item) => {
                    const checked = addForm.permissions.includes(item.key);
                    return (
                      <label key={item.key} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-[var(--surface-card)]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setAddForm((current) => ({
                            ...current,
                            permissions: e.target.checked
                              ? [...current.permissions, item.key]
                              : current.permissions.filter((permission) => permission !== item.key),
                          }))}
                          className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  Manager chỉ nhìn thấy các khu vực được chọn; thao tác duyệt/xóa vẫn do backend kiểm tra.
                </p>
              </FormField>
            )}
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

      <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh quyền Manager</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-3">
            {managerPermissionOptions.map((item) => (
              <label key={item.key} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-[var(--surface-card)]">
                <input
                  type="checkbox"
                  checked={editingPermissions.includes(item.key)}
                  onChange={(e) => setEditingPermissions((current) => e.target.checked
                    ? [...current, item.key]
                    : current.filter((permission) => permission !== item.key))}
                  className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAdmin(null)}>Hủy</Button>
            <Button onClick={() => updatePermissionsMutation.mutate()} loading={updatePermissionsMutation.isPending}>Lưu quyền</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhượng quyền Super Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              Bạn sẽ chuyển quyền Super Admin cho tài khoản mới. Tài khoản hiện tại sẽ trở thành System Admin.
            </p>
            <FormField label="User ID người nhận" required>
              <Input
                placeholder="Ví dụ: usr_admin_05"
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value.trim())}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Hủy</Button>
            <Button
              variant="primary"
              disabled={!transferTargetId || transferTargetId === user?.id}
              loading={transferSuperAdminMutation.isPending}
              onClick={() => transferSuperAdminMutation.mutate()}
            >
              Xác nhận nhượng quyền
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
