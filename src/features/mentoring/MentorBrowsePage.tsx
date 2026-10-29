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

const SUBJECT_OPTIONS = [
  { label: 'Tất cả môn học', value: 'all' },
  { label: 'CSD201 - Data Structures & Algorithms', value: 'CSD201' },
  { label: 'PRJ301 - Java Web Development', value: 'PRJ301' },
  { label: 'SWE201c - Software Engineering', value: 'SWE201c' },
  { label: 'MAS291 - Statistics & Probability', value: 'MAS291' },
  { label: 'PRF192 - Programming Fundamentals', value: 'PRF192' },
  { label: 'MAD101 - Discrete Mathematics', value: 'MAD101' },
  { label: 'SWP391 - Software Project', value: 'SWP391' },
];

const MODE_OPTIONS = [
  { label: 'Tất cả hình thức học', value: 'all' },
  { label: 'Online qua Meet / Zoom', value: 'online' },
  { label: 'Trực tiếp tại trường (Offline)', value: 'offline' },
  { label: 'Trao đổi qua Chat', value: 'chat' },
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
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
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
      if (field !== 'all' && !FIELD_KEYWORDS[field]?.some((keyword) => searchable.includes(keyword))) return false;
      if (subjectFilter !== 'all' && !mentor.subjects.some((s) => s.toLowerCase() === subjectFilter.toLowerCase())) return false;
      if (modeFilter !== 'all' && !mentor.supportModes.includes(modeFilter as any)) return false;
      return true;
    });
  }, [field, mentorsQuery.data, modeFilter, search, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(mentors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleMentors = mentors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm Mentor trực tiếp"
        description="Lọc danh sách theo môn học, hình thức học và gửi yêu cầu kết nối trực tiếp trong app."
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring', href: '/mentoring' }, { label: 'Tìm trực tiếp' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/mentoring/ai')}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Chuyển sang gợi ý AI
          </Button>
        }
      />

      <div className="rounded-xl border border-neutral-200 bg-surface p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tìm theo kỹ năng, kinh nghiệm..."
          />
          <Select
            value={subjectFilter}
            onChange={(event) => {
              setSubjectFilter(event.target.value);
              setPage(1);
            }}
            options={SUBJECT_OPTIONS}
          />
          <Select
            value={modeFilter}
            onChange={(event) => {
              setModeFilter(event.target.value);
              setPage(1);
            }}
            options={MODE_OPTIONS}
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
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Search className="h-3.5 w-3.5" /> Lọc theo môn học trường, hình thức học và khung giờ rảnh để tìm Mentor phù hợp nhất.
        </p>
      </div>

      <QueryBoundary query={mentorsQuery}>
        {mentors.length === 0 ? (
          <EmptyState title="Không tìm thấy Mentor" description="Hãy thử từ khóa, môn học hoặc hình thức học khác." />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">Tìm thấy {mentors.length} Mentor</p>
              <p className="text-xs text-neutral-500">Hiển thị {visibleMentors.length} hồ sơ trên trang này</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleMentors.map((mentor) => (
                <Card key={mentor.userId} className="flex flex-col justify-between hover:border-brand-300 transition-all shadow-2xs">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        🟢 Còn trống tuần này
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⭐ 4.9 (42)
                      </div>
                    </div>
                    <UserMiniCard userId={mentor.userId} showMajor />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-150">
                      <span>Đã kèm: <strong className="text-neutral-900">38 buổi</strong></span>
                      <span>Học phí: <strong className="text-brand-700">{(mentor as any).hourlyRate ? `${(mentor as any).hourlyRate.toLocaleString()}đ/buổi` : '120.000đ/buổi'}</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.subjects.slice(0, 4).map((subject) => <Chip key={subject} size="sm" className="font-semibold text-brand-700 bg-brand-50 border-brand-200">{subject}</Chip>)}
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600">{mentor.experience}</p>
                    <p className="text-xs text-neutral-500">Hình thức: {mentor.supportModes.join(' • ')}</p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/mentoring/mentors/${mentor.userId}`)}>
                      Xem hồ sơ <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" disabled={!mentor.acceptingRequests} onClick={() => setSelectedMentorId(mentor.userId)} variant="primary">
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
