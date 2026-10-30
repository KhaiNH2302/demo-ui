import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Briefcase, CalendarClock, GraduationCap, Info, Languages, MapPin, Star, UserRound } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import type {
  Mentor,
  MentorPost,
  MentorProfileSection,
  MentorReview,
  StudentProfile,
  User,
} from '@/types/entities';
import {
  formatPrice,
  formatSessionTime,
  getPlanOptions,
  getUpcomingSessionDays,
} from './plans';
import type { ReviewState } from './reviews';

const MODE_LABELS: Record<string, string> = {
  online: 'Online qua Meet / Zoom',
  offline: 'Gặp trực tiếp tại trường',
  chat: 'Hỏi đáp qua tin nhắn',
};

const ABOUT_PREVIEW_LENGTH = 280;

interface MentorPublicProfileProps {
  user: User;
  profile: StudentProfile;
  mentor: Mentor;
  coverUrl: string;
  sections: MentorProfileSection[];
  posts: MentorPost[];
  reviews: MentorReview[];
  // Cụm nút Theo dõi / Nhắn tin / ... lấy từ ProfilePage để giữ nguyên hành vi hiện có
  actions: React.ReactNode;
  coursesTab: React.ReactNode;
  coursesCount: number;
  // false khi Mentor xem trước hồ sơ của chính mình
  canBook: boolean;
  onBook: (planId: string, preferredTime?: string) => void;
  // 'can': đã kết nối và chưa đánh giá; 'done': đã đánh giá; 'none': chưa kết nối
  reviewState: ReviewState;
  onReview: () => void;
  // Mentor xem hồ sơ của chính mình được trả lời đánh giá
  canReply: boolean;
}

// Mentor trả lời công khai một lần dưới mỗi đánh giá
const ReviewReply: React.FC<{ review: MentorReview; canReply: boolean; authorName: string }> = ({ review, canReply, authorName }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const reply = useMutation({
    mutationFn: () => apiClient.post(`/mentors/${review.mentorId}/reviews/${review.id}/reply`, { content: text.trim() }),
    onSuccess: () => {
      toast.success('Đã gửi phản hồi');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['mentor-reviews', review.mentorId] });
    },
    onError: () => toast.error('Chưa gửi được phản hồi, thử lại sau ít phút.'),
  });

  if (review.reply) {
    return (
      <div className="rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-800/60">
        <p className="mb-0.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          {authorName} đã phản hồi · {formatDate(review.reply.createdAt)}
        </p>
        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">{review.reply.content}</p>
      </div>
    );
  }
  if (!canReply) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
        Phản hồi
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <Textarea rows={2} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="Cảm ơn hoặc giải thích thêm cho học viên..." />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Hủy</Button>
        <Button size="sm" disabled={!text.trim()} loading={reply.isPending} onClick={() => reply.mutate()}>Gửi phản hồi</Button>
      </div>
    </div>
  );
};

const Stars: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={cn('h-3.5 w-3.5', i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300')}
      />
    ))}
  </span>
);

const SectionBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
    {children}
  </section>
);

const TagRow: React.FC<{ label: string; items: string[] }> = ({ label, items }) =>
  items.length === 0 ? null : (
    <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {item}
          </span>
        ))}
      </dd>
    </div>
  );

const renderSectionContent = (section: MentorProfileSection) => {
  if (typeof section.content === 'string') {
    return <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{section.content}</p>;
  }
  if (section.type === 'links') {
    return (
      <ul className="space-y-1.5 text-sm">
        {(section.content as { label: string; url: string }[]).map((link) => (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
      {(section.content as string[]).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

// Khung đặt lịch bên phải, giống ADPList: chọn loại buổi → ngày → giờ → đăng ký
const BookingCard: React.FC<{
  mentor: Mentor;
  canBook: boolean;
  onBook: MentorPublicProfileProps['onBook'];
}> = ({ mentor, canBook, onBook }) => {
  const options = getPlanOptions(mentor);
  const [planId, setPlanId] = useState(options[0]?.id ?? '');
  const plan = options.find((option) => option.id === planId) ?? options[0];
  const days = getUpcomingSessionDays(mentor.availability, plan?.minutes ?? 60);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const day = days.find((item) => item.key === dayKey) ?? days[0];
  const [timeStart, setTimeStart] = useState<string | null>(null);
  const time = day?.times.find((item) => item.start === timeStart);
  const disabled = !canBook || !mentor.acceptingRequests || !plan;

  const ctaLabel = () => {
    if (!plan) return 'Gửi yêu cầu';
    if (day && time) return `Đăng ký ${plan.title.toLowerCase()} · ${day.weekday} ${day.dayOfMonth}/${day.key.slice(5, 7)} lúc ${time.start}`;
    return `Đăng ký ${plan.title.toLowerCase()}`;
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm dark:border-neutral-700/80 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Đặt buổi học</h2>
        <p className="text-xs text-neutral-500">Chọn loại buổi, ngày và giờ. Mentor xác nhận rồi hai bên chốt lịch qua tin nhắn.</p>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-neutral-600">Mentor chưa công bố học phí. Hãy nhắn tin để hỏi trước.</p>
      ) : (
        <div className="space-y-2" role="radiogroup" aria-label="Loại buổi học">
          {options.map((option) => {
            const active = option.id === plan?.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setPlanId(option.id);
                  setTimeStart(null);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  active
                    ? 'border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800'
                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{option.title}</span>
                  <span className="block text-xs text-neutral-500">
                    {option.sessions > 1 ? `${option.sessions} buổi × ` : ''}
                    {option.minutes} phút
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatPrice(option.price)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {days.length === 0 ? (
        <p className="flex items-start gap-1.5 text-sm text-neutral-600">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
          Mentor chưa có lịch rảnh trong 2 tuần tới. Bạn vẫn có thể gửi yêu cầu để hẹn giờ khác.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Chọn ngày</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
              {days.map((item) => {
                const active = item.key === day?.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setDayKey(item.key);
                      setTimeStart(null);
                    }}
                    className={cn(
                      'flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    <span className="text-[11px] font-medium opacity-80">{item.weekday}</span>
                    <span className="text-lg font-bold leading-tight tabular-nums">{item.dayOfMonth}</span>
                    <span className="text-[11px] opacity-80">{item.month}</span>
                    <span className={cn('mt-1 text-[10px]', active ? 'opacity-90' : 'text-emerald-700')}>
                      {item.times.length} giờ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {day && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Chọn giờ</p>
              <div className="grid grid-cols-3 gap-2">
                {day.times.map((item) => {
                  const active = item.start === time?.start;
                  return (
                    <button
                      key={item.start}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTimeStart(active ? null : item.start)}
                      className={cn(
                        'rounded-lg border py-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                        active
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                          : 'border-neutral-200 text-neutral-800 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-200'
                      )}
                    >
                      {item.start}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <Button
          className="w-full"
          disabled={disabled}
          onClick={() => plan && onBook(plan.id, day && time ? formatSessionTime(day, time) : undefined)}
        >
          {ctaLabel()}
        </Button>
        {!mentor.acceptingRequests && (
          <p className="text-xs font-medium text-amber-700">Mentor đang tạm ngưng nhận học viên mới.</p>
        )}
        {!canBook && mentor.acceptingRequests && (
          <p className="text-xs text-neutral-500">Bạn đang xem trước hồ sơ của mình nên không đặt được buổi.</p>
        )}
        <p className="flex items-start gap-1.5 text-xs text-neutral-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Học phí trả trực tiếp cho Mentor sau khi Mentor nhận yêu cầu.
        </p>
      </div>
    </div>
  );
};

export const MentorPublicProfile: React.FC<MentorPublicProfileProps> = ({
  user,
  profile,
  mentor,
  coverUrl,
  sections,
  posts,
  reviews,
  actions,
  coursesTab,
  coursesCount,
  canBook,
  onBook,
  reviewState,
  onReview,
  canReply,
}) => {
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const about = profile.about || profile.bio || mentor.experience;
  const aboutTooLong = about.length > ABOUT_PREVIEW_LENGTH;
  const currentWork = profile.work?.find((item) => item.isCurrent) ?? profile.work?.[0];
  const headline =
    profile.intro || (currentWork ? `${currentWork.position} tại ${currentWork.company}` : mentor.fields.slice(0, 2).join(' · '));
  const visibleSections = sections.filter((section) => section.visible).sort((a, b) => a.order - b.order);
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : mentor.rating;
  const reviewCount = Math.max(reviews.length, mentor.reviewCount ?? 0);
  const topTags = Object.entries(
    reviews.flatMap((review) => review.tags || []).reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Hồ sơ chỉ nêu hai điều học viên cần để tin: có bao nhiêu người từng học và họ đánh giá thế nào
  const stats = [
    mentor.menteesCount ? { value: String(mentor.menteesCount), label: 'Học viên từng học' } : null,
    averageRating ? { value: averageRating.toFixed(1), label: `${reviewCount} đánh giá` } : null,
  ].filter((item): item is { value: string; label: string } => Boolean(item));

  return (
    <div className="space-y-6">
      {/* Banner + nhận diện Mentor */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-sm dark:border-neutral-700/80">
        <div className="relative h-36 w-full bg-neutral-200 sm:h-44 dark:bg-neutral-800">
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-14 shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-surface bg-neutral-100 shadow-md sm:h-32 sm:w-32">
                <UserAvatar
                  user={{ id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl }}
                  size="xl"
                  className="h-full w-full rounded-full"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem] dark:text-neutral-100">
                {user.fullName}
              </h1>
              <BadgeCheck className="h-5 w-5 text-primary" aria-label="Mentor đã được duyệt" />
              {mentor.acceptingRequests ? (
                <Badge variant="success" dot>Đang nhận học viên</Badge>
              ) : (
                <Badge variant="secondary">Tạm ngưng nhận</Badge>
              )}
            </div>
            <p className="max-w-2xl text-base text-neutral-700 dark:text-neutral-300">{headline}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-neutral-500">
              {(user.major || profile.major) && (
                <li className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {[user.major || profile.major, user.cohort || profile.cohort].filter(Boolean).join(' · ')}
                </li>
              )}
              {currentWork && (
                <li className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {currentWork.position} tại {currentWork.company}
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[user.school, user.campus].filter(Boolean).join(', ') || 'Đại học FPT'}
              </li>
              {profile.languages && profile.languages.length > 0 && (
                <li className="flex items-center gap-1.5">
                  <Languages className="h-4 w-4" />
                  {profile.languages.join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Số liệu kèm học */}
          {stats.length > 0 ? (
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 dark:border-neutral-700/80 dark:bg-neutral-700/80">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-surface px-4 py-4">
                  <dd className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{stat.value}</dd>
                  <dt className="mt-0.5 text-xs text-neutral-500">{stat.label}</dt>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600">
              Mentor mới, chưa có học viên hay đánh giá nào. Buổi học thử là cách nhanh nhất để biết có hợp không.
            </p>
          )}

          <Tabs defaultValue="overview" className="space-y-5">
            <TabsList className="inline-flex w-full max-w-full overflow-x-auto rounded-xl border border-neutral-200 bg-surface p-1 sm:w-auto dark:border-neutral-700/80 scrollbar-none">
              <TabsTrigger value="overview" className="shrink-0 rounded-lg px-4 py-2 text-sm">Tổng quan</TabsTrigger>
              <TabsTrigger value="reviews" className="shrink-0 rounded-lg px-4 py-2 text-sm">Đánh giá ({reviewCount})</TabsTrigger>
              <TabsTrigger value="courses" className="shrink-0 rounded-lg px-4 py-2 text-sm">Khóa học ({coursesCount})</TabsTrigger>
              <TabsTrigger value="posts" className="shrink-0 rounded-lg px-4 py-2 text-sm">Bài chia sẻ ({posts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-8 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm sm:p-6 dark:border-neutral-700/80">
                <SectionBlock title="Giới thiệu">
                  <p className="max-w-prose text-sm leading-relaxed text-neutral-700 whitespace-pre-line dark:text-neutral-300">
                    {aboutTooLong && !aboutExpanded ? `${about.slice(0, ABOUT_PREVIEW_LENGTH).trimEnd()}…` : about}
                  </p>
                  {aboutTooLong && (
                    <button
                      type="button"
                      onClick={() => setAboutExpanded((value) => !value)}
                      className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
                    >
                      {aboutExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  )}
                  {about !== mentor.experience && mentor.experience && (
                    <p className="max-w-prose border-l-2 border-primary/60 pl-3 text-sm text-neutral-700 dark:text-neutral-300">
                      {mentor.experience}
                    </p>
                  )}
                </SectionBlock>

                <SectionBlock title="Chuyên môn">
                  <dl className="space-y-3">
                    <TagRow label="Lĩnh vực" items={mentor.fields} />
                    <TagRow label="Môn học hỗ trợ" items={mentor.subjects} />
                    <TagRow label="Hình thức" items={mentor.supportModes.map((mode) => MODE_LABELS[mode] || mode)} />
                    <TagRow label="Kỹ năng" items={profile.skills ?? []} />
                  </dl>
                </SectionBlock>

                {((profile.work?.length ?? 0) > 0 || (profile.education?.length ?? 0) > 0) && (
                  <SectionBlock title="Kinh nghiệm & học vấn">
                    <ol className="space-y-4">
                      {profile.work?.map((item) => (
                        <li key={item.id} className="flex gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                            <Briefcase className="h-4 w-4 text-neutral-500" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.position}</p>
                            <p className="text-sm text-neutral-600">{item.company}</p>
                            <p className="text-xs text-neutral-500">
                              {[item.from, item.isCurrent ? 'Hiện tại' : item.to].filter(Boolean).join(' – ')}
                            </p>
                            {item.description && <p className="mt-1 text-sm text-neutral-600">{item.description}</p>}
                          </div>
                        </li>
                      ))}
                      {profile.education?.map((item) => (
                        <li key={item.id} className="flex gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                            <GraduationCap className="h-4 w-4 text-neutral-500" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.schoolName}</p>
                            <p className="text-sm text-neutral-600">{[item.major, item.cohort].filter(Boolean).join(' · ')}</p>
                            <p className="text-xs text-neutral-500">
                              {[item.fromYear, item.isCurrent ? 'Hiện tại' : item.toYear].filter(Boolean).join(' – ')}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </SectionBlock>
                )}

                {visibleSections.map((section) => (
                  <SectionBlock key={section.id} title={section.title}>
                    {renderSectionContent(section)}
                  </SectionBlock>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-700/80">
                  <p className="text-sm text-neutral-600">
                    {reviewState === 'can' && `Bạn đã kết nối với ${user.fullName}. Chia sẻ trải nghiệm để giúp bạn khóa sau.`}
                    {reviewState === 'done' && 'Bạn đã đánh giá lần kết nối này. Cảm ơn bạn!'}
                    {reviewState === 'waiting' && 'Bạn đã kết nối với Mentor. Đánh giá mở sau khi buổi học đầu tiên được bạn xác nhận ở mục Lớp học của tôi.'}
                    {reviewState === 'none' && 'Chỉ học viên đã kết nối và đã học ít nhất một buổi mới đánh giá được, nên mọi đánh giá ở đây đều từ người học thật.'}
                  </p>
                  {reviewState === 'can' && (
                    <Button className="shrink-0" onClick={onReview}>
                      <Star className="mr-1.5 h-4 w-4" /> Viết đánh giá
                    </Button>
                  )}
                </div>
              {reviews.length === 0 ? (
                <EmptyState
                  title="Chưa có đánh giá"
                  description="Đánh giá xuất hiện sau khi học viên đã kết nối với Mentor gửi nhận xét."
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm sm:flex-row sm:items-center dark:border-neutral-700/80">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {(averageRating ?? 0).toFixed(1)}
                      </span>
                      <div>
                        <Stars value={averageRating ?? 0} />
                        <p className="text-sm text-neutral-500">{reviews.length < reviewCount ? `Hiển thị ${reviews.length} đánh giá gần nhất trong ${reviewCount}` : `Từ ${reviewCount} học viên đã học`}</p>
                      </div>
                    </div>
                    {topTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:ml-auto sm:max-w-sm sm:justify-end">
                        {topTags.map(([tag, count]) => (
                          <span key={tag} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            {tag} <span className="tabular-nums text-neutral-500">{count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {reviews.map((review) => (
                      <li
                        key={review.id}
                        className="space-y-2 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm dark:border-neutral-700/80"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800" aria-hidden>
                              <UserRound className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Học viên ẩn danh</p>
                              {review.authorMajor && <p className="text-xs text-neutral-500">{review.authorMajor}</p>}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-neutral-500">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Stars value={review.rating} />
                          <span className="text-xs text-neutral-500">{review.topic}</span>
                        </div>
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {review.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {review.comment && <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{review.comment}</p>}
                        <ReviewReply review={review} canReply={canReply} authorName={user.fullName} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </TabsContent>

            <TabsContent value="courses">{coursesTab}</TabsContent>

            <TabsContent value="posts">
              {posts.length === 0 ? (
                <EmptyState title="Chưa có bài chia sẻ" description={`${user.fullName} chưa đăng bài chia sẻ nào.`} />
              ) : (
                <ul className="space-y-3">
                  {posts.map((post) => (
                    <li
                      key={post.id}
                      className="space-y-1.5 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm dark:border-neutral-700/80"
                    >
                      <p className="text-xs text-neutral-500">{formatDate(post.createdAt)}</p>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{post.title}</h3>
                      <p className="line-clamp-3 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                        {post.contentMd || post.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="order-first lg:order-last lg:col-span-4 lg:sticky lg:top-20">
          <BookingCard mentor={mentor} canBook={canBook} onBook={onBook} />
        </aside>
      </div>
    </div>
  );
};
