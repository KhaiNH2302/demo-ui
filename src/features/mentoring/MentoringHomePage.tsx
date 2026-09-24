import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Search, Clock, ArrowRight, UserCheck, HelpCircle } from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';

export const MentoringHomePage: React.FC = () => {
  const navigate = useNavigate();

  const requestsQuery = useQuery({
    queryKey: ['mentoring', 'requests', 'me'],
    queryFn: () => apiClient.get<MentoringRequest[]>('/mentoring/requests/me'),
  });

  const recentRequests = (requestsQuery.data || []).slice(0, 3);

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
            Yêu cầu của tôi ({requestsQuery.data?.length || 0})
          </Button>
        }
      />

      {/* 2 Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: AI Search */}
        <Card className="flex flex-col justify-between hover:border-primary transition-colors cursor-pointer border-2" onClick={() => navigate('/mentoring/ai')}>
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Tìm Mentor bằng AI</CardTitle>
            <p className="text-sm text-[var(--text-muted)]">
              Nhập môn học, chủ đề cần gỡ rối và thời gian mong muốn. Hệ thống AI sẽ tự động phân tích và tìm Mentor có lịch rảnh cùng chuyên môn tương thích nhất.
            </p>
          </CardHeader>
          <CardFooter className="border-t border-[var(--border-subtle)] pt-4">
            <Button className="w-full">
              Khám phá gợi ý AI <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Option 2: Browse Manually */}
        <Card className="flex flex-col justify-between hover:border-primary transition-colors cursor-pointer border-2" onClick={() => navigate('/mentoring/browse')}>
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] text-[var(--text-main)] flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Tự duyệt danh sách Mentor</CardTitle>
            <p className="text-sm text-[var(--text-muted)]">
              Duyệt qua danh bạ toàn bộ các Mentor theo chuyên ngành, đọc bài chia sẻ kinh nghiệm môn học và chủ động chọn người hỗ trợ phù hợp.
            </p>
          </CardHeader>
          <CardFooter className="border-t border-[var(--border-subtle)] pt-4">
            <Button variant="secondary" className="w-full">
              Duyệt danh sách Mentor <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Yêu cầu hỗ trợ gần đây của bạn
          </h3>
          {recentRequests.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/mentoring/requests')}>
              Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>

        <QueryBoundary queries={[requestsQuery]}>
          {recentRequests.length === 0 ? (
            <div className="p-6 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-sm text-[var(--text-muted)]">
              Bạn chưa gửi yêu cầu tư vấn Mentoring nào gần đây.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentRequests.map((req) => (
                <Card key={req.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={req.status} domain="mentoring" />
                    <span className="text-xs text-[var(--text-subtle)]">
                      {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm line-clamp-1">{req.topic}</h4>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">
                      {req.content}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
};

export default MentoringHomePage;
