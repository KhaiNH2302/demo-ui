import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { SearchInput } from '@/components/shared/SearchInput';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Users, Eye, Lock, Shield } from 'lucide-react';
import type { User } from '@/types/entities';

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter, statusFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      return apiClient.get<User[]>(`/admin/users?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng & Tài khoản"
        description="Tra cứu thông tin tài khoản, kiểm tra trạng thái hoạt động và xử lý vi phạm"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Người dùng' },
        ]}
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm kiếm theo tên, email..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { label: 'Tất cả vai trò', value: 'all' },
              { label: 'Sinh viên (Student)', value: 'student' },
              { label: 'Mentor', value: 'mentor' },
              { label: 'Quản trị viên (Admin)', value: 'system_admin' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'Tất cả trạng thái', value: 'all' },
              { label: 'Đang hoạt động', value: 'active' },
              { label: 'Bị khóa', value: 'locked' },
              { label: 'Hạn chế', value: 'restricted' },
            ]}
          />
        </div>
      </div>

      <QueryBoundary queries={[usersQuery]}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-3">Người dùng</th>
                  <th className="px-6 py-3">Trường / Đơn vị</th>
                  <th className="px-6 py-3">Vai trò hệ thống</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {usersQuery.data?.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--surface-muted)]/50">
                    <td className="px-6 py-4">
                      <UserMiniCard userId={u.id} showMajor />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[var(--text-main)]">
                      {u.school || 'FPT University HN'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.status} domain="common" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </QueryBoundary>
    </div>
  );
};

export default AdminUsersPage;
