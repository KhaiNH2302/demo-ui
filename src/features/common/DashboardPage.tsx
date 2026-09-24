import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Repeat2,
  UsersRound,
  Building2,
  Sparkles,
  CalendarDays,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => apiClient.get('/dashboard/summary') as Promise<{
      metrics: {
        openSwaps: number;
        pendingSwapConns: number;
        pendingGroupRequests: number;
        myClubApps: number;
        pendingMentoring: number;
        upcomingEvents: number;
        recentPosts: number;
      };
      actionItems: { id: string; title: string; linkTo: string; type: string; time: string }[];
    }>,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Xin chào, ${user?.fullName || 'Sinh viên'}! 👋`}
        description="Chào mừng bạn quay trở lại với Hệ thống kết nối sinh viên SCS"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/swap/new">
              <Button size="sm" variant="outline" leftIcon={<Repeat2 size={14} />}>
                Đổi lớp
              </Button>
            </Link>
            <Link to="/groups/new">
              <Button size="sm" variant="outline" leftIcon={<UsersRound size={14} />}>
                Tạo nhóm
              </Button>
            </Link>
          </div>
        }
      />

      <QueryBoundary query={summaryQuery}>
        {(data) => (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={Repeat2}
                label="Yêu cầu Đổi lớp mở"
                value={data.metrics.openSwaps}
                tone="pending"
                onClick={() => navigate('/swap')}
              />
              <SummaryCard
                icon={UsersRound}
                label="Lời mời & Yêu cầu nhóm"
                value={data.metrics.pendingGroupRequests}
                tone="attention"
                onClick={() => navigate('/groups/me')}
              />
              <SummaryCard
                icon={Sparkles}
                label="Mentoring đang chờ"
                value={data.metrics.pendingMentoring}
                tone="brand"
                onClick={() => navigate('/mentoring/requests')}
              />
              <SummaryCard
                icon={CalendarDays}
                label="Sự kiện CLB sắp tới"
                value={data.metrics.upcomingEvents}
                tone="success"
                onClick={() => navigate('/clubs')}
              />
            </div>

            {/* 2-column layout for Action Items & Quick Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2-col: Việc cần xử lý */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-neutral-900">
                        <CheckCircle2 size={18} className="text-brand-600" /> Việc cần xử lý
                      </CardTitle>
                      <Badge tier="attention" size="sm">
                        {data.actionItems.length} mục
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="divide-y divide-neutral-100">
                    {data.actionItems.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400">
                        Tuyệt vời! Không có việc nào đang chờ bạn xử lý.
                      </div>
                    ) : (
                      data.actionItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => navigate(item.linkTo)}
                          className="flex items-center justify-between py-3 px-2 hover:bg-neutral-50 rounded-md transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-neutral-900 truncate">{item.title}</p>
                              <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
                                <Clock size={12} /> {item.time}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-brand-600 hover:text-brand-700 shrink-0">
                            Xem ngay <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Quick explore banners */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => navigate('/swap/new')}
                    className="p-4 rounded-xl border border-brand-200 bg-brand-50/40 hover:bg-brand-50/70 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Đăng bài Đổi Lớp mới</h4>
                      <p className="text-[11px] text-neutral-600 mt-0.5">Tìm bạn đối ứng đổi mã lớp với AI matching</p>
                    </div>
                    <Repeat2 size={24} className="text-brand-600 shrink-0 ml-2" />
                  </div>

                  <div
                    onClick={() => navigate('/mentoring/ai')}
                    className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Tìm Mentor với AI</h4>
                      <p className="text-[11px] text-neutral-600 mt-0.5">Nhập nhu cầu học tập để nhận gợi ý Mentor phù hợp</p>
                    </div>
                    <Sparkles size={24} className="text-indigo-600 shrink-0 ml-2" />
                  </div>
                </div>
              </div>

              {/* Right column: Quick Navigation & Stats */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Khám phá module SCS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link
                      to="/knowledge"
                      className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-medium text-neutral-800">
                        <BookOpen size={16} className="text-emerald-600" />
                        <span>Kho kiến thức & Tài liệu</span>
                      </div>
                      <Badge tier="neutral" size="sm">{data.metrics.recentPosts}</Badge>
                    </Link>

                    <Link
                      to="/clubs"
                      className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-medium text-neutral-800">
                        <Building2 size={16} className="text-blue-600" />
                        <span>Câu lạc bộ sinh viên</span>
                      </div>
                      <Badge tier="neutral" size="sm">F-Code, JS...</Badge>
                    </Link>

                    <Link
                      to="/groups"
                      className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-medium text-neutral-800">
                        <UsersRound size={16} className="text-purple-600" />
                        <span>Nhóm học tập & Đồ án</span>
                      </div>
                      <Badge tier="neutral" size="sm">SWP391...</Badge>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 text-white p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
                    <Sparkles size={16} /> SCS Smart Matching 2026
                  </div>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                    Hệ thống ứng dụng thuật toán so khớp lịch học tự khai kết hợp AI giúp tăng tỷ lệ kết nối đổi lớp và tìm bạn đồng hành lên đến 92%.
                  </p>
                  <Link to="/profile/me">
                    <Button variant="secondary" size="sm" className="w-full mt-4 bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700">
                      Cập nhật tiêu chí matching
                    </Button>
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
