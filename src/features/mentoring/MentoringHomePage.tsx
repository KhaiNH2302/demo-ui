import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { useAuthStore } from '@/store/authStore';
import {
  Sparkles,
  Search,
  Clock,
  ArrowRight,
  PencilLine,
  Send,
  Hourglass,
  GraduationCap,
} from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';

// Luồng FE-05 phía Học viên (specs/flows/FE05 § 4 — bước 1 → 7)
const STUDENT_STEPS = [
  { icon: PencilLine, title: 'Mô tả nhu cầu', desc: 'Môn học, nội dung, thời gian, hình thức' },
  { icon: Search, title: 'Chọn cách tìm', desc: 'Gợi ý AI hoặc tự duyệt danh sách' },
  { icon: Send, title: 'Gửi yêu cầu', desc: 'Chọn Mentor phù hợp và gửi request' },
  { icon: Hourglass, title: 'Chờ Mentor phản hồi', desc: 'Chấp nhận → mở chat trao đổi' },
];

export const MentoringHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMentor = user?.roles?.some((r) => r.toLowerCase() === 'mentor');

  const requestsQuery = useQuery({
    queryKey: ['mentoring', 'requests', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<MentoringRequest[]>('/mentoring/requests/me');
      return Array.isArray(res) ? res : [];
    },
  });

  const requestList = Array.isArray(requestsQuery.data) ? requestsQuery.data : [];
  const recentRequests = requestList.slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tìm Mentor"
        description="Dành cho học viên: mô tả điều bạn cần hỗ trợ, tìm Mentor phù hợp và gửi yêu cầu mentoring"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentoring · Học viên' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/mentoring/requests')}>
            <Send className="w-4 h-4 mr-1.5" /> Yêu cầu đã gửi ({requestList.length})
          </Button>
        }
      />

      {/* Các bước của luồng học viên */}
      <ol className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STUDENT_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-surface p-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-sm font-semibold">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-brand-600" /> {step.title}
                </p>
                <p className="text-xs text-neutral-500 leading-snug mt-0.5">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* 2 Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: AI Search */}
        <Card
          className="flex flex-col justify-between hover:border-brand-500 hover:shadow-md transition-all cursor-pointer border-2"
          onClick={() => navigate('/mentoring/ai')}
        >
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Tìm Mentor bằng AI</CardTitle>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Nhập môn học, chủ đề cần gỡ rối và thời gian mong muốn. Hệ thống AI sẽ tự động phân tích và tìm Mentor có lịch rảnh cùng chuyên môn tương thích nhất.
            </p>
          </CardHeader>
          <CardFooter className="border-t border-neutral-100 pt-4 mt-auto">
            <Button className="w-full">
              Khám phá gợi ý AI <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Option 2: Browse Manually */}
        <Card
          className="flex flex-col justify-between hover:border-brand-500 hover:shadow-md transition-all cursor-pointer border-2"
          onClick={() => navigate('/mentoring/browse')}
        >
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Tự duyệt danh sách Mentor</CardTitle>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Duyệt qua danh bạ toàn bộ các Mentor theo chuyên ngành, đọc bài chia sẻ kinh nghiệm môn học và chủ động chọn người hỗ trợ phù hợp.
            </p>
          </CardHeader>
          <CardFooter className="border-t border-neutral-100 pt-4 mt-auto">
            <Button variant="secondary" className="w-full">
              Duyệt danh sách Mentor <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2 text-neutral-900">
            <Clock className="w-4 h-4 text-brand-600" /> Yêu cầu bạn đã gửi gần đây
          </h3>
          {recentRequests.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/mentoring/requests')}>
              Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>

        <QueryBoundary query={requestsQuery}>
          {() => {
            if (recentRequests.length === 0) {
              return (
                <div className="p-6 rounded-xl bg-surface border border-neutral-200 text-center text-sm text-neutral-500 shadow-xs">
                  Bạn chưa gửi yêu cầu tư vấn Mentoring nào gần đây.
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentRequests.map((req) => (
                  <Card key={req.id} className="p-4 space-y-3 hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={req.status} domain="mentoring" />
                      <span className="text-xs text-neutral-400">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1 text-neutral-900">{req.topic}</h4>
                      <p className="text-xs text-neutral-600 line-clamp-2 mt-1 leading-relaxed">
                        {req.content}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-neutral-100">
                      <span className="text-[11px] text-neutral-500 block mb-1">Gửi tới Mentor</span>
                      <UserMiniCard userId={req.mentorId} />
                    </div>
                  </Card>
                ))}
              </div>
            );
          }}
        </QueryBoundary>
      </div>

      {/* Học viên chưa là Mentor: lối vào đăng ký (MR0) */}
      {!isMentor && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-neutral-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Bạn muốn giúp đỡ người khác?</p>
              <p className="text-xs text-neutral-600">
                Đăng ký làm Mentor, sau khi Admin duyệt bạn sẽ có Mentor Center để nhận yêu cầu.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/mentor/apply')}>
            Trở thành Mentor <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MentoringHomePage;
