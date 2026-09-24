import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { History, Download, Shield } from 'lucide-react';
import type { AuditLog } from '@/types/entities';

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');

  const logsQuery = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => apiClient.get<AuditLog[]>('/admin/audit-logs'),
  });

  const allLogs = logsQuery.data || [];
  const filteredLogs = allLogs.filter((log) => {
    if (targetTypeFilter !== 'all' && log.targetType !== targetTypeFilter) return false;
    if (
      search &&
      !log.action.toLowerCase().includes(search.toLowerCase()) &&
      !(log.reason || '').toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Mã Log,Thời gian,Người thực hiện,Hành động,Đối tượng,Mã đối tượng,Lý do']
        .concat(
          filteredLogs.map(
            (l) =>
              `"${l.id}","${l.createdAt}","${l.actorId}","${l.action.replace(/"/g, '""')}","${l.targetType}","${l.targetId}","${(l.reason || '').replace(/"/g, '""')}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất toàn bộ nhật ký kiểm toán sang CSV!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký Kiểm toán Hệ thống (Audit Log)"
        description="Ghi nhận toàn bộ thao tác nhạy cảm, phê duyệt và xử lý kỷ luật của quản trị viên"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Audit Log' },
        ]}
        actions={
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> Xuất dữ liệu CSV
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm kiếm theo hành động, lý do..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            options={[
              { label: 'Tất cả đối tượng', value: 'all' },
              { label: 'Người dùng (User)', value: 'User' },
              { label: 'Bài viết (KnowledgePost)', value: 'KnowledgePost' },
              { label: 'Báo cáo vi phạm (ViolationReport)', value: 'ViolationReport' },
              { label: 'Câu lạc bộ (Club)', value: 'Club' },
            ]}
          />
        </div>
      </div>

      <QueryBoundary queries={[logsQuery]}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3">Người thực hiện</th>
                  <th className="px-6 py-3">Hành động</th>
                  <th className="px-6 py-3">Đối tượng tác động</th>
                  <th className="px-6 py-3">Căn cứ / Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-muted)]/50">
                    <td className="px-6 py-4 text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <UserMiniCard userId={log.actorId} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {log.action}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {log.targetType}: {log.targetId}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--text-main)] max-w-sm">
                      {log.reason || '—'}
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

export default AuditLogsPage;
