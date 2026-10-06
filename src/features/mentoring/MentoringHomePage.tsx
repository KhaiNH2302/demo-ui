import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Newspaper,
  Search,
  Send,
  Sparkles,
  UserRoundSearch,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { MentoringRequest } from '@/types/entities';

const FLOW_STEPS = [
  { icon: UserRoundSearch, title: 'Chọn cách tìm', desc: 'Tìm trực tiếp hoặc dùng AI' },
  { icon: Search, title: 'Xem ứng viên', desc: 'So sánh hồ sơ và lý do phù hợp' },
  { icon: Send, title: 'Gửi yêu cầu', desc: 'Hệ thống kiểm tra điều kiện trước khi gửi' },
  { icon: CheckCircle2, title: 'Nhận kết quả', desc: 'Mentor chấp nhận hoặc từ chối' },
];

export const MentoringHomePage: React.FC = () => {
  const navigate = useNavigate();
  const requestsQuery = useQuery({
    queryKey: ['mentoring', 'requests', 'me'],
    queryFn: async () => {
      const data = await apiClient.get<MentoringRequest[]>('/mentoring/requests/me');
      return Array.isArray(data) ? data : [];
    },
  });

  const requests = requestsQuery.data || [];
  const recentRequests = requests.slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kết nối với Mentor"
        description="Tìm Mentor trực tiếp, nhận gợi ý từ AI hoặc kết nối qua Mentoring Feed."
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/mentoring/requests')}>
            <Send className="mr-1.5 h-4 w-4" /> Yêu cầu của tôi ({requests.length})
          </Button>
        }
      />

      <section className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">Luồng 1</span>
          <h2 className="text-base font-semibold text-neutral-900">Tìm và kết nối trực tiếp với Mentor</h2>
        </div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-3 rounded-xl border border-neutral-200 bg-surface p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                  {index + 1}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                    <Icon className="h-3.5 w-3.5 text-brand-600" /> {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-neutral-500">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card
          className="flex cursor-pointer flex-col justify-between border-2 transition-all hover:border-brand-500 hover:shadow-md"
          onClick={() => navigate('/mentoring/browse')}
        >
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <Search className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">Tìm trực tiếp</span>
              <span className="text-[11px] text-neutral-500">Không cần nhập nhu cầu trước</span>
            </div>
            <CardTitle className="text-xl">Duyệt danh sách Mentor</CardTitle>
            <p className="text-sm leading-relaxed text-neutral-600">
              Lọc theo lĩnh vực, kỹ năng và hình thức hỗ trợ; mở hồ sơ rồi tự chọn Mentor phù hợp.
            </p>
          </CardHeader>
          <CardFooter className="mt-auto border-t border-neutral-100 pt-4">
            <Button variant="secondary" className="w-full">
              Xem danh sách Mentor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="flex cursor-pointer flex-col justify-between border-2 transition-all hover:border-brand-500 hover:shadow-md"
          onClick={() => navigate('/mentoring/ai')}
        >
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Bot className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Dùng AI</span>
              <span className="text-[11px] text-neutral-500">Chỉ nhánh này mới nhập nhu cầu</span>
            </div>
            <CardTitle className="text-xl">Nhận gợi ý Mentor từ AI</CardTitle>
            <p className="text-sm leading-relaxed text-neutral-600">
              Nhập mục tiêu, kỹ năng và hình thức mong muốn. AI xếp hạng ứng viên và giải thích lý do phù hợp.
            </p>
          </CardHeader>
          <CardFooter className="mt-auto border-t border-neutral-100 pt-4">
            <Button className="w-full">
              Nhập nhu cầu cho AI <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="overflow-hidden border-2 border-violet-100 bg-gradient-to-r from-violet-50 via-surface to-surface">
        <div className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">Luồng 2</span>
                <span className="text-xs text-neutral-500">Feed dùng chung cho Student và Mentor</span>
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">Mentoring Feed</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-600">
                Lướt, tìm và lọc bài như một feed. Student đăng <strong>Need Mentor</strong>; Mentor đăng <strong>Offer Mentoring</strong>. Loại bài được tự gán theo role, không cần chọn.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/mentoring/feed')}>
            Mở Mentoring Feed <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <Clock3 className="h-4 w-4 text-brand-600" /> Yêu cầu gần đây
          </h2>
          {recentRequests.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/mentoring/requests')}>
              Xem tất cả <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <QueryBoundary query={requestsQuery}>
          {recentRequests.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-surface p-6 text-center text-sm text-neutral-500">
              Bạn chưa gửi yêu cầu mentoring nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {recentRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status={request.status} domain="mentoring" />
                    <span className="text-xs text-neutral-400">
                      {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{request.topic}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">{request.content}</p>
                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <UserMiniCard userId={request.recipientId || request.mentorId} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </QueryBoundary>
      </section>
    </div>
  );
};

export default MentoringHomePage;
