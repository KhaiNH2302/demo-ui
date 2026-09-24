import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { FilterBar } from '@/components/shared/FilterBar';
import { SearchInput } from '@/components/shared/SearchInput';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import {
  BookOpen,
  Plus,
  MessageSquare,
  Paperclip,
  HelpCircle,
  Lightbulb,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatRelativeTime } from '@/lib/format';
import { seedUsers } from '@/mocks/data/users';
import type { KnowledgePost, PostType } from '@/types/entities';

const typeOptions = [
  { value: '', label: 'Tất cả loại bài' },
  { value: 'experience', label: '💡 Kinh nghiệm học tập' },
  { value: 'question', label: '❓ Câu hỏi & Thảo luận' },
  { value: 'document', label: '📄 Tài liệu học phần' },
];

const subjectOptions = [
  { value: '', label: 'Tất cả môn học' },
  { value: 'CSD201', label: 'CSD201 (Cấu trúc dữ liệu)' },
  { value: 'PRJ301', label: 'PRJ301 (Java Web)' },
  { value: 'SWP391', label: 'SWP391 (Đồ án phần mềm)' },
  { value: 'DBI202', label: 'DBI202 (Cơ sở dữ liệu)' },
];

const typeIcons: Record<PostType, React.ReactNode> = {
  experience: <Lightbulb size={16} className="text-amber-500" />,
  question: <HelpCircle size={16} className="text-blue-500" />,
  document: <FileText size={16} className="text-emerald-500" />,
};

const typeLabels: Record<PostType, string> = {
  experience: 'Kinh nghiệm',
  question: 'Câu hỏi',
  document: 'Tài liệu',
};

export default function KnowledgeFeedPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const navigate = useNavigate();

  const postsQuery = useQuery<KnowledgePost[]>({
    queryKey: queryKeys.knowledge.feed({ q: keyword, type: selectedType, subject: selectedSubject }),
    queryFn: () =>
      apiClient.get('/posts', {
        params: {
          q: keyword || undefined,
          type: selectedType || undefined,
          subject: selectedSubject || undefined,
        },
      }),
  });

  const handleClearFilters = () => {
    setKeyword('');
    setSelectedType('');
    setSelectedSubject('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho kiến thức & Tài liệu học tập"
        description="Nơi sinh viên chia sẻ kinh nghiệm học tập, đặt câu hỏi thắc mắc và trao đổi tài liệu môn học"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/knowledge/me">
              <Button variant="outline" size="sm">
                Bài viết của tôi
              </Button>
            </Link>
            <Link to="/knowledge/new">
              <Button size="sm" leftIcon={<Plus size={16} />}>
                Đăng bài mới
              </Button>
            </Link>
          </div>
        }
      />

      <FilterBar
        onClear={handleClearFilters}
        showClear={!!keyword || !!selectedType || !!selectedSubject}
      >
        <SearchInput
          initialValue={keyword}
          onSearch={setKeyword}
          placeholder="Tìm theo tiêu đề, nội dung..."
        />
        <div className="w-48">
          <Select
            options={typeOptions}
            value={selectedType}
            onValueChange={setSelectedType}
          />
        </div>
        <div className="w-52">
          <Select
            options={subjectOptions}
            value={selectedSubject}
            onValueChange={setSelectedSubject}
          />
        </div>
      </FilterBar>

      <QueryBoundary
        query={postsQuery}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={BookOpen}
            title="Không tìm thấy bài viết phù hợp"
            description="Hãy thử tìm kiếm với từ khóa khác hoặc là người đầu tiên đăng bài chia sẻ kiến thức!"
            actionLabel="Đăng bài ngay"
            onAction={() => navigate('/knowledge/new')}
          />
        }
      >
        {(posts) => (
          <div className="space-y-4">
            {posts.map((post) => {
              const author = seedUsers.find((u) => u.id === post.authorId) || {
                id: post.authorId,
                fullName: 'Sinh viên SCS',
                school: 'Đại học FPT',
              };

              return (
                <Card
                  key={post.id}
                  onClick={() => navigate(`/knowledge/${post.id}`)}
                  className="p-5 hover:border-brand-300 transition-all cursor-pointer shadow-xs"
                >
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tier="neutral" size="sm" className="gap-1 font-medium bg-neutral-100">
                          {typeIcons[post.type]}
                          <span>{typeLabels[post.type]}</span>
                        </Badge>
                        {post.subject && (
                          <Badge tier="brand" size="sm">
                            {post.subject}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-neutral-900 leading-snug hover:text-brand-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-neutral-600 line-clamp-2 mt-1 leading-relaxed">
                        {post.contentMd.replace(/[#*`_]/g, '')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[11px] text-neutral-500 bg-neutral-100 rounded px-2 py-0.5">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                      <UserMiniCard user={author} size="sm" linkToProfile={false} />

                      <div className="flex items-center gap-3 shrink-0">
                        {post.attachments && post.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <Paperclip size={13} /> {post.attachments.length} tệp
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                          <MessageSquare size={13} /> {post.commentCount} phản hồi
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
