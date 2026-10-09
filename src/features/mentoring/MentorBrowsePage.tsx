import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, Send, Sparkles, Users } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { Mentor } from '@/types/entities';

const PAGE_SIZE = 6;

const FIELD_OPTIONS = [
  { label: 'Tất cả chuyên ngành', value: 'all' },
  { label: 'Kỹ thuật phần mềm (SE)', value: 'software' },
  { label: 'An toàn thông tin (IA)', value: 'security' },
  { label: 'Trí tuệ nhân tạo (AI)', value: 'ai' },
  { label: 'Thiết kế đồ họa (GD)', value: 'design' },
];

const FIELD_KEYWORDS: Record<string, string[]> = {
  software: ['phần mềm', 'software', 'web', 'react', 'java', 'kiến trúc', 'công nghệ'],
  security: ['an toàn', 'bảo mật', 'security', 'ia'],
  ai: ['trí tuệ', 'ai', 'machine learning', 'data'],
  design: ['thiết kế', 'đồ họa', 'design', 'gd'],
};

export const MentorBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [field, setField] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  const mentorsQuery = useQuery({
    queryKey: ['mentoring', 'mentors'],
    queryFn: () => apiClient.get<Mentor[]>('/mentoring/mentors'),
  });

  const mentors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (mentorsQuery.data || []).filter((mentor) => {
      const searchable = [...mentor.fields, ...mentor.subjects, mentor.experience].join(' ').toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (field !== 'all' && !FIELD_KEYWORDS[field].some((keyword) => searchable.includes(keyword))) return false;
      return true;
    });
  }, [field, mentorsQuery.data, search]);

  const totalPages = Math.max(1, Math.ceil(mentors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleMentors = mentors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm Mentor trực tiếp"
        description="Lọc danh sách, xem hồ sơ và tự chọn Mentor. Bạn không cần nhập nhu cầu trước ở nhánh này."
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring', href: '/mentoring' }, { label: 'Tìm trực tiếp' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/mentoring/ai')}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Chuyển sang gợi ý AI
          </Button>
        }
      />

      <div className="rounded-xl border border-neutral-200 bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tìm theo kỹ năng, môn học hoặc kinh nghiệm..."
          />
          <Select
            value={field}
            onChange={(event) => {
              setField(event.target.value);
              setPage(1);
            }}
            options={FIELD_OPTIONS}
          />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
          <Search className="h-3.5 w-3.5" /> SCS lọc danh sách và chỉ hiển thị các Mentor phù hợp với bộ lọc hiện tại.
        </p>
      </div>

      <QueryBoundary query={mentorsQuery}>
        {mentors.length === 0 ? (
          <EmptyState title="Không tìm thấy Mentor" description="Hãy thử từ khóa hoặc chuyên ngành khác." />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">Tìm thấy {mentors.length} Mentor</p>
              <p className="text-xs text-neutral-500">Hiển thị {visibleMentors.length} hồ sơ trên trang này</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleMentors.map((mentor) => (
                <Card key={mentor.userId} className="flex flex-col justify-between">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={mentor.acceptingRequests ? 'success' : 'neutral'} dot>
                        {mentor.acceptingRequests ? 'Đang nhận yêu cầu' : 'Tạm dừng nhận'}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Users className="h-3.5 w-3.5" /> {mentor.menteesCount || 0} mentee
                      </span>
                    </div>
                    <UserMiniCard userId={mentor.userId} showMajor />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.subjects.slice(0, 4).map((subject) => <Chip key={subject} size="sm">{subject}</Chip>)}
                    </div>
                    <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600">{mentor.experience}</p>
                    <p className="text-xs text-neutral-500">Hình thức: {mentor.supportModes.join(' • ')}</p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/mentoring/mentors/${mentor.userId}`)}>
                      Xem hồ sơ <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" disabled={!mentor.acceptingRequests} onClick={() => setSelectedMentorId(mentor.userId)}>
                      <Send className="mr-1 h-3.5 w-3.5" /> Gửi yêu cầu
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={mentors.length}
              onChange={setPage}
            />
          </div>
        )}
      </QueryBoundary>

      {selectedMentorId && (
        <SendMentoringRequestDialog
          open
          onOpenChange={(open) => !open && setSelectedMentorId(null)}
          mentorId={selectedMentorId}
        />
      )}
    </div>
  );
};

export default MentorBrowsePage;
