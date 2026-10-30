import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarClock, Check, ChevronDown, HelpCircle, Search, Sparkles, Star, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/shared/PageHeader';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import { formatSessionTime, formatStartingPrice, getUpcomingSessionDays } from './plans';
import type {
  AiCriterionKey,
  AiMentorCriteria,
  AiMentorMatch,
  AiMentorSearchResult,
  Mentor,
  ScheduleSlot,
  TimeOfDay,
} from '@/types/entities';

const EMPTY_CRITERIA: AiMentorCriteria = { subjects: [], days: [], modes: [], wantTrial: false };

const EXAMPLES = [
  'Ôn CSD201 phần cây và đồ thị, tối thứ 3 hoặc 5, online, dưới 100k/buổi, có học thử',
  'Cần người review đồ án SWP391 cuối tuần, gặp trực tiếp',
  'Học Figma để làm portfolio UI/UX, chiều thứ 7',
];

const DAYS: { value: ScheduleSlot['day']; label: string }[] = [
  { value: 'Mon', label: 'T2' },
  { value: 'Tue', label: 'T3' },
  { value: 'Wed', label: 'T4' },
  { value: 'Thu', label: 'T5' },
  { value: 'Fri', label: 'T6' },
  { value: 'Sat', label: 'T7' },
  { value: 'Sun', label: 'CN' },
];

const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Sáng' },
  { value: 'afternoon', label: 'Chiều' },
  { value: 'evening', label: 'Tối' },
];

const MODE_LABELS: Record<AiMentorCriteria['modes'][number], string> = {
  online: 'online',
  offline: 'gặp trực tiếp',
  chat: 'qua chat',
};

const BUDGET_PRESETS = [0, 80000, 100000, 150000];

const CHECK_LABELS: Record<AiCriterionKey, string> = {
  subject: 'Môn',
  schedule: 'Lịch',
  mode: 'Hình thức',
  budget: 'Học phí',
  trial: 'Học thử',
};

const TIME_HOURS: Record<TimeOfDay, [number, number]> = { morning: [6, 12], afternoon: [12, 18], evening: [18, 23] };

const GUIDE_KEY = 'scs.mentorAi.guideHidden';

const readGuideHidden = () => {
  try {
    return localStorage.getItem(GUIDE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeGuideHidden = (hidden: boolean) => {
  try {
    localStorage.setItem(GUIDE_KEY, hidden ? '1' : '0');
  } catch {
    // trình duyệt chặn lưu trữ: chỉ ẩn trong phiên hiện tại
  }
};

const budgetText = (maxFee?: number) => {
  if (maxFee === undefined) return '+ học phí';
  if (maxFee === 0) return 'miễn phí';
  return `dưới ${formatCurrency(maxFee)}/buổi`;
};

const hasAnyCriteria = (c: AiMentorCriteria) =>
  c.subjects.length > 0 || c.days.length > 0 || Boolean(c.timeOfDay) || c.modes.length > 0 || c.maxFee !== undefined || c.wantTrial;

// Giờ trống gần nhất của Mentor nằm trong lịch học viên muốn
const nextSlotFor = (mentor: Mentor | undefined, criteria: AiMentorCriteria) => {
  if (!mentor) return undefined;
  const slots = mentor.availability.filter((slot) => {
    if (criteria.days.length && !criteria.days.includes(slot.day)) return false;
    if (!criteria.timeOfDay) return true;
    const [from, to] = TIME_HOURS[criteria.timeOfDay];
    return Number(slot.start.slice(0, 2)) < to && Number(slot.end.slice(0, 2)) > from;
  });
  const minutes = criteria.wantTrial && mentor.pricing?.trial.enabled ? mentor.pricing.trial.minutes : mentor.pricing?.minutesPerSession ?? 60;
  const day = getUpcomingSessionDays(slots.length ? slots : mentor.availability, minutes)[0];
  if (!day) return undefined;
  return {
    label: formatSessionTime(day, day.times[0]),
    short: `${day.weekday} ${day.dayOfMonth}/${day.key.slice(5, 7)} lúc ${day.times[0].start}`,
  };
};

// Một mục trong câu tiêu chí: nút to, rõ là bấm được; mục chưa chọn hiện dạng "+ ..."
const Token: React.FC<{ filled: boolean; active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  filled,
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={active}
    className={cn(
      'mx-0.5 my-1 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 align-middle text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      filled
        ? 'border-brand-200 bg-brand-50 font-semibold text-brand-800 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-200'
        : 'border-dashed border-neutral-300 bg-surface text-neutral-500 hover:border-brand-400 hover:text-brand-700 dark:border-neutral-600',
      active && 'border-brand-500 ring-2 ring-brand-500/30'
    )}
  >
    {children}
    <ChevronDown className={cn('h-3.5 w-3.5 opacity-60 transition-transform', active && 'rotate-180')} aria-hidden />
  </button>
);

const GUIDE_STEPS = [
  { title: 'Chọn điều bạn cần', detail: 'Bấm từng mục trong câu bên dưới: môn, lịch, hình thức, học phí. Không cần chọn hết.' },
  { title: 'Xem ai khớp và khớp chỗ nào', detail: 'Mỗi Mentor có dấu ✓ cho điều kiện khớp, ✗ cho chỗ lệch, ví dụ học phí cao hơn bao nhiêu.' },
  { title: 'Đăng ký học thử', detail: 'Giờ trống gần nhất được chọn sẵn. Mentor xác nhận rồi hai bên chốt lịch qua tin nhắn.' },
];

export const MentorAiSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [guideHidden, setGuideHidden] = useState(readGuideHidden);
  const [criteria, setCriteria] = useState<AiMentorCriteria>(EMPTY_CRITERIA);
  const [matches, setMatches] = useState<AiMentorMatch[] | null>(null);
  const [editing, setEditing] = useState<AiCriterionKey | null>(null);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [query, setQuery] = useState('');
  const [freeTextOpen, setFreeTextOpen] = useState(false);
  const [expandedChecks, setExpandedChecks] = useState<Record<string, boolean>>({});
  const [booking, setBooking] = useState<{ match: AiMentorMatch; slot?: string } | null>(null);

  const mentorsQuery = useQuery({
    queryKey: ['mentoring', 'mentors'],
    queryFn: () => apiClient.get<Mentor[]>('/mentoring/mentors'),
  });
  const mentorById = (id: string) => mentorsQuery.data?.find((mentor) => mentor.userId === id);

  // Môn gợi ý lấy từ các Mentor đang nhận học viên
  const subjectSuggestions = useMemo(() => {
    const codes = (mentorsQuery.data || [])
      .filter((mentor) => mentor.acceptingRequests)
      .flatMap((mentor) => mentor.subjects)
      .filter((subject) => /^[A-Z]{3}\d{3}/.test(subject));
    return Array.from(new Set(codes)).sort((a, b) => a.localeCompare(b));
  }, [mentorsQuery.data]);

  const search = useMutation({
    mutationFn: (body: { query?: string; criteria?: AiMentorCriteria }) =>
      apiClient.post<AiMentorSearchResult>('/mentoring/ai-search', body),
    onSuccess: (data) => {
      setCriteria(data.criteria);
      setMatches(data.matches);
    },
  });

  const applyCriteria = (patch: Partial<AiMentorCriteria>) => {
    const next = { ...criteria, ...patch };
    setCriteria(next);
    if (hasAnyCriteria(next)) search.mutate({ criteria: next });
    else setMatches(null);
  };

  const runQuery = (text: string) => {
    if (!text.trim()) return;
    setEditing(null);
    search.mutate({ query: text });
  };

  const toggleEditing = (key: AiCriterionKey) => setEditing((current) => (current === key ? null : key));

  const scheduleText = [
    criteria.timeOfDay ? TIMES.find((t) => t.value === criteria.timeOfDay)?.label.toLowerCase() : '',
    criteria.days.map((d) => DAYS.find((x) => x.value === d)?.label).join(', '),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Tìm Mentor bằng AI"
        description="Chọn môn, lịch và học phí bạn muốn. AI lọc ra Mentor hợp và chỉ rõ khớp chỗ nào."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentoring', href: '/mentoring' },
          { label: 'Tìm bằng AI' },
        ]}
        actions={
          <div className="flex gap-2">
            {guideHidden && (
              <Button
                variant="ghost"
                onClick={() => {
                  setGuideHidden(false);
                  writeGuideHidden(false);
                }}
              >
                <HelpCircle className="mr-1.5 h-4 w-4" /> Cách dùng
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/mentoring/browse')}>
              <Search className="mr-1.5 h-4 w-4" /> Tự xem danh sách
            </Button>
          </div>
        }
      />

      {/* Hướng dẫn 3 bước: ẩn được, nhớ lựa chọn của người dùng */}
      {!guideHidden && (
        <section aria-labelledby="ai-guide" className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 dark:border-brand-500/20 dark:bg-brand-500/5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="ai-guide" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Cách dùng</h2>
            <button
              type="button"
              onClick={() => {
                setGuideHidden(true);
                writeGuideHidden(true);
              }}
              className="rounded-md text-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Đã hiểu, ẩn đi
            </button>
          </div>
          <ol className="mt-3 grid gap-4 sm:grid-cols-3">
            {GUIDE_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{step.title}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Câu tiêu chí: luôn hiện, bấm từng mục để chọn */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6 dark:border-neutral-700/80" aria-labelledby="ai-criteria">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ai-criteria" className="text-sm font-medium text-neutral-500">Bạn cần</h2>
          <span className="text-xs text-neutral-500">Bấm vào từng mục để chọn hoặc đổi</span>
        </div>

        <p className="text-lg leading-relaxed text-neutral-800 dark:text-neutral-200">
          Người kèm
          <Token filled={criteria.subjects.length > 0} active={editing === 'subject'} onClick={() => toggleEditing('subject')}>
            {criteria.subjects.length ? criteria.subjects.join(', ') : '+ môn'}
          </Token>
          , rảnh
          <Token filled={Boolean(scheduleText)} active={editing === 'schedule'} onClick={() => toggleEditing('schedule')}>
            {scheduleText || '+ lịch'}
          </Token>
          , học
          <Token filled={criteria.modes.length > 0} active={editing === 'mode'} onClick={() => toggleEditing('mode')}>
            {criteria.modes.length ? criteria.modes.map((m) => MODE_LABELS[m]).join(' hoặc ') : '+ hình thức'}
          </Token>
          ,
          <Token filled={criteria.maxFee !== undefined} active={editing === 'budget'} onClick={() => toggleEditing('budget')}>
            {budgetText(criteria.maxFee)}
          </Token>
          ,
          <Token filled={criteria.wantTrial} active={editing === 'trial'} onClick={() => toggleEditing('trial')}>
            {criteria.wantTrial ? 'có học thử' : '+ học thử'}
          </Token>
        </p>

        {editing && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
            {editing === 'subject' && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">Môn đang có Mentor nhận kèm:</p>
                <div className="flex flex-wrap gap-2">
                  {subjectSuggestions.map((code) => (
                    <Chip
                      key={code}
                      selected={criteria.subjects.includes(code)}
                      onClick={() =>
                        applyCriteria({
                          subjects: criteria.subjects.includes(code)
                            ? criteria.subjects.filter((s) => s !== code)
                            : [...criteria.subjects, code],
                        })
                      }
                    >
                      {code}
                    </Chip>
                  ))}
                </div>
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = subjectDraft.trim().toUpperCase();
                    if (code) applyCriteria({ subjects: Array.from(new Set([...criteria.subjects, code])) });
                    setSubjectDraft('');
                  }}
                >
                  <Input
                    aria-label="Môn khác"
                    value={subjectDraft}
                    onChange={(e) => setSubjectDraft(e.target.value)}
                    placeholder="Môn khác, VD: MAD101"
                    className="w-48"
                  />
                  <Button type="submit" size="sm" variant="outline">Thêm</Button>
                </form>
              </div>
            )}

            {editing === 'schedule' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" aria-label="Ngày trong tuần">
                  {DAYS.map((day) => (
                    <Chip
                      key={day.value}
                      selected={criteria.days.includes(day.value)}
                      onClick={() =>
                        applyCriteria({
                          days: criteria.days.includes(day.value)
                            ? criteria.days.filter((d) => d !== day.value)
                            : [...criteria.days, day.value],
                        })
                      }
                    >
                      {day.label}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Buổi trong ngày">
                  {TIMES.map((time) => (
                    <Chip
                      key={time.value}
                      selected={criteria.timeOfDay === time.value}
                      onClick={() => applyCriteria({ timeOfDay: criteria.timeOfDay === time.value ? undefined : time.value })}
                    >
                      Buổi {time.label.toLowerCase()}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {editing === 'mode' && (
              <div className="flex flex-wrap gap-2">
                {(Object.keys(MODE_LABELS) as AiMentorCriteria['modes']).map((mode) => (
                  <Chip
                    key={mode}
                    selected={criteria.modes.includes(mode)}
                    onClick={() =>
                      applyCriteria({
                        modes: criteria.modes.includes(mode) ? criteria.modes.filter((m) => m !== mode) : [...criteria.modes, mode],
                      })
                    }
                  >
                    Học {MODE_LABELS[mode]}
                  </Chip>
                ))}
              </div>
            )}

            {editing === 'budget' && (
              <div className="flex flex-wrap items-center gap-2">
                {BUDGET_PRESETS.map((value) => (
                  <Chip
                    key={value}
                    selected={criteria.maxFee === value}
                    onClick={() => applyCriteria({ maxFee: criteria.maxFee === value ? undefined : value })}
                  >
                    {value === 0 ? 'Miễn phí' : `Dưới ${formatCurrency(value)}`}
                  </Chip>
                ))}
                {criteria.maxFee !== undefined && (
                  <Button size="sm" variant="ghost" onClick={() => applyCriteria({ maxFee: undefined })}>Không giới hạn</Button>
                )}
              </div>
            )}

            {editing === 'trial' && (
              <div className="flex flex-wrap gap-2">
                <Chip selected={criteria.wantTrial} onClick={() => applyCriteria({ wantTrial: true })}>Muốn học thử trước</Chip>
                <Chip selected={!criteria.wantTrial} onClick={() => applyCriteria({ wantTrial: false })}>Không cần</Chip>
              </div>
            )}
          </div>
        )}

        {/* Lối tắt: kể bằng lời, AI tự điền các mục ở trên */}
        <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
          {!freeTextOpen ? (
            <button
              type="button"
              onClick={() => setFreeTextOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-brand-300"
            >
              <Sparkles className="h-4 w-4" /> Hoặc kể bằng lời, AI tự điền giúp bạn
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runQuery(query);
              }}
              className="space-y-2"
            >
              <label htmlFor="ai-query" className="text-sm text-neutral-600">Kể ngắn gọn bạn cần học gì, khi nào, bao nhiêu tiền</label>
              <Textarea
                id="ai-query"
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runQuery(query);
                }}
                placeholder={EXAMPLES[0]}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <span className="text-neutral-500">Câu mẫu:</span>
                  {EXAMPLES.slice(1).map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setQuery(example);
                        runQuery(example);
                      }}
                      className="text-left text-neutral-600 underline decoration-neutral-300 underline-offset-2 hover:text-brand-700"
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <Button type="submit" size="sm" disabled={!query.trim()} loading={search.isPending}>
                  <Sparkles className="mr-1.5 h-4 w-4" /> Điền giúp tôi
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {search.isError && (
        <AIFallbackBanner onFallback={() => navigate(`/mentoring/browse?q=${encodeURIComponent(criteria.subjects[0] || query)}`)} />
      )}

      {/* Kết quả xếp hạng */}
      {matches === null ? (
        <p className="text-center text-sm text-neutral-500">Chọn ít nhất một mục ở trên để xem Mentor phù hợp.</p>
      ) : (
        <section className="space-y-3" aria-live="polite" aria-busy={search.isPending}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {matches.length ? `${matches.length} Mentor hợp nhất` : 'Chưa có Mentor khớp'}
            </h2>
            {matches.length > 0 && <span className="text-xs text-neutral-500">Xếp theo số điều kiện khớp, rồi tới đánh giá</span>}
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-6 dark:border-neutral-700">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {criteria.subjects.length
                  ? `Hiện chưa có Mentor đang nhận kèm ${criteria.subjects.join(', ')}.`
                  : 'Thêm môn bạn cần để AI lọc chính xác hơn.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate('/mentoring')}>Đăng bài nhờ kèm</Button>
                {criteria.subjects.length ? (
                  <Button size="sm" variant="outline" onClick={() => applyCriteria({ subjects: [] })}>Bỏ điều kiện môn</Button>
                ) : null}
              </div>
            </div>
          ) : (
            <ol className={cn('space-y-3 transition-opacity', search.isPending && 'opacity-60')}>
              {matches.map((match, index) => {
                const mentor = mentorById(match.mentorId);
                const checks = match.checks ?? [];
                const okCount = checks.filter((c) => c.ok).length;
                const missCount = checks.length - okCount;
                const slot = nextSlotFor(mentor, criteria);
                const hasTrial = Boolean(mentor?.pricing?.trial.enabled);
                const showAll = Boolean(expandedChecks[match.mentorId]);
                return (
                  <li key={match.mentorId} className="rounded-2xl border border-neutral-200 bg-surface p-4 sm:p-5 dark:border-neutral-700/80">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums',
                          index === 0 ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
                        )}
                        aria-label={`Hạng ${index + 1}`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <UserMiniCard userId={match.mentorId} showMajor />
                          <div className="text-right">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{mentor ? formatStartingPrice(mentor) : ''}</p>
                            {mentor?.rating ? (
                              <p className="inline-flex items-center gap-1 text-xs text-amber-700">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                {mentor.rating.toFixed(1)}
                                <span className="text-neutral-500">({mentor.reviewCount})</span>
                              </p>
                            ) : (
                              <p className="text-xs text-neutral-500">Mentor mới</p>
                            )}
                          </div>
                        </div>

                        {checks.length > 0 && (
                          <div>
                            <div className="mb-1.5 flex items-center gap-2">
                              <p className="text-xs font-medium text-neutral-500">Khớp {okCount}/{checks.length} điều kiện</p>
                              {/* Trên điện thoại chỉ hiện chỗ lệch; bấm để xem cả điều kiện khớp */}
                              {okCount > 0 && missCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedChecks((c) => ({ ...c, [match.mentorId]: !c[match.mentorId] }))}
                                  className="text-xs font-medium text-brand-700 hover:underline sm:hidden"
                                >
                                  {showAll ? 'Thu gọn' : 'Xem chi tiết'}
                                </button>
                              )}
                            </div>
                            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                              {checks.map((check) => (
                                <li
                                  key={check.key}
                                  className={cn(
                                    'items-start gap-2 text-sm',
                                    check.ok && missCount > 0 && !showAll ? 'hidden sm:flex' : 'flex'
                                  )}
                                >
                                  {check.ok ? (
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Khớp" />
                                  ) : (
                                    <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-label="Không khớp" />
                                  )}
                                  <span className={check.ok ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'}>
                                    <span className="sr-only">{CHECK_LABELS[check.key]}: </span>
                                    {check.detail}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                          <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                            <CalendarClock className="h-4 w-4 text-neutral-400" />
                            {slot ? `Giờ trống gần nhất: ${slot.short}` : 'Chưa có lịch trống 2 tuần tới'}
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/users/${match.mentorId}`)}>Xem hồ sơ</Button>
                            <Button size="sm" onClick={() => setBooking({ match, slot: slot?.label })}>
                              {hasTrial ? 'Đăng ký học thử' : 'Gửi yêu cầu'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      {booking && (
        <SendMentoringRequestDialog
          open
          onOpenChange={(open) => !open && setBooking(null)}
          mentorId={booking.match.mentorId}
          initialTopic={criteria.subjects.join(', ')}
          initialContent={query}
          initialPlanId={mentorById(booking.match.mentorId)?.pricing?.trial.enabled ? 'trial' : 'single'}
          initialPreferredTime={booking.slot}
        />
      )}
    </div>
  );
};

export default MentorAiSearchPage;
