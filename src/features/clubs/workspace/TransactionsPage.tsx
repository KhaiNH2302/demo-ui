import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { DollarSign, Plus, ArrowUpRight, ArrowDownLeft, FileText, Download } from 'lucide-react';
import type { Transaction } from '@/types/entities';

export const ClubTransactionsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const queryClient = useQueryClient();
  const { getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');
  const isTreasurer = role === 'treasurer';

  const [typeFilter, setTypeFilter] = useState<'all' | 'Income' | 'Expense'>('all');
  const [isRecordIncomeOpen, setIsRecordIncomeOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '' });

  const transactionsQuery = useQuery({
    queryKey: ['clubs', clubId, 'finance', 'transactions'],
    queryFn: () => apiClient.get<Transaction[]>(`/clubs/${clubId}/finance/transactions`),
    enabled: !!clubId,
  });

  const recordIncomeMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/clubs/${clubId}/finance/transactions`, {
        amount: Number(incomeForm.amount),
        description: incomeForm.description,
        type: 'Income',
      }),
    onSuccess: () => {
      toast.success('Đã ghi nhận khoản thu mới thành công!');
      setIsRecordIncomeOpen(false);
      setIncomeForm({ amount: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'finance'] });
    },
    onError: () => toast.error('Có lỗi xảy ra khi ghi khoản thu.'),
  });

  const allTxs = transactionsQuery.data || [];
  const filteredTxs = typeFilter === 'all' ? allTxs : allTxs.filter((t) => t.type === typeFilter);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Mã GD,Loại,Số tiền,Mô tả,Ngày ghi']
        .concat(
          filteredTxs.map(
            (t) =>
              `"${t.id}","${t.type}","${t.amount}","${t.description.replace(/"/g, '""')}","${t.createdAt}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `so_giao_dich_${clubId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file CSV sổ giao dịch thành công!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sổ giao dịch thu chi"
        description="Nhật ký toàn bộ các khoản tiền ra và vào của quỹ câu lạc bộ"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Tài chính', href: `/clubs/${clubId}/workspace/finance` },
          { label: 'Sổ giao dịch' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1.5" /> Xuất CSV
            </Button>
            {isTreasurer && (
              <Button size="sm" onClick={() => setIsRecordIncomeOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Ghi khoản thu
              </Button>
            )}
          </div>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="w-48">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            options={[
              { label: 'Tất cả loại giao dịch', value: 'all' },
              { label: 'Khoản Thu (+)', value: 'Income' },
              { label: 'Khoản Chi (-)', value: 'Expense' },
            ]}
          />
        </div>
      </div>

      <QueryBoundary queries={[transactionsQuery]}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-3">Loại</th>
                  <th className="px-6 py-3">Số tiền</th>
                  <th className="px-6 py-3">Nội dung / Mô tả</th>
                  <th className="px-6 py-3">Người ghi</th>
                  <th className="px-6 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--surface-muted)]/50">
                    <td className="px-6 py-4">
                      {tx.type === 'Income' ? (
                        <Badge variant="success" className="flex items-center w-fit gap-1">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Thu
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="flex items-center w-fit gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Chi
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold font-mono">
                      <span className={tx.type === 'Income' ? 'text-[var(--status-success-fg)]' : 'text-[var(--status-danger-fg)]'}>
                        {tx.type === 'Income' ? '+' : '-'} {formatVND(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-main)] max-w-xs">{tx.description}</td>
                    <td className="px-6 py-4">
                      <UserMiniCard userId={tx.recordedBy} />
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--text-muted)]">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </QueryBoundary>

      {/* Record Income Dialog */}
      <Dialog open={isRecordIncomeOpen} onOpenChange={setIsRecordIncomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận khoản thu mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Số tiền (VNĐ)" required>
              <Input
                type="number"
                placeholder="Ví dụ: 1000000"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Nguồn thu / Lý do" required>
              <Input
                placeholder="Ví dụ: Thu phí thành viên đợt 1, Tài trợ từ cựu sinh viên..."
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                required
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordIncomeOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => recordIncomeMutation.mutate()}
              loading={recordIncomeMutation.isPending}
            >
              Lưu khoản thu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubTransactionsPage;
