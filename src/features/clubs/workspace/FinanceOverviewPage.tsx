import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { formatVND } from '@/lib/format';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, FileText } from 'lucide-react';
import type { ExpenseRequest } from '@/types/entities';

interface FinanceSummaryData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyStats: { month: string; income: number; expense: number }[];
}

export const ClubFinanceOverviewPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  const financeQuery = useQuery({
    queryKey: ['clubs', clubId, 'finance', 'summary'],
    queryFn: () => apiClient.get<FinanceSummaryData>(`/clubs/${clubId}/finance/summary`),
    enabled: !!clubId,
  });

  const expensesQuery = useQuery({
    queryKey: ['clubs', clubId, 'finance', 'expenses'],
    queryFn: () => apiClient.get<ExpenseRequest[]>(`/clubs/${clubId}/finance/expenses`),
    enabled: !!clubId,
  });

  const pendingExpenses = (expensesQuery.data || []).filter((e) => e.status === 'PendingApproval');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Quỹ CLB & Tài chính"
        description="Theo dõi số dư quỹ, biểu đồ thu chi và danh sách đề nghị chi đang chờ duyệt"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Workspace', href: `/clubs/${clubId}/workspace/overview` },
          { label: 'Tài chính' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/clubs/${clubId}/workspace/finance/transactions`)}>
              Sổ giao dịch
            </Button>
            <Button onClick={() => navigate(`/clubs/${clubId}/workspace/finance/expenses`)}>
              Đề nghị chi
            </Button>
          </div>
        }
      />

      <QueryBoundary queries={[financeQuery]}>
        {financeQuery.data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              title="Số dư hiện tại"
              value={formatVND(financeQuery.data.balance)}
              icon={<DollarSign className="w-5 h-5" />}
              description="Khả dụng trong quỹ"
            />
            <SummaryCard
              title="Tổng thu kỳ này"
              value={formatVND(financeQuery.data.totalIncome)}
              icon={<TrendingUp className="w-5 h-5 text-[var(--status-success-fg)]" />}
              description="Từ tài trợ, đóng góp"
            />
            <SummaryCard
              title="Tổng chi kỳ này"
              value={formatVND(financeQuery.data.totalExpense)}
              icon={<TrendingDown className="w-5 h-5 text-[var(--status-danger-fg)]" />}
              description="Sự kiện và hoạt động"
            />
          </div>
        )}

        {/* Chart and Pending Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Biểu đồ Thu & Chi theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeQuery.data?.monthlyStats || []}>
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${v / 1000000}M`} />
                    <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                    <Legend />
                    <Bar dataKey="income" name="Tổng thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Tổng chi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pending Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Đề nghị chi chờ duyệt</CardTitle>
              <Badge variant="attention">{pendingExpenses.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingExpenses.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-6 text-center">
                  Không có đề nghị chi nào đang chờ duyệt.
                </p>
              ) : (
                pendingExpenses.slice(0, 4).map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 border border-[var(--border-subtle)] rounded-lg space-y-1 hover:bg-[var(--surface-muted)] cursor-pointer"
                    onClick={() => navigate(`/clubs/${clubId}/workspace/finance/expenses`)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary">{formatVND(exp.amount)}</span>
                      <span className="text-[var(--text-subtle)]">{new Date(exp.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-xs text-[var(--text-main)] line-clamp-1">{exp.purpose}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </QueryBoundary>
    </div>
  );
};

export default ClubFinanceOverviewPage;
