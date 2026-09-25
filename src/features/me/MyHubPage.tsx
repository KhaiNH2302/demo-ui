import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  UsersRound,
  Repeat2,
  FileText,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Bell,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';

interface MeSummaryData {
  actionItems: {
    id: string;
    type: string;
    title: string;
    count: number;
    linkTo: string;
  }[];
  counts: {
    clubs: number;
    groupsOwned: number;
    groupsJoined: number;
    openSwaps: number;
    applicationsNeedingAction: number;
    pendingMentoring: number;
    myPosts: number;
    pendingReviewPosts: number;
  };
  clubs: {
    id: string;
    name: string;
    logoUrl?: string;
    role: 'manager' | 'treasurer' | 'member';
  }[];
}

export const MyHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMentor = user?.roles.some((r) => r.toLowerCase().includes('mentor'));

  const meQuery = useQuery({
    queryKey: ['me', 'summary'],
    queryFn: () => apiClient.get<MeSummaryData>('/me/summary'),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Của tôi"
        description="Không gian quản lý tập trung các yêu cầu, nhóm, bài viết và câu lạc bộ bạn tham gia."
      />

      <QueryBoundary query={meQuery}>
        {(data) => (
          <div className="space-y-8">
            {/* 1. Việc cần xử lý */}
            {data.actionItems.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                  <Bell size={16} className="text-neutral-500" />
                  <span>Cần bạn xử lý ({data.actionItems.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.actionItems.map((item) => (
                    <Card
                      key={item.id}
                      className="p-4 flex items-center justify-between gap-4 border-neutral-200 hover:border-brand-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                          {item.type === 'swap' && <Repeat2 size={18} />}
                          {item.type === 'club' && <FileText size={18} />}
                          {item.type === 'mentoring' && <GraduationCap size={18} />}
                          {item.type === 'group' && <UsersRound size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 truncate">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> Cần phản hồi sớm
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(item.linkTo)}
                        className="shrink-0"
                      >
                        Xử lý
                      </Button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Lối tắt nhanh vào Club Workspace (CLB của tôi) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                  <Building2 size={16} className="text-brand-600" />
                  <span>Câu lạc bộ của tôi</span>
                </h2>
                <Link to="/clubs" className="text-xs font-semibold text-brand-600 hover:underline">
                  Khám phá thêm CLB →
                </Link>
              </div>

              {data.clubs.length === 0 ? (
                <Card className="p-6 text-center space-y-2">
                  <p className="text-xs text-neutral-500">Bạn chưa tham gia câu lạc bộ nào.</p>
                  <Button size="sm" variant="outline" onClick={() => navigate('/clubs')}>
                    Khám phá CLB ngay
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.clubs.map((c) => (
                    <Card
                      key={c.id}
                      onClick={() => navigate(`/clubs/${c.id}/workspace/overview`)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt={c.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0">
                            {c.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-neutral-900 truncate">{c.name}</h3>
                          <Badge
                            tier={c.role === 'manager' ? 'pending' : 'neutral'}
                            size="sm"
                            className="mt-1"
                          >
                            {c.role === 'manager'
                              ? 'Trưởng ban'
                              : c.role === 'treasurer'
                              ? 'Thủ quỹ'
                              : 'Thành viên'}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-brand-600 flex items-center gap-1 shrink-0">
                        Vào Workspace <ArrowRight size={14} />
                      </span>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* 3. Lưới các ô quản lý 6 loại hoạt động */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-900">Mục quản lý hoạt động</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Nhóm của tôi */}
                <Card
                  onClick={() => navigate('/groups/me')}
                  className="p-5 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                      <UsersRound size={20} strokeWidth={1.75} />
                    </div>
                    <ArrowRight size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Nhóm học tập</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Quản lý {data.counts.groupsOwned} nhóm • Tham gia {data.counts.groupsJoined} nhóm
                    </p>
                  </div>
                </Card>

                {/* 2. Yêu cầu đổi lớp */}
                <Card
                  onClick={() => navigate('/swap')}
                  className="p-5 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                      <Repeat2 size={20} strokeWidth={1.75} />
                    </div>
                    <ArrowRight size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Yêu cầu đổi lớp</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {data.counts.openSwaps} yêu cầu đang mở tìm đối tác
                    </p>
                  </div>
                </Card>

                {/* 3. Đơn ứng tuyển CLB */}
                <Card
                  onClick={() => navigate('/applications')}
                  className="p-5 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                      <FileText size={20} strokeWidth={1.75} />
                    </div>
                    <ArrowRight size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Đơn ứng tuyển CLB</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {data.counts.applicationsNeedingAction} đơn đang trong quá trình xét tuyển
                    </p>
                  </div>
                </Card>

                {/* 4. Mentoring */}
                <Card
                  onClick={() => navigate('/mentoring/requests')}
                  className="p-5 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                      <GraduationCap size={20} strokeWidth={1.75} />
                    </div>
                    <ArrowRight size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Yêu cầu Mentoring</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {data.counts.pendingMentoring} yêu cầu đã gửi cho Mentor
                    </p>
                  </div>
                </Card>

                {/* 5. Bài viết của tôi */}
                <Card
                  onClick={() => navigate('/knowledge/me')}
                  className="p-5 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                      <BookOpen size={20} strokeWidth={1.75} />
                    </div>
                    <ArrowRight size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Bài viết kiến thức</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {data.counts.myPosts} đã đăng • {data.counts.pendingReviewPosts} chờ duyệt
                    </p>
                  </div>
                </Card>

                {/* 6. Mentor Center (nếu có role Mentor) */}
                {isMentor && (
                  <Card
                    onClick={() => navigate('/mentor/profile')}
                    className="p-5 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all space-y-3 bg-brand-50/40 border-brand-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                        <GraduationCap size={20} strokeWidth={1.75} />
                      </div>
                      <ArrowRight size={16} className="text-brand-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-brand-900">Mentor Center</h3>
                      <p className="text-xs text-brand-700 mt-1">
                        Quản lý bài đăng hướng dẫn và yêu cầu nhận được
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </section>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
};

export default MyHubPage;
