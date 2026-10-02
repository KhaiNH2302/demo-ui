import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Sparkles, Users, BookOpen, Clock, ArrowRight, Send } from 'lucide-react';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { Mentor, MentoringPost } from '@/types/entities';

export const MentorBrowsePage: React.FC = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<'mentors' | 'posts'>('mentors');
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all');

  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  const mentorsQuery = useQuery({
    queryKey: ['mentoring', 'mentors'],
    queryFn: () => apiClient.get<Mentor[]>('/mentoring/mentors'),
  });

  const postsQuery = useQuery({
    queryKey: ['mentoring', 'posts'],
    queryFn: () => apiClient.get<MentoringPost[]>('/mentoring/posts'),
  });

  const allMentors = mentorsQuery.data || [];
  const filteredMentors = allMentors.filter((m) => {
    if (fieldFilter !== 'all') {
      const match = m.fields.some(
        (f) =>
          f.toLowerCase().includes(fieldFilter.toLowerCase()) ||
          (fieldFilter === 'Software Engineering' && (f.includes('phần mềm') || f.includes('SE') || f.includes('Web') || f.includes('Công nghệ'))) ||
          (fieldFilter === 'Information Assurance' && (f.includes('An toàn') || f.includes('IA') || f.includes('Bảo mật'))) ||
          (fieldFilter === 'Artificial Intelligence' && (f.includes('Trí tuệ') || f.includes('AI') || f.includes('Machine Learning'))) ||
          (fieldFilter === 'Graphic Design' && (f.includes('Thiết kế') || f.includes('GD') || f.includes('Đồ họa')))
      );
      if (!match) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchSub = m.subjects.some((s) => s.toLowerCase().includes(q));
      const matchField = m.fields.some((f) => f.toLowerCase().includes(q));
      const matchExp = m.experience?.toLowerCase().includes(q);
      if (!matchSub && !matchField && !matchExp) return false;
    }
    return true;
  });

  const allPosts = postsQuery.data || [];
  const filteredPosts = allPosts.filter((p) => {
    if (fieldFilter !== 'all') {
      const pField = p.field || '';
      const match =
        pField.toLowerCase().includes(fieldFilter.toLowerCase()) ||
        (fieldFilter === 'Software Engineering' && (pField.includes('phần mềm') || pField.includes('SE') || pField.includes('Web') || pField.includes('Hệ thống') || pField.includes('Thuật toán') || pField.includes('Công nghệ'))) ||
        (fieldFilter === 'Information Assurance' && (pField.includes('An toàn') || pField.includes('IA') || pField.includes('Bảo mật'))) ||
        (fieldFilter === 'Artificial Intelligence' && (pField.includes('Trí tuệ') || pField.includes('AI') || pField.includes('Machine Learning'))) ||
        (fieldFilter === 'Graphic Design' && (pField.includes('Thiết kế') || pField.includes('GD') || pField.includes('Đồ họa')));
      if (!match) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = (p.content || p.contentMd || '').toLowerCase().includes(q);
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh bạ Mentor & Lớp học"
        description="Tìm kiếm Mentor theo chuyên ngành hoặc tham gia các lớp chia sẻ kiến thức cộng đồng"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentoring', href: '/mentoring' },
          { label: 'Danh bạ' },
        ]}
        actions={
          <Button onClick={() => navigate('/mentoring/ai')}>
            <Sparkles className="w-4 h-4 mr-1.5" /> Tìm bằng AI
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm kiếm môn học, chủ đề hoặc từ khóa..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            options={[
              { label: 'Tất cả chuyên ngành', value: 'all' },
              { label: 'Kỹ thuật phần mềm (SE)', value: 'Software Engineering' },
              { label: 'An toàn thông tin (IA)', value: 'Information Assurance' },
              { label: 'Trí tuệ nhân tạo (AI)', value: 'Artificial Intelligence' },
              { label: 'Thiết kế đồ họa (GD)', value: 'Graphic Design' },
            ]}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="mentors">Mentor ({filteredMentors.length})</TabsTrigger>
          <TabsTrigger value="posts">Lớp học / Bài đăng ({filteredPosts.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Mentors */}
        <TabsContent value="mentors" className="mt-6">
          <QueryBoundary queries={[mentorsQuery]}>
            {filteredMentors.length === 0 ? (
              <EmptyState
                title="Không tìm thấy Mentor"
                description="Hãy thử chọn ngành hoặc bộ lọc khác."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <Card key={mentor.userId} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={mentor.acceptingRequests ? 'success' : 'neutral'}>
                          {mentor.acceptingRequests ? 'Nhận yêu cầu' : 'Tạm bận'}
                        </Badge>
                        <span className="text-xs text-[var(--text-subtle)]">
                          {mentor.supportModes.join(' • ')}
                        </span>
                      </div>
                      <UserMiniCard userId={mentor.userId} showMajor />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Môn học nhận hỗ trợ:</span>
                        <div className="flex flex-wrap gap-1">
                          {mentor.subjects.map((sub, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {mentor.experience && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                          {mentor.experience}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/mentoring/mentors/${mentor.userId}`)}
                      >
                        Hồ sơ
                      </Button>
                      <Button
                        size="sm"
                        disabled={!mentor.acceptingRequests}
                        onClick={() => setSelectedMentorId(mentor.userId)}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Gửi Request
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* Tab 2: Mentoring Posts */}
        <TabsContent value="posts" className="mt-6">
          <QueryBoundary queries={[postsQuery]}>
            {filteredPosts.length === 0 ? (
              <EmptyState
                title="Không có bài đăng nào"
                description="Hiện chưa có lớp học hoặc bài mở đăng ký nào."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{post.field}</Badge>
                        <span className="text-xs text-[var(--text-subtle)]">
                          {post.slots} slot • {post.mode}
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-[var(--text-muted)] line-clamp-3">
                        {post.content || post.contentMd}
                      </p>
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <UserMiniCard userId={post.mentorId} />
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
                      <Button size="sm" onClick={() => navigate(`/mentoring/posts/${post.id}`)}>
                        Xem chi tiết <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {/* Dialog for sending request */}
      {selectedMentorId && (
        <SendMentoringRequestDialog
          open={!!selectedMentorId}
          onOpenChange={() => setSelectedMentorId(null)}
          mentorId={selectedMentorId}
        />
      )}
    </div>
  );
};

export default MentorBrowsePage;
