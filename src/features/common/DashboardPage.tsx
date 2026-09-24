import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { ActionStrip, type ActionItem } from '@/components/shared/ActionStrip';
import { FeedCard } from '@/components/shared/FeedCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  Sparkles,
  Repeat2,
  UsersRound,
  Calendar,
  BookOpen,
  GraduationCap,
  MessageCircle,
  ArrowRight,
  Send,
  Plus,
  Compass,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

import DiscoverPage from '@/features/discover/DiscoverPage';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mobileTab, setMobileTab] = useState<'feed' | 'discover'>('feed');

  // Fetch pending action items
  const actionItemsQuery = useQuery({
    queryKey: ['dashboard', 'action-items'],
    queryFn: async () => {
      // Mock data for action strip
      const items: ActionItem[] = [
        {
          id: 'act_1',
          type: 'swap',
          title: 'Lời mời đổi lớp PRN231 cần xác nhận',
          count: 2,
          linkTo: '/swap/connections',
        },
        {
          id: 'act_2',
          type: 'group',
          title: 'Yêu cầu gia nhập nhóm SWP391',
          count: 1,
          linkTo: '/groups/me',
        },
        {
          id: 'act_3',
          type: 'club',
          title: 'Đơn tuyển CLB JS Club có lịch phỏng vấn',
          count: 1,
          linkTo: '/applications',
        },
        {
          id: 'act_4',
          type: 'mentoring',
          title: 'Yêu cầu tư vấn CSD201 đang chờ phản hồi',
          count: 1,
          linkTo: '/mentoring/requests',
        },
      ];
      return items;
    },
  });

  return (
    <div className="space-y-6">
      {/* Mobile Tab Switcher between Feed and Discover */}
      <div className="md:hidden flex items-center justify-center pb-1">
        <SegmentedControl
          options={[
            { value: 'feed', label: 'Bảng tin hoạt động', icon: Sparkles },
            { value: 'discover', label: 'Khám phá cộng đồng', icon: Compass },
          ]}
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as any)}
          size="md"
          fullWidth
        />
      </div>

      {mobileTab === 'discover' ? (
        <DiscoverPage />
      ) : (
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/60 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Xin chào, {user?.fullName || 'Sinh viên'} 👋
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Cập nhật các hoạt động học tập, kết nối lớp học và sự kiện mới nhất tại trường
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => navigate('/swap/new')} leftIcon={<Repeat2 size={15} />}>
                Đổi lịch học
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/discover')} leftIcon={<Compass size={15} />}>
                Khám phá
              </Button>
            </div>
          </div>

          {/* Action Strip: Urgent Pending Tasks */}
          <ActionStrip items={actionItemsQuery.data || []} />

          {/* Social Activity Feed (Infinite Stream Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
            {/* Main Stream (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-brand-500" /> Bảng tin tổng hợp
                </h3>
                <span className="text-xs text-neutral-400">Tự động gợi ý theo hồ sơ</span>
              </div>

              {/* Feed Card 1: Swap Match Recommendation */}
              <FeedCard
                kind="swap-match"
                context="Gợi ý hoán đổi lớp học · Đối ứng hoàn hảo"
                badgeText="Độ khớp 98%"
                badgeVariant="success"
                actions={
                  <>
                    <span className="text-xs text-neutral-500">Môn: SWP391 • Kỳ Fall 2026</span>
                    <Button size="sm" onClick={() => navigate('/swap')}>
                      Xem & Gửi lời mời <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </>
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name="Trần Văn Minh" size="md" />
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">Trần Văn Minh</h4>
                        <p className="text-[11px] text-neutral-400">Đại học FPT Hà Nội</p>
                      </div>
                    </div>
                    <Badge tier="success">Đối ứng hoàn hảo</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Lớp của Minh:</span>
                      <span className="font-bold text-neutral-800">SE1701 (Thứ 2, 4, 6)</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Lớp mong muốn:</span>
                      <span className="font-bold text-brand-600">SE1703 (Lớp của bạn)</span>
                    </div>
                  </div>
                </div>
              </FeedCard>

              {/* Feed Card 2: AI Group Suggestion */}
              <FeedCard
                kind="group-suggestion"
                context="Gợi ý nhóm học tập · AI Match"
                badgeText="Khớp 95% kỹ năng"
                badgeVariant="brand"
                actions={
                  <>
                    <span className="text-xs text-neutral-500">Còn trống 2 vị trí thành viên</span>
                    <Button size="sm" variant="outline" onClick={() => navigate('/groups')}>
                      Xem nhóm <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </>
                }
              >
                <div className="space-y-2.5">
                  <h4 className="text-base font-bold text-neutral-900">
                    Nhóm làm đồ án Tốt nghiệp Capstone Project — AI & Web App
                  </h4>
                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    Nhóm đã có 3 thành viên phụ trách Backend và Mobile. Cần tuyển thêm 1 bạn làm Frontend React và 1 bạn Tester có kiến thức Automation.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">Spring Boot</Badge>
                    <Badge variant="secondary">FastAPI</Badge>
                  </div>
                </div>
              </FeedCard>

              {/* Feed Card 3: Knowledge Document Sharing */}
              <FeedCard
                kind="knowledge"
                context="Tài liệu nổi bật · CSD201"
                badgeText="Tài liệu"
                badgeVariant="attention"
                actions={
                  <>
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <MessageCircle size={14} /> 12 thảo luận • 45 lượt tải
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/knowledge')}>
                      Đọc chi tiết <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </>
                }
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar name="Lê Hoàng Long" size="sm" />
                    <span className="text-xs font-semibold text-neutral-800">Lê Hoàng Long</span>
                    <span className="text-xs text-neutral-400">• 2 giờ trước</span>
                  </div>
                  <h4 className="text-base font-bold text-neutral-900 hover:text-brand-600 transition-colors">
                    Tổng hợp bộ đề ôn thi Practical Exam CSD201 có lời giải mẫu các thuật toán Tree & Graph
                  </h4>
                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    Tài liệu bao gồm 15 bài toán cốt lõi môn Cấu trúc dữ liệu và Giải thuật thường ra trong đề thi Practical Exam tại Đại học FPT, kèm code Java chuẩn tối ưu.
                  </p>
                </div>
              </FeedCard>

              {/* Feed Card 4: Club Event */}
              <FeedCard
                kind="event"
                context="Sự kiện CLB sắp diễn ra · F-Code Club"
                badgeText="Mở đăng ký"
                badgeVariant="pending"
                actions={
                  <>
                    <span className="text-xs text-neutral-500">Địa điểm: Hội trường Alpha, FPTU</span>
                    <Button size="sm" onClick={() => navigate('/clubs')}>
                      Đăng ký tham gia <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </>
                }
              >
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-neutral-900">
                    Workshop: Làm chủ AI Prompt Engineering & Ứng dụng GitHub Copilot cho sinh viên CNTT
                  </h4>
                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    Diễn giả từ cựu sinh viên FPT Software chia sẻ kinh nghiệm ứng dụng AI Agent và công cụ sinh code thông minh trong các dự án thực tế.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-brand-500" /> Thứ 7, 28/09/2026 (08:30 - 11:30)
                    </span>
                  </div>
                </div>
              </FeedCard>
            </div>

            {/* Right Sidebar: Shortcuts & Highlights (1 col) */}
            <div className="space-y-6">
              {/* Quick Profile Summary */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar src={user?.avatarUrl} name={user?.fullName} size="lg" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-neutral-900 truncate">{user?.fullName}</h4>
                    <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                    <Badge tier="brand" size="sm" className="mt-1">
                      Sinh viên FPTU
                    </Badge>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>Mức độ hoàn thiện hồ sơ</span>
                  <span className="font-bold text-brand-600">85%</span>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/profile/me')}>
                  Cập nhật tiêu chí Matching
                </Button>
              </div>

              {/* Quick Discover Tiles */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Khám phá nhanh
                </h4>

                <div className="space-y-2">
                  <div
                    onClick={() => navigate('/discover?tab=groups')}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-brand-300 hover:bg-brand-50/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <UsersRound size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800">Tìm nhóm học tập</p>
                        <p className="text-[11px] text-neutral-400">18 nhóm đang tuyển thành viên</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-neutral-400" />
                  </div>

                  <div
                    onClick={() => navigate('/discover?tab=clubs')}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-brand-300 hover:bg-brand-50/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800">CLB & Tổ chức sinh viên</p>
                        <p className="text-[11px] text-neutral-400">6 CLB đang mở đợt tuyển</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-neutral-400" />
                  </div>

                  <div
                    onClick={() => navigate('/discover?tab=mentors')}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-brand-300 hover:bg-brand-50/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800">Mentor hướng dẫn</p>
                        <p className="text-[11px] text-neutral-400">Tư vấn 1-1 qua AI & Chat</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-neutral-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
