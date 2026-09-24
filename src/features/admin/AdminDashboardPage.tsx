import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, FileCheck, ShieldAlert, Building2, ArrowRight } from 'lucide-react';

interface DashboardResponse {
  metrics: {
    newUsers7d: number;
    pendingPosts: number;
    openReports: number;
    pendingClubs: number;
  };
  moduleActivity: { module: string; count: number }[];
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient.get<DashboardResponse>('/admin/dashboard'),
  });

  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển Quản trị"
        description="Tổng hợp chỉ số người dùng, bài đăng cần duyệt và báo cáo vi phạm toàn hệ thống"
        breadcrumbs={[
          { label: 'Admin Portal' },
          { label: 'Tổng quan' },
        ]}
      />

      <QueryBoundary queries={[dashboardQuery]}>
        {data && (
          <>
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Người dùng hoạt động"
                value={data.metrics.newUsers7d}
                icon={<Users className="w-5 h-5 text-primary" />}
                description="Tài khoản trên toàn hệ thống"
              />
              <SummaryCard
                title="Bài viết chờ duyệt"
                value={data.metrics.pendingPosts}
                icon={<FileCheck className="w-5 h-5 text-[var(--status-pending-fg)]" />}
                description="Kho tài liệu & bài chia sẻ"
              />
              <SummaryCard
                title="Báo cáo vi phạm"
                value={data.metrics.openReports}
                icon={<ShieldAlert className="w-5 h-5 text-[var(--status-danger-fg)]" />}
                description="Chưa được xử lý"
              />
              <SummaryCard
                title="CLB chờ phê duyệt"
                value={data.metrics.pendingClubs}
                icon={<Building2 className="w-5 h-5 text-[var(--status-attention-fg)]" />}
                description="Đơn thành lập CLB mới"
              />
            </div>

            {/* Charts & Quick Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Mức độ tương tác theo phân hệ (7 ngày qua)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.moduleActivity}>
                        <XAxis dataKey="module" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" name="Lượt tương tác" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hành động cần xử lý gấp</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    className="p-3 border border-[var(--border-subtle)] rounded-lg flex items-center justify-between hover:bg-[var(--surface-muted)] cursor-pointer"
                    onClick={() => navigate('/admin/moderation')}
                  >
                    <div>
                      <div className="font-semibold text-sm">Kiểm duyệt nội dung</div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {data.metrics.pendingPosts} bài chờ duyệt • {data.metrics.openReports} báo cáo
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>

                  <div
                    className="p-3 border border-[var(--border-subtle)] rounded-lg flex items-center justify-between hover:bg-[var(--surface-muted)] cursor-pointer"
                    onClick={() => navigate('/admin/clubs')}
                  >
                    <div>
                      <div className="font-semibold text-sm">Phê duyệt thành lập CLB</div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {data.metrics.pendingClubs} hồ sơ đang chờ xét duyệt
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>

                  <div
                    className="p-3 border border-[var(--border-subtle)] rounded-lg flex items-center justify-between hover:bg-[var(--surface-muted)] cursor-pointer"
                    onClick={() => navigate('/admin/users')}
                  >
                    <div>
                      <div className="font-semibold text-sm">Quản lý tài khoản sinh viên</div>
                      <span className="text-xs text-[var(--text-muted)]">
                        Tra cứu, khóa hoặc phân quyền
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </QueryBoundary>
    </div>
  );
};

export default AdminDashboardPage;
