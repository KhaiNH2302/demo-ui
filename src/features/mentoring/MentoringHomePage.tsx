import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Search, Clock, ArrowRight } from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';

export const MentoringHomePage: React.FC = () => {
  const navigate = useNavigate();

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
        title="Tư vấn & Hướng dẫn học tập (Mentoring)"
        description="Kết nối với các sinh viên khóa trên và Mentor xuất sắc để nhận trợ giúp học tập và định hướng"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentoring' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/mentoring/requests')}>
            Yêu cầu của tôi ({requestList.length})
          </Button>
        }
      />

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
            <Clock className="w-4 h-4 text-brand-600" /> Yêu cầu hỗ trợ gần đây của bạn
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
                <div className="p-6 rounded-xl bg-white border border-neutral-200 text-center text-sm text-neutral-500 shadow-xs">
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
                  </Card>
                ))}
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </div>
  );
};

export default MentoringHomePage;
