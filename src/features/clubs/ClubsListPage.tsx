import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Plus, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import type { Club } from '@/types/entities';

export const ClubsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [field, setField] = useState('all');

  const clubsQuery = useQuery({
    queryKey: queryKeys.clubs.list({ q: search || undefined, field: field !== 'all' ? field : undefined }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (field !== 'all') params.append('field', field);
      return apiClient.get<Club[]>(`/clubs?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Câu lạc bộ & Tổ chức sinh viên"
        description="Khám phá các câu lạc bộ học thuật, kỹ năng, thể thao và nghệ thuật tại trường"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Câu lạc bộ' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/applications')}>
              Đơn ứng tuyển của tôi
            </Button>
            <Button onClick={() => navigate('/clubs/register')}>
              <Plus className="w-4 h-4 mr-1.5" /> Đăng ký CLB mới
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm kiếm câu lạc bộ theo tên hoặc từ khóa..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={field}
            onChange={(e) => setField(e.target.value)}
            options={[
              { label: 'Tất cả lĩnh vực', value: 'all' },
              { label: 'Công nghệ thông tin', value: 'Công nghệ thông tin' },
              { label: 'Công nghệ & Ngôn ngữ', value: 'Công nghệ & Ngôn ngữ' },
              { label: 'Nghệ thuật & Âm nhạc', value: 'Nghệ thuật' },
              { label: 'Thể thao & Sức khỏe', value: 'Thể thao' },
              { label: 'Tình nguyện & Xã hội', value: 'Tình nguyện' },
              { label: 'Kỹ năng & Khởi nghiệp', value: 'Kỹ năng' },
            ]}
          />
        </div>
      </div>

      <QueryBoundary queries={[clubsQuery]}>
        {clubsQuery.data && clubsQuery.data.length === 0 ? (
          <EmptyState
            title="Không tìm thấy câu lạc bộ nào"
            description="Hãy thử thay đổi từ khóa hoặc bộ lọc lĩnh vực."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubsQuery.data?.map((club) => (
              <Card key={club.id} className="flex flex-col justify-between hover:border-brand-300 hover:shadow-md transition-all">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="truncate">{club.field}</Badge>
                    <Badge variant="success" className="text-xs shrink-0">
                      <Sparkles className="w-3 h-3 mr-1" /> Đang tuyển thành viên
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    {club.logoUrl ? (
                      <img
                        src={club.logoUrl}
                        alt={club.name}
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-100 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg shrink-0">
                        {club.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-bold text-neutral-900 line-clamp-1">{club.name}</CardTitle>
                      <span className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-neutral-400" /> FPT University
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed min-h-[4rem]">
                    {club.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-auto">
                  <span className="text-xs text-neutral-500 font-medium">
                    CLB Hoạt động tích cực
                  </span>
                  <Button size="sm" onClick={() => navigate(`/clubs/${club.id}`)}>
                    Xem chi tiết <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
};

export default ClubsListPage;
