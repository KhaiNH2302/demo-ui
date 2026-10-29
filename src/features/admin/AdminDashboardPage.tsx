import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Users,
  ShieldAlert,
  Building2,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import type { SchoolAffiliationRequest } from '@/types/entities';

interface DashboardResponse {
  metrics: {
    newUsers7d: number;
    pendingPosts: number;
    openReports: number;
    pendingClubs: number;
    pendingRepRequests?: number;
    pendingPrograms?: number;
  };
  moduleActivity: { module: string; count: number }[];
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.hasRole('admin'));
  const isSchoolAdmin = useAuthStore((s) => s.hasRole('school_admin') || s.hasRole('SchoolAdmin'));
  const user = useAuthStore((s) => s.user);

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient.get<DashboardResponse>('/admin/dashboard'),
  });

  const affiliationsQuery = useQuery({
    queryKey: ['admin', 'school-affiliations'],
    queryFn: () => apiClient.get<SchoolAffiliationRequest[]>('/admin/school-affiliations'),
    enabled: isSchoolAdmin,
  });

  const data = dashboardQuery.data;
  const scopedAffils = (affiliationsQuery.data || []).filter(
    (item) => !item.school || item.school.toLowerCase() === (user?.school || 'Đại học FPT Hà Nội').toLowerCase()
  );
  const pendingCount = scopedAffils.filter((item) => item.status === 'Pending').length;
  const verifiedCount = scopedAffils.filter((item) => item.status === 'Verified').length;
  const needsMoreInfoCount = scopedAffils.filter((item) => ['NeedsMoreInfo', 'Rejected', 'Revoked'].includes(item.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSchoolAdmin ? `Bảng điều khiển — ${user?.school || 'Đại học FPT Hà Nội'}` : 'Bảng điều khiển Quản trị'}
        description={
          isSchoolAdmin
            ? 'Theo dõi số lượng sinh viên trực thuộc trường, duyệt hồ sơ xác thực và kiểm soát quyền thành viên của trường'
            : 'Tổng hợp chỉ số người dùng, báo cáo vi phạm, xác minh đại diện CLB, duyệt kênh chương trình và xác thực trường'
        }
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
              {isSchoolAdmin ? (
                <>
                  <SummaryCard
                    title="Sinh viên trường"
                    value={scopedAffils.length > 0 ? scopedAffils.length : 18}
                    icon={<Users className="w-5 h-5 text-brand-600" />}
                    description={user?.school || 'Đại học FPT Hà Nội'}
                  />
                  <SummaryCard
                    title="Chờ xác thực trường"
                    value={pendingCount}
                    icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
                    description="Cần School Admin duyệt minh chứng"
                  />
                  <SummaryCard
                    title="Đã xác thực trường"
                    value={verifiedCount}
                    icon={<Building2 className="w-5 h-5 text-emerald-600" />}
                    description="Sinh viên chính thức đã duyệt"
                  />
                  <SummaryCard
                    title="Cần bổ sung / Từ chối"
                    value={needsMoreInfoCount}
                    icon={<HeartHandshake className="w-5 h-5 text-neutral-600" />}
                    description="Yêu cầu làm rõ / đã từ chối"
                  />
                </>
              ) : (
                <>
                  <SummaryCard
                    title="Người dùng hoạt động"
                    value={data.metrics.newUsers7d}
                    icon={<Users className="w-5 h-5 text-brand-600" />}
                    description="Tài khoản trên toàn hệ thống"
                  />
                  <SummaryCard
                    title="Báo cáo & Tạm ẩn"
                    value={data.metrics.openReports}
                    icon={<ShieldAlert className="w-5 h-5 text-tier-danger-text" />}
                    description="Cần kiểm duyệt xử lý"
                  />
                  <SummaryCard
                    title="Đại diện CLB chờ xác minh"
                    value={data.metrics.pendingRepRequests ?? data.metrics.pendingClubs}
                    icon={<Building2 className="w-5 h-5 text-brand-600" />}
                    description="Yêu cầu đại diện đăng cơ hội"
                  />
                  <SummaryCard
                    title="Kênh chương trình chờ duyệt"
                    value={data.metrics.pendingPrograms ?? 1}
                    icon={<HeartHandshake className="w-5 h-5 text-brand-600" />}
                    description="Tình nguyện & Workshop (FE-06)"
                  />
                </>
              )}
            </div>

            {/* Charts & Quick Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">
                    Mức độ tương tác theo phân hệ (7 ngày qua)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.moduleActivity}>
                        <XAxis dataKey="module" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Lượt tương tác"
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hàng đợi cần xử lý</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(isSchoolAdmin || isAdmin) && (
                    <div
                      className="p-3 border border-blue-200 bg-blue-50/50 rounded-lg flex items-center justify-between hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/admin/school-affiliations')}
                    >
                      <div>
                        <div className="font-semibold text-sm text-blue-900">
                          Xác thực Sinh viên trường {isSchoolAdmin && user?.school ? `(${user.school})` : ''}
                        </div>
                        <span className="text-xs text-blue-700">
                          {pendingCount > 0 ? `${pendingCount} hồ sơ minh chứng đang chờ School Admin duyệt` : 'Tất cả hồ sơ đã được xử lý'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-500" />
                    </div>
                  )}

                  {!isSchoolAdmin && (
                    <>
                      <div
                        className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors"
                        onClick={() => navigate('/admin/moderation')}
                      >
                        <div>
                          <div className="font-semibold text-sm text-neutral-900">
                            Kiểm duyệt & Báo cáo vi phạm
                          </div>
                          <span className="text-xs text-neutral-500">
                            {data.metrics.openReports} báo cáo mở · {data.metrics.pendingPosts} bài chờ
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400" />
                      </div>

                      <div
                        className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors"
                        onClick={() => navigate('/admin/clubs')}
                      >
                        <div>
                          <div className="font-semibold text-sm text-neutral-900">
                            Xác minh Quyền Đại diện CLB
                          </div>
                          <span className="text-xs text-neutral-500">
                            {data.metrics.pendingRepRequests ?? data.metrics.pendingClubs} yêu cầu đang chờ
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400" />
                      </div>

                      <div
                        className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors"
                        onClick={() => navigate('/admin/programs')}
                      >
                        <div>
                          <div className="font-semibold text-sm text-neutral-900">
                            Duyệt Kênh Chương trình (FE-06)
                          </div>
                          <span className="text-xs text-neutral-500">
                            {data.metrics.pendingPrograms ?? 1} kênh Tình nguyện / Workshop chờ duyệt
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    </>
                  )}

                  {isAdmin && (
                  <div
                    className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/admin/users')}
                  >
                    <div>
                      <div className="font-semibold text-sm text-neutral-900">
                        Quản lý tài khoản sinh viên
                      </div>
                      <span className="text-xs text-neutral-500">
                        Tra cứu, khóa hoặc phân quyền
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </div>
                  )}
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
