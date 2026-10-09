import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Send, Sparkles, Users } from 'lucide-react';
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

const DEMO_MENTORS: Mentor[] = [
  { userId: 'usr_mentor_02', fields: ['Kỹ thuật phần mềm'], subjects: ['CSD201', 'PRJ301', 'SWP391', 'Java'], experience: 'Đã hoàn thành 5 dự án thực tế, Top 5 ACM-ICPC vòng Quốc gia, GPA 3.8/4.0.', availability: [], supportModes: ['online', 'offline', 'chat'], acceptingRequests: true, menteesCount: 24 },
  { userId: 'usr_mentor_01', fields: ['Kỹ thuật phần mềm'], subjects: ['PRJ301', 'SWP391', 'PRN231', 'Clean Architecture'], experience: 'Kỹ sư phần mềm tại FPT Software, hơn 2 năm hướng dẫn đồ án Capstone và SWP391.', availability: [], supportModes: ['online', 'chat'], acceptingRequests: true, menteesCount: 18 },
];

export const MentorBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const activeTab = params.get('tab') || 'mentors';
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
    return DEMO_MENTORS.filter((mentor) => {
      const searchable = [...mentor.fields, ...mentor.subjects, mentor.experience].join(' ').toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (field !== 'all' && !FIELD_KEYWORDS[field].some((keyword) => searchable.includes(keyword))) return false;
      return true;
    });
  }, [field, search]);

  const totalPages = Math.max(1, Math.ceil(mentors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleMentors = mentors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh bạ Mentor & Lớp học"
        description="Tìm kiếm Mentor theo chuyên ngành hoặc tham gia các lớp chia sẻ kiến thức cộng đồng"
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring', href: '/mentoring' }, { label: 'Tìm trực tiếp' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/mentoring/ai')}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Tìm bằng AI
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
            placeholder="Tìm theo tên, chuyên ngành, môn học..."
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
      </div>

      <div className="flex items-center gap-6 border-b border-neutral-200 text-sm">
        <button type="button" onClick={() => navigate('/mentoring/browse')} className={activeTab === 'posts' ? 'px-1 pb-3 text-neutral-500' : 'border-b-2 border-brand-600 px-1 pb-3 font-semibold text-brand-700'}>Mentor (2)</button>
        <button type="button" onClick={() => navigate('/mentoring/browse?tab=posts')} className={activeTab === 'posts' ? 'border-b-2 border-brand-600 px-1 pb-3 font-semibold text-brand-700' : 'px-1 pb-3 text-neutral-500'}>Lớp học / Bài đăng (4)</button>
      </div>

      {activeTab === 'posts' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {['Lớp ôn luyện Practical CSD201 & Thuật toán Cây/Đồ thị', 'Checklist siêu chi tiết ôn đồ án SWP391: Tránh bị trượt vòng Review kiến trúc', 'Thực chiến Frontend React & TypeScript', 'Hỏi đáp nhanh về Java Spring Boot'].map((title) => (
            <Card key={title} className="p-5"><Badge variant="secondary">Bài chia sẻ</Badge><h3 className="mt-3 text-base font-semibold text-neutral-900">{title}</h3><p className="mt-2 text-sm leading-relaxed text-neutral-600">Chia sẻ kinh nghiệm học tập và hướng dẫn thực hành từ Mentor trong cộng đồng SCS.</p><Button className="mt-4" variant="outline" size="sm" onClick={() => navigate('/mentoring/posts/mpost_01')}>Xem bài đăng <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Card>
          ))}
        </div>
      ) : null}

      {activeTab !== 'posts' && <QueryBoundary query={mentorsQuery}>
        {mentors.length === 0 ? (
          <EmptyState title="Không tìm thấy Mentor" description="Hãy thử từ khóa hoặc chuyên ngành khác." />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">Mentor đang nhận yêu cầu</p>
              <p className="text-xs text-neutral-500">Hiển thị {visibleMentors.length} hồ sơ trên trang này</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {visibleMentors.map((mentor) => (
                <Card key={mentor.userId} className="flex flex-col justify-between">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={mentor.acceptingRequests ? 'success' : 'neutral'} dot>
                        {mentor.acceptingRequests ? 'Nhận yêu cầu' : 'Tạm dừng'}
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
                    <Button variant="outline" size="sm" onClick={() => navigate(`/mentoring/mentors/${mentor.userId}`)}>
                      Hồ sơ
                    </Button>
                    <Button size="sm" disabled={!mentor.acceptingRequests} onClick={() => setSelectedMentorId(mentor.userId)}>
                      <Send className="mr-1 h-3.5 w-3.5" /> Gửi Request
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
      </QueryBoundary>}

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
