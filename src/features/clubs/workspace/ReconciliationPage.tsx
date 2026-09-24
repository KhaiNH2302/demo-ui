import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { formatVND } from '@/lib/format';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { CheckCircle2, Download, Scale, History } from 'lucide-react';
import type { Reconciliation } from '@/types/entities';

export const ClubReconciliationPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState('Tháng 09/2026');
  const [openingBalance, setOpeningBalance] = useState(15000000);
  const [totalIncome, setTotalIncome] = useState(6500000);
  const [totalExpense, setTotalExpense] = useState(850000);
  const [notes, setNotes] = useState('');

  const endingBalance = openingBalance + totalIncome - totalExpense;

  const reconciliationsQuery = useQuery({
    queryKey: ['clubs', clubId, 'finance', 'reconciliations'],
    queryFn: () => apiClient.get<Reconciliation[]>(`/clubs/${clubId}/finance/reconciliations`),
    enabled: !!clubId,
  });

  const saveReconciliationMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/clubs/${clubId}/finance/reconciliations`, {
        period,
        openingBalance,
        totalIncome,
        totalExpense,
        endingBalance,
        notes,
      }),
    onSuccess: () => {
      toast.success('Lưu biên bản đối soát tài chính thành công!');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'finance', 'reconciliations'] });
    },
    onError: () => toast.error('Có lỗi xảy ra khi lưu đối soát.'),
  });

  const handleExportCSV = () => {
    const list = reconciliationsQuery.data || [];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Mã đối soát,Kỳ đối soát,Số dư đầu,Tổng thu,Tổng chi,Số dư cuối,Ghi chú,Ngày lập']
        .concat(
          list.map(
            (r) =>
              `"${r.id}","${r.period}","${r.openingBalance}","${r.totalIncome}","${r.totalExpense}","${r.endingBalance}","${(r.notes || '').replace(/"/g, '""')}","${r.createdAt}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `doi_soat_quy_${clubId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất lịch sử đối soát ra file CSV!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đối soát quỹ định kỳ"
        description="Kiểm kê, đối chiếu thu chi và chốt số dư quỹ câu lạc bộ theo từng kỳ"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Tài chính', href: `/clubs/${clubId}/workspace/finance` },
          { label: 'Đối soát' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> Xuất dữ liệu CSV
          </Button>
        }
      />

      {/* New Reconciliation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" /> Lập biên bản đối soát kỳ hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Kỳ đối soát" required>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </FormField>

            <FormField label="Số dư đầu kỳ (VNĐ)">
              <Input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
              />
            </FormField>

            <FormField label="Tổng thu trong kỳ (VNĐ)">
              <Input
                type="number"
                value={totalIncome}
                onChange={(e) => setTotalIncome(Number(e.target.value))}
              />
            </FormField>

            <FormField label="Tổng chi trong kỳ (VNĐ)">
              <Input
                type="number"
                value={totalExpense}
                onChange={(e) => setTotalExpense(Number(e.target.value))}
              />
            </FormField>
          </div>

          <div className="p-4 bg-[var(--surface-muted)] rounded-lg flex items-center justify-between">
            <span className="font-semibold text-sm">Số dư cuối kỳ tính toán:</span>
            <span className="font-bold text-lg font-mono text-primary">
              {formatVND(endingBalance)}
            </span>
          </div>

          <FormField label="Ghi chú & Nhận xét sai lệch (nếu có)">
            <Textarea
              rows={3}
              placeholder="Ghi chú về chứng từ còn thiếu, giải trình chênh lệch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </CardContent>
        <CardFooter className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
          <Button
            onClick={() => saveReconciliationMutation.mutate()}
            loading={saveReconciliationMutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Lưu kết quả đối soát
          </Button>
        </CardFooter>
      </Card>

      {/* History */}
      <div>
        <h3 className="text-base font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" /> Lịch sử các kỳ đối soát trước
        </h3>

        <QueryBoundary queries={[reconciliationsQuery]}>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="px-6 py-3">Kỳ đối soát</th>
                    <th className="px-6 py-3">Số dư đầu</th>
                    <th className="px-6 py-3">Tổng thu</th>
                    <th className="px-6 py-3">Tổng chi</th>
                    <th className="px-6 py-3">Số dư cuối</th>
                    <th className="px-6 py-3">Ngày chốt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {reconciliationsQuery.data?.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--surface-muted)]/50">
                      <td className="px-6 py-4 font-semibold">{r.period}</td>
                      <td className="px-6 py-4 font-mono">{formatVND(r.openingBalance)}</td>
                      <td className="px-6 py-4 font-mono text-[var(--status-success-fg)]">
                        +{formatVND(r.totalIncome)}
                      </td>
                      <td className="px-6 py-4 font-mono text-[var(--status-danger-fg)]">
                        -{formatVND(r.totalExpense)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-primary">
                        {formatVND(r.endingBalance)}
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--text-muted)]">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </QueryBoundary>
      </div>
    </div>
  );
};

export default ClubReconciliationPage;
