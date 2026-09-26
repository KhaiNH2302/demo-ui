import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { SearchInput } from '@/components/shared/SearchInput';
import { SuggestionCard } from './components/SuggestionCard';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { AvatarStack } from '@/components/shared/AvatarStack';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import {
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Search as SearchIcon,
  BookOpen,
  Code2,
  Palette,
  Dumbbell,
  HeartHandshake,
  Lightbulb,
  MessageCircle,
  UserPlus,
  Flame,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { Group, Club, Mentor, KnowledgePost, User } from '@/types/entities';

const CLUB_FIELDS = [
  { field: 'Học thuật', icon: BookOpen, count: 6 },
  { field: 'Công nghệ', icon: Code2, count: 8 },
  { field: 'Nghệ thuật', icon: Palette, count: 5 },
  { field: 'Thể thao', icon: Dumbbell, count: 7 },
  { field: 'Tình nguyện', icon: HeartHandshake, count: 4 },
  { field: 'Kỹ năng mềm', icon: Lightbulb, count: 5 },
];

const ANCHOR_CHIPS = [
  { id: 'tieu-diem', label: 'Tiêu điểm' },
  { id: 'danh-cho-ban', label: 'Dành cho bạn' },
  { id: 'su-kien', label: 'Sự kiện' },
  { id: 'nhom', label: 'Nhóm' },
  { id: 'clb', label: 'CLB' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'chu-de', label: 'Chủ đề' },
  { id: 'moi-nguoi', label: 'Mọi người' },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const { toast } = useToast();

  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [followedSubjects, setFollowedSubjects] = useState<string[]>(['CSD201', 'SWP391']);

  // Fetch groups
  const groupsQuery = useQuery<Group[]>({
    queryKey: ['discover', 'groups'],
    queryFn: () => apiClient.get('/groups'),
  });

  // Fetch clubs
  const clubsQuery = useQuery<Club[]>({
    queryKey: ['discover', 'clubs'],
    queryFn: () => apiClient.get('/clubs'),
  });

  // Fetch mentors
  const mentorsQuery = useQuery<Mentor[]>({
    queryKey: ['discover', 'mentors'],
    queryFn: () => apiClient.get('/mentoring/mentors'),
  });

  // Fetch trending subjects
  const trendingSubjectsQuery = useQuery<any[]>({
    queryKey: ['discover', 'trending-subjects'],
    queryFn: () => apiClient.get('/subjects/trending'),
  });

  // Fetch threads for search
  const postsQuery = useQuery<KnowledgePost[]>({
    queryKey: ['discover', 'posts', search],
    queryFn: () => apiClient.get('/posts', { params: { q: search || undefined } }),
  });

  // Fetch suggested users
  const usersQuery = useQuery<User[]>({
    queryKey: ['discover', 'users'],
    queryFn: () => apiClient.get('/users/suggested'),
  });

  const handleSearchChange = (val: string) => {
    if (val) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const q = search.trim().toLowerCase();
  const isSearching = q.length > 0;

  const filteredGroups = useMemo(
    () =>
      (groupsQuery.data || []).filter(
        (g) => !isSearching || g.name.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q)
      ),
    [groupsQuery.data, q, isSearching]
  );

  const filteredClubs = useMemo(
    () =>
      (clubsQuery.data || []).filter(
        (c) => !isSearching || c.name.toLowerCase().includes(q) || c.field.toLowerCase().includes(q)
      ),
    [clubsQuery.data, q, isSearching]
  );

  const filteredMentors = useMemo(
    () =>
      (mentorsQuery.data || []).filter(
        (m) =>
          !isSearching ||
          m.subjects.some((s) => s.toLowerCase().includes(q))
      ),
    [mentorsQuery.data, q, isSearching]
  );

  const filteredPosts = useMemo(
    () =>
      (postsQuery.data || []).filter(
        (p) =>
          !isSearching ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          p.contentMd.toLowerCase().includes(q) ||
          (p.subject && p.subject.toLowerCase().includes(q))
      ),
    [postsQuery.data, q, isSearching]
  );

  const handleFollowSubject = async (code: string) => {
    if (followedSubjects.includes(code)) {
      await apiClient.delete(`/subjects/${code}/follow`);
      setFollowedSubjects((prev) => prev.filter((s) => s !== code));
      toast({ variant: 'default', title: `Đã bỏ theo dõi môn ${code}` });
    } else {
      await apiClient.post(`/subjects/${code}/follow`);
      setFollowedSubjects((prev) => [...prev, code]);
      toast({ variant: 'success', title: `Đang theo dõi môn ${code}` });
    }
  };

  const handleScrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Mock AI suggestions for "Dành cho bạn"
  const aiSuggestions = [
    {
      id: 'sug_grp_1',
      type: 'group' as const,
      title: 'Nhóm Luyện Thuật Toán CSD201',
      subtitle: 'Đại học FPT · Còn 2/5 thành viên',
      avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=120&q=80',
      reason: 'Phù hợp mục tiêu ôn thi Practical Exam và lịch rảnh tối T3/T5',
      linkTo: '/groups',
      tags: ['Java', 'CSD201', 'Practical'],
    },
    {
      id: 'sug_men_1',
      type: 'mentor' as const,
      title: 'Mentor Hoàng Văn Nam',
      subtitle: 'Kỹ sư Fullstack · Cựu sinh viên FPTU',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      reason: 'Chuyên sâu về React, Spring Boot & hướng dẫn đồ án SWP391',
      linkTo: '/mentoring/browse',
      tags: ['React', 'Spring Boot', 'SWP391'],
    },
    {
      id: 'sug_grp_2',
      type: 'group' as const,
      title: 'Dự án AI Web App (SWP391)',
      subtitle: 'Tìm FE React · Còn 1 chỗ',
      avatarUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=120&q=80',
      reason: 'Khớp kỹ năng React & TypeScript theo hồ sơ của bạn',
      linkTo: '/groups',
      tags: ['TypeScript', 'Tailwind', 'AI'],
    },
  ].filter((s) => !dismissedSuggestions.includes(s.id));

  // 7-day strip for public events
  const days = [
    { label: 'Hôm nay', date: '25/09', dayNum: 'T6', hasEvent: true },
    { label: 'Ngày mai', date: '26/09', dayNum: 'T7', hasEvent: true },
    { label: 'Chủ Nhật', date: '27/09', dayNum: 'CN', hasEvent: true },
    { label: 'Thứ Hai', date: '28/09', dayNum: 'T2', hasEvent: false },
    { label: 'Thứ Ba', date: '29/09', dayNum: 'T3', hasEvent: true },
    { label: 'Thứ Tư', date: '30/09', dayNum: 'T4', hasEvent: false },
    { label: 'Thứ Năm', date: '01/10', dayNum: 'T5', hasEvent: true },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header & Full-width Search */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Khám phá cơ hội mới</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tìm kiếm nhóm kết nối, câu lạc bộ, Mentor và các chủ đề môn học sôi nổi trong toàn trường.
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm nhóm, câu lạc bộ, Mentor, môn học, người dùng..."
          className="w-full"
        />

        {/* Anchor navigation chips */}
        {!isSearching && (
          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 -mx-1 px-1 scrollbar-none">
            {ANCHOR_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleScrollToAnchor(chip.id)}
                className="shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SEARCH RESULTS VIEW */}
      {isSearching ? (
        <div className="space-y-8">
          {filteredGroups.length === 0 &&
          filteredClubs.length === 0 &&
          filteredMentors.length === 0 &&
          filteredPosts.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title={`Không tìm thấy kết quả cho “${search}”`}
              description="Hãy thử từ khóa khác hoặc tìm kiếm trực tiếp trong trang chuyên mục."
            />
          ) : (
            <>
              {/* Groups Results */}
              {filteredGroups.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <Users size={18} className="text-brand-600" /> Nhóm ({filteredGroups.length})
                    </h3>
                    <Link to="/groups" className="text-xs font-semibold text-brand-600 hover:underline">
                      Xem tất cả →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredGroups.slice(0, 6).map((group) => (
                      <Card
                        key={group.id}
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="p-4 hover:border-brand-300 transition-all cursor-pointer space-y-2"
                      >
                        <Badge tier="brand" size="sm">{group.purpose}</Badge>
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{group.name}</h4>
                        <p className="text-xs text-neutral-500 line-clamp-2">{group.topic}</p>
                        <span className="text-[11px] text-neutral-400 block pt-1">
                          {group.memberCount}/{group.memberLimit} thành viên
                        </span>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Clubs Results */}
              {filteredClubs.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <Building2 size={18} className="text-brand-600" /> Câu lạc bộ ({filteredClubs.length})
                    </h3>
                    <Link to="/clubs" className="text-xs font-semibold text-brand-600 hover:underline">
                      Xem tất cả →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredClubs.slice(0, 6).map((club) => (
                      <Card
                        key={club.id}
                        onClick={() => navigate(`/clubs/${club.id}`)}
                        className="p-4 hover:border-brand-300 transition-all cursor-pointer flex items-center gap-3"
                      >
                        <Avatar src={club.logoUrl} name={club.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{club.name}</h4>
                          <p className="text-xs text-neutral-500 line-clamp-1">{club.field}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Mentors Results */}
              {filteredMentors.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <GraduationCap size={18} className="text-brand-600" /> Mentor ({filteredMentors.length})
                    </h3>
                    <Link to="/mentoring/browse" className="text-xs font-semibold text-brand-600 hover:underline">
                      Xem tất cả →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredMentors.slice(0, 4).map((mentor) => (
                      <Card
                        key={mentor.userId}
                        onClick={() => navigate(`/mentoring/mentors/${mentor.userId}`)}
                        className="p-4 hover:border-brand-300 transition-all cursor-pointer space-y-2 text-center flex flex-col items-center"
                      >
                        <Avatar name={mentor.userId} size="lg" />
                        <h4 className="text-xs font-bold text-neutral-900 mt-1">{mentor.userId}</h4>
                        <div className="flex flex-wrap justify-center gap-1">
                          {mentor.subjects.slice(0, 2).map((s) => (
                            <Badge key={s} tier="neutral" size="sm">{s}</Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Matching Threads */}
              {filteredPosts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <BookOpen size={18} className="text-brand-600" /> Bài viết & Thread ({filteredPosts.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {filteredPosts.slice(0, 5).map((post) => (
                      <Card
                        key={post.id}
                        onClick={() => navigate(`/knowledge/${post.id}`)}
                        className="p-3.5 hover:border-brand-300 transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {post.subject && <Badge tier="brand" size="sm">{post.subject}</Badge>}
                            <span className="text-xs font-bold text-neutral-900 line-clamp-1">
                              {post.title || post.contentMd.split('\n')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 line-clamp-1">{post.contentMd}</p>
                        </div>
                        <Button size="sm" variant="ghost" rightIcon={<ArrowRight size={13} />}>
                          Xem
                        </Button>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        /* FULL DIRECTORY SECTIONS VIEW (C6b.1) */
        <div className="space-y-12">
          {/* 1. Tiêu điểm tuần (#tieu-diem) */}
          <section id="tieu-diem" className="relative rounded-2xl overflow-hidden bg-neutral-900 text-white min-h-[220px] sm:min-h-[260px] flex items-end p-6 sm:p-8 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
              alt="featured banner"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="relative z-10 max-w-xl space-y-2">
              <Badge tier="brand" size="sm" className="bg-brand-500 text-white border-none font-bold">
                Tiêu điểm tuần
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                Đợt tuyển thành viên F-Code & JS Club Mùa Thu 2026
              </h2>
              <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2">
                Cơ hội tham gia các dự án phần mềm thực tế, workshop công nghệ và kết nối cùng các anh chị cựu sinh viên.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/clubs')}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Xem đợt tuyển
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/mentoring/ai')}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Tìm Mentor với AI
                </Button>
              </div>
            </div>
          </section>

          {/* 2. Dành cho bạn (#danh-cho-ban) */}
          {aiSuggestions.length > 0 && (
            <section id="danh-cho-ban" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-accent-600" /> Dành cho bạn
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Gợi ý nhóm kết nối & Mentor được cá nhân hóa theo kỹ năng và môn học của bạn.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {aiSuggestions.map((sug) => (
                  <SuggestionCard
                    key={sug.id}
                    {...sug}
                    onDismiss={(id) => setDismissedSuggestions((prev) => [...prev, id])}
                    onClick={() => navigate(sug.linkTo)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. Sắp diễn ra trong trường (#su-kien) */}
          <section id="su-kien" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Calendar size={18} className="text-brand-600" /> Sự kiện sắp diễn ra
                </h3>
                <p className="text-xs text-neutral-500">
                  Lịch hoạt động công khai của các câu lạc bộ trong 7 ngày tới.
                </p>
              </div>
            </div>

            {/* 7-day strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {days.map((d, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDay(idx)}
                  className={cn(
                    'flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-xl border transition-all text-xs cursor-pointer',
                    selectedDay === idx
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold ring-1 ring-brand-400'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <span className="text-[11px] text-neutral-400 uppercase font-medium">{d.dayNum}</span>
                  <span className="text-sm font-bold">{d.date.split('/')[0]}</span>
                  {d.hasEvent && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1" />}
                </button>
              ))}
            </div>

            {/* Event Horizontal Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-brand-300 transition-all">
              <div className="w-full sm:w-36 h-24 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80"
                  alt="event cover"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge tier="brand" size="sm">F-Code Club</Badge>
                  <span className="text-xs text-neutral-500">09:00 - 11:30</span>
                </div>
                <h4 className="text-base font-bold text-neutral-900">
                  Workshop: Làm chủ Prompt Engineering & GitHub Copilot cho sinh viên CNTT
                </h4>
                <p className="text-xs text-neutral-500 line-clamp-1">
                  Địa điểm: Hội trường Alpha, Đại học FPT · Đã có 42 bạn đăng ký
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  toast({ variant: 'success', title: 'Đã đăng ký tham gia sự kiện' });
                }}
                className="shrink-0 w-full sm:w-auto"
              >
                Đăng ký ngay
              </Button>
            </div>
          </section>

          {/* 4. Nhóm đang tuyển (#nhom) */}
          <section id="nhom" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Users size={18} className="text-brand-600" /> Nhóm đang tuyển thành viên
                </h3>
                <p className="text-xs text-neutral-500">
                  Các nhóm đồ án SWP391 và ôn tập môn học đang tìm kiếm đồng đội.
                </p>
              </div>
              <Link to="/groups" className="text-xs font-semibold text-brand-600 hover:underline">
                Xem tất cả & tìm với AI →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(groupsQuery.data || []).slice(0, 6).map((group) => (
                <Card
                  key={group.id}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="p-4 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge tier="brand" size="sm">{group.purpose}</Badge>
                      <span className="text-[11px] font-semibold text-tier-attention-text bg-tier-attention-bg px-2 py-0.5 rounded">
                        Còn {group.memberLimit - group.memberCount} chỗ
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{group.name}</h4>
                    <p className="text-xs text-neutral-500 line-clamp-2">{group.topic}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
                    <span>{group.memberCount}/{group.memberLimit} thành viên</span>
                    <span className="text-brand-600 font-semibold">Xem nhóm →</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 5. CLB đang tuyển thành viên (#clb) */}
          <section id="clb" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Building2 size={18} className="text-brand-600" /> CLB đang tuyển thành viên
                </h3>
                <p className="text-xs text-neutral-500">
                  Các câu lạc bộ đang mở đơn ứng tuyển — nộp hồ sơ trước khi hết hạn.
                </p>
              </div>
              <Link to="/clubs" className="text-xs font-semibold text-brand-600 hover:underline">
                Xem tất cả CLB →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(clubsQuery.data || []).slice(0, 6).map((club) => (
                <Card
                  key={club.id}
                  onClick={() => navigate(`/clubs/${club.id}`)}
                  className="p-4 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={club.logoUrl} name={club.name} size="lg" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge tier="neutral" size="sm" className="text-[10px]">{club.field}</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{club.name}</h4>
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{club.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                    <span className="text-tier-attention-text font-semibold flex items-center gap-1">
                      <Clock size={12} /> Còn 3 ngày
                    </span>
                    <span className="text-brand-600 font-semibold">Ứng tuyển →</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 6. Duyệt CLB theo lĩnh vực */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Duyệt câu lạc bộ theo lĩnh vực
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {CLUB_FIELDS.map((cf) => {
                const Icon = cf.icon;
                return (
                  <button
                    key={cf.field}
                    type="button"
                    onClick={() => navigate(`/clubs?field=${encodeURIComponent(cf.field)}`)}
                    className="p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-brand-300 hover:bg-brand-50/40 transition-all flex flex-col items-center text-center gap-2 cursor-pointer shadow-2xs group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                      <Icon size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">{cf.field}</span>
                      <span className="text-[10px] text-neutral-400">{cf.count} CLB</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 7. Mentor (#mentor) */}
          <section id="mentor" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <GraduationCap size={18} className="text-brand-600" /> Đội ngũ Mentor hỗ trợ học tập
                </h3>
                <p className="text-xs text-neutral-500">
                  Các anh chị cựu sinh viên và sinh viên giỏi sẵn sàng hướng dẫn học phần.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/mentoring/ai" className="text-xs font-semibold text-brand-600 hover:underline">
                  Tìm với AI
                </Link>
                <span className="text-neutral-300">·</span>
                <Link to="/mentoring/browse" className="text-xs font-semibold text-brand-600 hover:underline">
                  Xem tất cả →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(mentorsQuery.data || []).slice(0, 4).map((mentor) => (
                <Card
                  key={mentor.userId}
                  onClick={() => navigate(`/mentoring/mentors/${mentor.userId}`)}
                  className="p-4 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center space-y-2.5"
                >
                  <Avatar name={mentor.userId} size="lg" className="ring-2 ring-neutral-100" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{mentor.userId}</h4>
                    <p className="text-[11px] text-neutral-500">Cựu SV · Kỹ sư Fullstack</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {mentor.subjects.slice(0, 2).map((s) => (
                      <Badge key={s} tier="neutral" size="sm" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-neutral-100 w-full flex items-center justify-center gap-1 text-[11px] text-tier-success-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-tier-success-dot" /> Đang nhận yêu cầu
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 8. Chủ đề thịnh hành (#chu-de) */}
          <section id="chu-de" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Flame size={18} className="text-tier-danger-dot" /> Chủ đề & Môn học thịnh hành
                </h3>
                <p className="text-xs text-neutral-500">
                  Xếp hạng theo lượt thảo luận sôi nổi nhất tuần này. Bấm vào môn học để xem toàn bộ thread.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(trendingSubjectsQuery.data || []).map((subj) => {
                const isFollowing = followedSubjects.includes(subj.code);
                return (
                  <div
                    key={subj.code}
                    onClick={() => navigate(`/knowledge?subject=${subj.code}`)}
                    className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xl font-bold text-neutral-300 font-mono">
                        #{subj.rank}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge tier="brand" size="sm">{subj.code}</Badge>
                          <span className="text-xs font-semibold text-neutral-900 truncate">
                            {subj.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          {subj.threadCount} thread · {subj.replyCount} lượt phản hồi tuần này
                        </p>
                        {subj.topQuestion && (
                          <p className="text-xs text-neutral-700 italic line-clamp-1">
                            &quot;{subj.topQuestion}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isFollowing ? 'outline' : 'primary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowSubject(subj.code);
                      }}
                      className="shrink-0 text-xs h-7"
                    >
                      {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 9. Mọi người (#moi-nguoi) */}
          <section id="moi-nguoi" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Users size={18} className="text-brand-600" /> Sinh viên cùng quan tâm
                </h3>
                <p className="text-xs text-neutral-500">
                  Các bạn cùng chuyên ngành hoặc cùng theo dõi môn học với bạn.
                </p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {[
                { id: 'usr_student_02', name: 'Trần Văn Minh', major: 'Kỹ thuật phần mềm · K18', mutual: 'Cùng học CSD201' },
                { id: 'usr_student_03', name: 'Nguyễn Thị Hoa', major: 'Khoa học máy tính · K18', mutual: 'Cùng học SWP391' },
                { id: 'usr_student_04', name: 'Lê Quốc Bảo', major: 'An toàn thông tin · K17', mutual: 'Cùng CLB F-Code' },
                { id: 'usr_student_05', name: 'Đỗ Hải Đăng', major: 'Kỹ thuật phần mềm · K18', mutual: 'Cùng theo dõi PRJ301' },
              ].map((person) => (
                <Card
                  key={person.id}
                  className="w-48 shrink-0 p-4 flex flex-col items-center text-center space-y-2 hover:border-brand-300 transition-all"
                >
                  <Avatar name={person.name} size="lg" />
                  <div className="min-w-0 w-full">
                    <h5 className="text-xs font-bold text-neutral-900 truncate">{person.name}</h5>
                    <p className="text-[10px] text-neutral-500 truncate">{person.major}</p>
                    <span className="text-[10px] text-brand-600 font-medium block mt-1 truncate">
                      {person.mutual}
                    </span>
                  </div>
                  <div className="pt-2 w-full flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/users/${person.id}`)}
                      className="w-full text-xs h-7"
                    >
                      Hồ sơ
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
