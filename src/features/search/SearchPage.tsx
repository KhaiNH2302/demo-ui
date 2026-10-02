import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Users,
  Building2,
  UsersRound,
  GraduationCap,
  CalendarDays,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import type { User, Club, Group, KnowledgePost, ClubEvent } from '@/types/entities';

interface SearchResultPayload {
  posts: KnowledgePost[];
  students: User[];
  clubs: Club[];
  groups: Group[];
  events: ClubEvent[];
  mentors: User[];
  total: number;
}

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(queryParam);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setInputVal(queryParam);
  }, [queryParam]);

  const { data, isLoading } = useQuery<SearchResultPayload>({
    queryKey: ['search', queryParam],
    queryFn: () => apiClient.get('/search', { params: { q: queryParam } }),
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: inputVal.trim() });
  };

  const results = data || {
    posts: [],
    students: [],
    clubs: [],
    groups: [],
    events: [],
    mentors: [],
    total: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm kiếm toàn hệ thống"
        description="Tra cứu bài viết kiến thức, bạn học, câu lạc bộ, nhóm kết nối và sự kiện trong trường"
      />

      {/* Main Search Input Form */}
      <form onSubmit={handleSearch} className="relative max-w-3xl">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Nhập từ khóa tìm kiếm (môn học, tên bạn bè, CLB, chủ đề...)"
          className="w-full h-12 pl-12 pr-28 rounded-2xl border border-neutral-300 bg-surface text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          Tìm kiếm
        </button>
      </form>

      {queryParam && (
        <div className="text-sm text-neutral-500">
          Kết quả tìm kiếm cho: <span className="font-semibold text-neutral-900">"{queryParam}"</span>
          {data && <span className="ml-2 text-xs text-neutral-400">({results.total} kết quả)</span>}
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : results.total === 0 && queryParam ? (
        <EmptyState
          title="Không tìm thấy kết quả phù hợp"
          description={`Không có nội dung nào khớp với từ khóa "${queryParam}". Bạn thử tìm với từ khóa khác nhé.`}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-neutral-100 p-1 rounded-xl mb-6">
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold">
              Tất cả ({results.total})
            </TabsTrigger>
            <TabsTrigger value="posts" className="rounded-lg text-xs font-semibold">
              Bài viết ({results.posts.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-lg text-xs font-semibold">
              Sinh viên ({results.students.length})
            </TabsTrigger>
            <TabsTrigger value="clubs" className="rounded-lg text-xs font-semibold">
              Câu lạc bộ ({results.clubs.length})
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-lg text-xs font-semibold">
              Nhóm ({results.groups.length})
            </TabsTrigger>
            <TabsTrigger value="mentors" className="rounded-lg text-xs font-semibold">
              Mentor ({results.mentors.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg text-xs font-semibold">
              Sự kiện ({results.events.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB: Tất cả */}
          <TabsContent value="all" className="space-y-8">
            {/* 1. Bài viết nổi bật */}
            {results.posts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <BookOpen size={18} className="text-brand-600" />
                    <span>Bài viết & Thảo luận ({results.posts.length})</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('posts')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.posts.slice(0, 4).map((post) => (
                    <Link
                      key={post.id}
                      to={`/knowledge/${post.id}`}
                      className="p-4 rounded-xl border border-neutral-200 bg-surface hover:border-brand-300 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        {post.subject && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700 mb-2">
                            {post.subject}
                          </span>
                        )}
                        <p className="text-sm font-medium text-neutral-800 line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
                        <span>{post.likesCount || 0} lượt thích</span>
                        <span>{post.commentCount || 0} phản hồi</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Sinh viên */}
            {results.students.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <Users size={18} className="text-brand-600" />
                    <span>Sinh viên ({results.students.length})</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('students')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {results.students.slice(0, 3).map((stu) => (
                    <div
                      key={stu.id}
                      className="p-3.5 rounded-xl border border-neutral-200 bg-surface flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={stu} size="md" linkToProfile />
                        <div className="min-w-0">
                          <Link
                            to={`/users/${stu.id}`}
                            className="font-bold text-sm text-neutral-900 hover:text-brand-600 truncate block"
                          >
                            {stu.fullName}
                          </Link>
                          <span className="text-xs text-neutral-500 truncate block">
                            {stu.studentCode || 'Sinh viên'}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/chats`}
                        className="p-2 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 shrink-0 transition-colors"
                        title="Nhắn tin"
                      >
                        <MessageCircle size={18} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Câu lạc bộ */}
            {results.clubs.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <Building2 size={18} className="text-brand-600" />
                    <span>Câu lạc bộ ({results.clubs.length})</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('clubs')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.clubs.slice(0, 2).map((club) => (
                    <Link
                      key={club.id}
                      to={`/clubs/${club.id}`}
                      className="p-4 rounded-xl border border-neutral-200 bg-surface hover:border-brand-300 hover:shadow-sm transition-all flex items-center gap-3.5"
                    >
                      {club.logoUrl ? (
                        <img
                          src={club.logoUrl}
                          alt={club.name}
                          className="h-12 w-12 rounded-xl object-cover shrink-0 ring-1 ring-neutral-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-base shrink-0">
                          {club.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-neutral-900 truncate">{club.name}</h3>
                        <span className="text-xs text-neutral-500 truncate block">{club.field}</span>
                      </div>
                      <ArrowRight size={16} className="text-neutral-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          {/* TAB: Bài viết */}
          <TabsContent value="posts" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/knowledge/${post.id}`}
                  className="p-5 rounded-2xl border border-neutral-200 bg-surface hover:border-brand-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {post.subject && (
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-brand-50 text-brand-700 mb-2.5">
                        {post.subject}
                      </span>
                    )}
                    <p className="text-sm font-medium text-neutral-800 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs text-neutral-400 pt-3 border-t border-neutral-100">
                    <span>{post.likesCount || 0} lượt thích</span>
                    <span>{post.commentCount || 0} phản hồi</span>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* TAB: Sinh viên */}
          <TabsContent value="students" className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {results.students.map((stu) => (
                <div
                  key={stu.id}
                  className="p-4 rounded-xl border border-neutral-200 bg-surface flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar user={stu} size="md" linkToProfile />
                    <div className="min-w-0">
                      <Link
                        to={`/users/${stu.id}`}
                        className="font-bold text-sm text-neutral-900 hover:text-brand-600 truncate block"
                      >
                        {stu.fullName}
                      </Link>
                      <span className="text-xs text-neutral-500 truncate block">
                        {stu.studentCode || 'Sinh viên'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/chats')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    Nhắn tin
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB: CLB */}
          <TabsContent value="clubs" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.clubs.map((club) => (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  className="p-4 rounded-xl border border-neutral-200 bg-surface hover:border-brand-300 hover:shadow-sm transition-all flex items-center gap-4"
                >
                  {club.logoUrl ? (
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="h-14 w-14 rounded-xl object-cover shrink-0 ring-1 ring-neutral-200"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-lg shrink-0">
                      {club.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-neutral-900 truncate">{club.name}</h3>
                    <span className="text-xs text-neutral-500 truncate block">{club.field}</span>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-1">{club.description}</p>
                  </div>
                  <ArrowRight size={18} className="text-neutral-400 shrink-0" />
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* TAB: Nhóm */}
          <TabsContent value="groups" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="p-4 rounded-xl border border-neutral-200 bg-surface hover:border-brand-300 hover:shadow-sm transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {group.purpose}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {group.memberCount}/{group.memberLimit} thành viên
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-neutral-900">{group.name}</h3>
                  <p className="text-xs text-neutral-600 line-clamp-2">{group.topic}</p>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* TAB: Mentor */}
          <TabsContent value="mentors" className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {results.mentors.map((mentor) => (
                <Link
                  key={mentor.id}
                  to={`/mentoring/mentors/${mentor.id}`}
                  className="p-4 rounded-xl border border-neutral-200 bg-surface hover:border-brand-300 hover:shadow-sm transition-all flex flex-col items-center text-center space-y-2"
                >
                  <UserAvatar user={mentor} size="lg" />
                  <h3 className="font-bold text-sm text-neutral-900">{mentor.fullName}</h3>
                  <span className="text-xs text-brand-600 font-medium">Mentor chuyên môn</span>
                  <button className="mt-2 w-full py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold">
                    Xem hồ sơ Mentor
                  </button>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* TAB: Sự kiện */}
          <TabsContent value="events" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.events.map((evt) => (
                <Link
                  key={evt.id}
                  to={`/events/${evt.id}`}
                  className="p-4 rounded-xl border border-neutral-200 bg-surface hover:border-brand-300 hover:shadow-sm transition-all space-y-2"
                >
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                    Sự kiện
                  </span>
                  <h3 className="font-bold text-base text-neutral-900 leading-snug">{evt.title}</h3>
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    <span>{new Date(evt.startAt).toLocaleDateString('vi-VN')}</span>
                  </p>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SearchPage;
