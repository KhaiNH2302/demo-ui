import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { formatVND } from '@/lib/format';
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
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { DollarSign, Plus, Check, X, AlertTriangle } from 'lucide-react';
import type { ExpenseRequest } from '@/types/entities';

export const ClubExpensesPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const queryClient = useQueryClient();
  const { getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');
  const isManager = role === 'manager';
  const isTreasurer = role === 'treasurer';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', purpose: '' });
  const [rejectExpenseId, setRejectExpenseId] = useState<string | null>(null);

  const expensesQuery = useQuery({
    queryKey: ['clubs', clubId, 'finance', 'expenses'],
    queryFn: () => apiClient.get<ExpenseRequest[]>(`/clubs/${clubId}/finance/expenses`),
    enabled: !!clubId,
  });

  const createExpenseMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/clubs/${clubId}/finance/expenses`, {
        amount: Number(expenseForm.amount),
        purpose: expenseForm.purpose,
      }),
    onSuccess: () => {
      toast.success('Đã gửi đề xuất chi tiền cho Chủ nhiệm phê duyệt!');
      setIsCreateOpen(false);
      setExpenseForm({ amount: '', purpose: '' });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'finance'] });
    },
    onError: () => toast.error('Có lỗi xảy ra khi tạo đề nghị chi.'),
  });

  const reviewExpenseMutation = useMutation({
    mutationFn: ({ eid, status, approverNote }: { eid: string; status: 'Approved' | 'Rejected'; approverNote?: string }) =>
      apiClient.put(`/clubs/${clubId}/finance/expenses/${eid}`, { status, approverNote }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'Approved' ? 'Đã duyệt đề nghị chi!' : 'Đã từ chối đề nghị chi.');
      setRejectExpenseId(null);
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'finance'] });
    },
    onError: () => toast.error('Có lỗi xảy ra.'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đề nghị chi quỹ"
        description="Đề xuất và phê duyệt các khoản chi phục vụ sự kiện, hậu cần câu lạc bộ"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Tài chính', href: `/clubs/${clubId}/workspace/finance` },
          { label: 'Đề nghị chi' },
        ]}
        actions={
          isTreasurer ? (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Tạo đề nghị chi mới
            </Button>
          ) : null
        }
      />

      <QueryBoundary queries={[expensesQuery]}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expensesQuery.data?.map((exp) => (
            <Card key={exp.id} className="flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status={exp.status} domain="clubs" />
                  <span className="text-sm font-bold font-mono text-[var(--status-danger-fg)]">
                    {formatVND(exp.amount)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-sm text-[var(--text-main)]">{exp.purpose}</p>

                {exp.approverNote && (
                  <p className="text-xs text-[var(--text-muted)] bg-[var(--surface-muted)] p-2 rounded">
                    Phản hồi: {exp.approverNote}
                  </p>
                )}

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-subtle)]">
                  <span>Người đề xuất:</span>
                  <UserMiniCard userId={exp.requestedBy} />
                </div>
              </CardContent>

              {isManager && exp.status === 'PendingApproval' && (
                <div className="p-3 bg-[var(--surface-muted)] border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectExpenseId(exp.id)}
                  >
                    <X className="w-3.5 h-3.5 mr-1 text-[var(--status-danger-fg)]" /> Từ chối
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      reviewExpenseMutation.mutate({
                        eid: exp.id,
                        status: 'Approved',
                      })
                    }
                    loading={reviewExpenseMutation.isPending}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Phê duyệt
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </QueryBoundary>

      {/* Create Expense Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo đề xuất chi quỹ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Số tiền đề xuất (VNĐ)" required>
              <Input
                type="number"
                placeholder="Ví dụ: 500000"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Mục đích chi tiết" required>
              <Textarea
                rows={3}
                placeholder="Mô tả lý do chi, mua sắm hạng mục gì và cho sự kiện nào..."
                value={expenseForm.purpose}
                onChange={(e) => setExpenseForm({ ...expenseForm, purpose: e.target.value })}
                required
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => createExpenseMutation.mutate()}
              loading={createExpenseMutation.isPending}
            >
              Gửi đề xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <ReasonDialog
        open={!!rejectExpenseId}
        onOpenChange={() => setRejectExpenseId(null)}
        title="Từ chối đề nghị chi quỹ"
        description="Nhập lý do không phê duyệt khoản chi này để phản hồi lại Thủ quỹ."
        label="Lý do từ chối"
        placeholder="Ví dụ: Chưa có hóa đơn VAT kèm theo..."
        onConfirm={(reason) => {
          if (!rejectExpenseId) return;
          reviewExpenseMutation.mutate({
            eid: rejectExpenseId,
            status: 'Rejected',
            approverNote: reason,
          });
        }}
      />
    </div>
  );
};

export default ClubExpensesPage;
