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
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { SearchInput } from '@/components/shared/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { ShieldCheck, Plus, Trash2, ShieldAlert, Pencil, Search, GraduationCap } from 'lucide-react';
import type { User } from '@/types/entities';
import { UNIVERSITIES } from '@/features/profile/profileConstants';

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
  const isAdmin = user?.roles.includes('admin') || user?.roles.includes('Admin');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserLabel, setSelectedUserLabel] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [editingSchoolAdmin, setEditingSchoolAdmin] = useState<User | null>(null);
  const [assignedSchool, setAssignedSchool] = useState(UNIVERSITIES[0]);
  const [scopeReason, setScopeReason] = useState('');
  const [addForm, setAddForm] = useState({
    userId: '',
    role: 'manager' as 'manager' | 'school_admin',
    assignedSchool: UNIVERSITIES[0],
    reason: '',
    permissions: managerPermissionOptions.map((item) => item.key),
  });
  const [revokeUserId, setRevokeUserId] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const adminPageSize = 10;

  const adminsQuery = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => apiClient.get<User[]>('/admin/admins'),
    enabled: isAdmin,
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'permission-search', userSearch],
    queryFn: () => apiClient.get<User[]>('/admin/users', { params: { q: userSearch } }),
    enabled: isAddOpen && userSearch.trim().length >= 2,
  });
  const filteredAdmins = (adminsQuery.data || []).filter((admin) => `${admin.fullName} ${admin.email} ${admin.id} ${admin.roles.join(' ')}`.toLowerCase().includes(adminSearch.toLowerCase()));
  const pagedAdmins = filteredAdmins.slice((adminPage - 1) * adminPageSize, adminPage * adminPageSize);

  const addAdminMutation = useMutation({
    mutationFn: () => apiClient.post('/admin/admins', {
      ...addForm,
      adminPermissions: addForm.role === 'manager' ? addForm.permissions : undefined,
      assignedSchool: addForm.role === 'school_admin' ? addForm.assignedSchool : undefined,
      reason: addForm.reason,
    }),
    onSuccess: () => {
      toast.success('Thêm quản trị viên thành công!');
      setIsAddOpen(false);
      setAddForm({ userId: '', role: 'manager', assignedSchool: UNIVERSITIES[0], reason: '', permissions: managerPermissionOptions.map((item) => item.key) });
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

  const updateSchoolScopeMutation = useMutation({
    mutationFn: () => apiClient.put(`/admin/admins/${editingSchoolAdmin?.id}/scope`, { assignedSchool, reason: scopeReason }),
    onSuccess: () => {
      toast.success('Đã cập nhật trường được phân công.');
      setEditingSchoolAdmin(null);
      setScopeReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: () => toast.error('Không thể cập nhật phạm vi trường.'),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ targetId, reason }: { targetId: string; reason: string }) => apiClient.delete(`/admin/admins/${targetId}`, { data: { reason } }),
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

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-[var(--status-danger-fg)] mx-auto" />
        <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Trang phân quyền chỉ dành cho Admin của hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân quyền Quản trị viên"
        description="System Admin cấp quyền Manager hoặc School Admin; School Admin chỉ xác minh sinh viên của trường được gán."
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
          <div className="p-4 border-b border-[var(--border-subtle)]"><SearchInput placeholder="Tìm quản trị viên theo tên, email, vai trò..." value={adminSearch} onChange={(value) => { setAdminSearch(value); setAdminPage(1); }} /></div>
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
                {pagedAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-[var(--surface-muted)]/50">
                    <td className="px-6 py-4">
                      <UserMiniCard userId={admin.id} />
                    </td>
                    <td className="px-6 py-4">
                      {admin.roles.includes('admin') ? (
                        <Badge variant="primary" className="font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin toàn hệ thống
                        </Badge>
                      ) : admin.roles.includes('school_admin') ? (
                        <Badge variant="secondary">School Admin · Xác minh sinh viên</Badge>
                      ) : (
                        <Badge variant="secondary">
                          Quản lý nghiệp vụ (Manager)
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {admin.roles.includes('school_admin') ? admin.assignedSchool : 'Toàn hệ thống'}
                    </td>
                    <td className="px-6 py-4 text-right">
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
                      {admin.roles.includes('school_admin') && <Button variant="ghost" size="sm" onClick={() => { setEditingSchoolAdmin(admin); setAssignedSchool(admin.assignedSchool || UNIVERSITIES[0]); setScopeReason(''); }}><Pencil className="w-4 h-4 mr-1" /> Đổi trường</Button>}
                      {(admin.roles.includes('manager') || admin.roles.includes('school_admin')) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--status-danger-fg)]"
                          onClick={() => setRevokeUserId(admin.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Thu hồi quyền
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4"><Pagination page={adminPage} pageSize={adminPageSize} total={filteredAdmins.length} onChange={setAdminPage} /></div>
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
                options={[{ label: 'Quản lý nghiệp vụ (Manager)', value: 'manager' }, { label: 'School Admin · Xác minh sinh viên', value: 'school_admin' }]}
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
            {addForm.role === 'school_admin' && <FormField label="Trường được phân công" required>
              <Select value={addForm.assignedSchool} onChange={(event) => setAddForm({ ...addForm, assignedSchool: event.target.value })} options={UNIVERSITIES.map((school) => ({ label: school, value: school }))} />
              <p className="mt-1 text-xs text-[var(--text-muted)]">School Admin chỉ được duyệt hồ sơ của một trường này.</p>
            </FormField>}
            <FormField label="Lý do cấp quyền" required><Textarea rows={2} value={addForm.reason} onChange={(event) => setAddForm({ ...addForm, reason: event.target.value })} placeholder="Nêu lý do phân quyền" /></FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => addAdminMutation.mutate()} disabled={!addForm.userId || !addForm.reason.trim()} loading={addAdminMutation.isPending}>
              Cấp quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSchoolAdmin} onOpenChange={(open) => !open && setEditingSchoolAdmin(null)}>
        <DialogContent><DialogHeader><DialogTitle>Đổi trường được phân công</DialogTitle></DialogHeader>
          <p className="text-sm">{editingSchoolAdmin?.fullName}</p>
          <Select value={assignedSchool} onChange={(event) => setAssignedSchool(event.target.value)} options={UNIVERSITIES.map((school) => ({ label: school, value: school }))} />
          <Textarea rows={2} value={scopeReason} onChange={(event) => setScopeReason(event.target.value)} placeholder="Lý do đổi phạm vi trường" />
          <DialogFooter><Button variant="outline" onClick={() => setEditingSchoolAdmin(null)}>Hủy</Button><Button disabled={!scopeReason.trim()} loading={updateSchoolScopeMutation.isPending} onClick={() => updateSchoolScopeMutation.mutate()}>Lưu phạm vi</Button></DialogFooter>
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

      {/* Revoke Reason Dialog */}
      <ReasonDialog
        open={!!revokeUserId}
        onOpenChange={() => setRevokeUserId(null)}
        title="Xác nhận thu hồi quyền quản trị"
        description="Người dùng này sẽ mất toàn bộ quyền truy cập vào cổng Admin Portal."
        label="Lý do thu hồi quyền"
        placeholder="Nhập lý do thực hiện..."
        onConfirm={(reason) => {
          if (!revokeUserId) return;
          revokeMutation.mutate({ targetId: revokeUserId, reason });
        }}
      />
    </div>
  );
};

export default AdminManagementPage;
