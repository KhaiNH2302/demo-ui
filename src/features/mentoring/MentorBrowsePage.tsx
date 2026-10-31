import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarClock, Send, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatCurrency, formatScheduleSlot } from '@/lib/format';
import { PageHeader } from '@/components/shared/PageHeader';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Pagination } from '@/components/ui/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import { AiMatchResults } from './AiMatchResults';
import { formatPrice, formatStartingPrice, getStartingPricePerSession } from './plans';
import type { AiMentorCriteria, AiMentorMatch, AiMentorSearchResult, Mentor } from '@/types/entities';

const PAGE_SIZE = 6;

const MODE_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Gặp tại trường',
  chat: 'Hỏi đáp qua chat',
};

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

const PRICE_OPTIONS = [
  { label: 'Mọi mức giá', value: 'all' },
  { label: 'Miễn phí', value: 'free' },
  { label: 'Dưới 100.000 ₫/buổi', value: 'lt100' },
  { label: '100.000 – 150.000 ₫/buổi', value: '100-150' },
  { label: 'Trên 150.000 ₫/buổi', value: 'gt150' },
];

const RATING_OPTIONS = [
  { label: 'Mọi đánh giá', value: 'all' },
  { label: 'Từ 4,0 sao', value: '4' },
  { label: 'Từ 4,5 sao', value: '4.5' },
  { label: 'Từ 4,8 sao', value: '4.8' },
];

// Giá lọc theo mức thấp nhất mỗi buổi chính thức (không tính học thử), khớp với giá hiện trên thẻ
const matchesPrice = (mentor: Mentor, price: string) => {
  const value = getStartingPricePerSession(mentor);
  if (price === 'all') return true;
  if (value === null) return false;
  if (price === 'free') return value === 0;
  if (price === 'lt100') return value < 100000;
  if (price === '100-150') return value >= 100000 && value <= 150000;
  return value > 150000;
};

const FIELD_KEYWORDS: Record<string, string[]> = {
  software: ['phần mềm', 'software', 'web', 'react', 'java', 'kiến trúc', 'công nghệ'],
  security: ['an toàn', 'bảo mật', 'security', 'ia'],
  ai: ['trí tuệ', 'ai', 'machine learning', 'data'],
  design: ['thiết kế', 'đồ họa', 'design', 'gd'],
};

const AI_EXAMPLES = [
  'Ôn CSD201 phần cây và đồ thị, tối thứ 3 hoặc 5, online, dưới 100k/buổi, có học thử',
  'Cần người review đồ án SWP391 cuối tuần, gặp trực tiếp',
  'Học Figma để làm portfolio UI/UX, chiều thứ 7',
];

const DAY_LABELS: Record<string, string> = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' };
const TIME_LABELS: Record<string, string> = { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối' };
const AI_MODE_LABELS: Record<string, string> = { online: 'Online', offline: 'Gặp trực tiếp', chat: 'Qua chat' };

// AI hiểu câu mô tả thành các điều kiện; mỗi điều kiện là một chip bỏ được để tìm lại
const criteriaChips = (criteria: AiMentorCriteria) => {
  const chips: { key: string; label: string; clear: Partial<AiMentorCriteria> }[] = [];
  criteria.subjects.forEach((subject) =>
    chips.push({ key: `subject-${subject}`, label: subject, clear: { subjects: criteria.subjects.filter((s) => s !== subject) } })
  );
  if (criteria.days.length || criteria.timeOfDay) {
    const label = [criteria.timeOfDay ? TIME_LABELS[criteria.timeOfDay] : '', criteria.days.map((d) => DAY_LABELS[d]).join(', ')]
      .filter(Boolean)
      .join(' ');
    chips.push({ key: 'schedule', label, clear: { days: [], timeOfDay: undefined } });
  }
  criteria.modes.forEach((mode) =>
    chips.push({ key: `mode-${mode}`, label: AI_MODE_LABELS[mode], clear: { modes: criteria.modes.filter((m) => m !== mode) } })
  );
  if (criteria.maxFee !== undefined) {
    chips.push({
      key: 'budget',
      label: criteria.maxFee === 0 ? 'Miễn phí' : `Dưới ${formatCurrency(criteria.maxFee)}/buổi`,
      clear: { maxFee: undefined },
    });
  }
  if (criteria.wantTrial) chips.push({ key: 'trial', label: 'Có học thử', clear: { wantTrial: false } });
  return chips;
};

export const MentorBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [aiOpen, setAiOpen] = useState(params.get('ai') === '1');
  const [search, setSearch] = useState(params.get('q') || '');
  const [prompt, setPrompt] = useState('');
  const [aiResult, setAiResult] = useState<AiMentorSearchResult | null>(null);
  const [field, setField] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ match: AiMentorMatch; slot?: string } | null>(null);

  const mentorsQuery = useQuery({
    queryKey: ['mentoring', 'mentors'],
    queryFn: () => apiClient.get<Mentor[]>('/mentoring/mentors'),
  });

  // Gọi API AI: lần đầu gửi câu mô tả, sau đó gửi điều kiện đã chỉnh
  const aiSearch = useMutation({
    mutationFn: (body: { query?: string; criteria?: AiMentorCriteria }) =>
      apiClient.post<AiMentorSearchResult>('/mentoring/ai-search', body),
    onSuccess: (data) => setAiResult(data),
  });

  const runPrompt = (text: string) => {
    if (!text.trim()) return;
    aiSearch.mutate({ query: text });
  };

  const dropCriterion = (patch: Partial<AiMentorCriteria>) => {
    if (!aiResult) return;
    const next = { ...aiResult.criteria, ...patch };
    if (criteriaChips(next).length === 0) setAiResult(null);
    else aiSearch.mutate({ criteria: next });
  };

  const mentors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (mentorsQuery.data || []).filter((mentor) => {
      const searchable = [...mentor.fields, ...mentor.subjects, mentor.experience].join(' ').toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (field !== 'all' && !FIELD_KEYWORDS[field]?.some((keyword) => searchable.includes(keyword))) return false;
      if (subjectFilter !== 'all' && !mentor.subjects.some((s) => s.toLowerCase() === subjectFilter.toLowerCase())) return false;
      if (modeFilter !== 'all' && !mentor.supportModes.includes(modeFilter as any)) return false;
      if (!matchesPrice(mentor, priceFilter)) return false;
      if (ratingFilter !== 'all' && (mentor.rating ?? 0) < Number(ratingFilter)) return false;
      return true;
    });
  }, [field, mentorsQuery.data, modeFilter, priceFilter, ratingFilter, search, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(mentors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleMentors = mentors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilters = [
    { key: 'subject', value: subjectFilter, options: SUBJECT_OPTIONS, clear: () => setSubjectFilter('all') },
    { key: 'mode', value: modeFilter, options: MODE_OPTIONS, clear: () => setModeFilter('all') },
    { key: 'field', value: field, options: FIELD_OPTIONS, clear: () => setField('all') },
    { key: 'price', value: priceFilter, options: PRICE_OPTIONS, clear: () => setPriceFilter('all') },
    { key: 'rating', value: ratingFilter, options: RATING_OPTIONS, clear: () => setRatingFilter('all') },
  ].filter((filter) => filter.value !== 'all');

  const resetFilters = () => {
    setSubjectFilter('all');
    setModeFilter('all');
    setField('all');
    setPriceFilter('all');
    setRatingFilter('all');
    setPage(1);
  };

  const criteria = aiResult?.criteria;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm Mentor"
        description="Tìm theo từ khóa và bộ lọc, hoặc bấm Tìm với AI để mô tả bạn cần học gì, khi nào, bao nhiêu tiền."
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring', href: '/mentoring' }, { label: 'Tìm Mentor' }]}
      />

      <div className="space-y-3 rounded-xl border border-neutral-200 bg-surface p-4 dark:border-neutral-700/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, môn học, kỹ năng..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            <Button variant={aiOpen ? 'secondary' : 'outline'} aria-pressed={aiOpen} onClick={() => setAiOpen((open) => !open)}>
              <Sparkles className={cn('mr-1.5 h-4 w-4', aiOpen && 'text-brand-600')} /> Tìm với AI
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Bộ lọc
                  {activeFilters.length > 0 && (
                    <span className="ml-2 rounded-full bg-brand-600 px-1.5 text-xs font-bold leading-5 text-white">{activeFilters.length}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-3">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Bộ lọc nâng cao</p>
                {[
                  { id: 'subject', label: 'Môn học', value: subjectFilter, set: setSubjectFilter, options: SUBJECT_OPTIONS },
                  { id: 'mode', label: 'Hình thức học', value: modeFilter, set: setModeFilter, options: MODE_OPTIONS },
                  { id: 'field', label: 'Chuyên ngành', value: field, set: setField, options: FIELD_OPTIONS },
                  { id: 'price', label: 'Học phí', value: priceFilter, set: setPriceFilter, options: PRICE_OPTIONS },
                  { id: 'rating', label: 'Đánh giá', value: ratingFilter, set: setRatingFilter, options: RATING_OPTIONS },
                ].map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <label htmlFor={`filter-${item.id}`} className="text-xs font-medium text-neutral-500">{item.label}</label>
                    <Select
                      id={`filter-${item.id}`}
                      value={item.value}
                      onChange={(e) => {
                        item.set(e.target.value);
                        setPage(1);
                      }}
                      options={item.options}
                    />
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <Button size="sm" variant="ghost" disabled={activeFilters.length === 0} onClick={resetFilters}>
                    Xóa bộ lọc
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Đang lọc:</span>
            {activeFilters.map((filter) => {
              const label = filter.options.find((option) => option.value === filter.value)?.label ?? filter.value;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    filter.clear();
                    setPage(1);
                  }}
                  aria-label={`Bỏ lọc ${label}`}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  {label}
                  <X className="h-3 w-3" aria-hidden />
                </button>
              );
            })}
            <Button size="sm" variant="ghost" onClick={resetFilters}>Xóa hết</Button>
          </div>
        )}

        {/* Thanh tìm bằng AI: bấm "Tìm với AI" mới hiện; gửi bằng Enter hoặc biểu tượng gửi */}
        {aiOpen && (
          <div className="space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runPrompt(prompt);
              }}
            >
              <label htmlFor="mentor-ai-prompt" className="sr-only">Mô tả bạn cần gì</label>
              <div className="relative">
                <Sparkles className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-600" aria-hidden />
                <Textarea
                  id="mentor-ai-prompt"
                  rows={2}
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      runPrompt(prompt);
                    }
                  }}
                  placeholder="Mô tả bạn cần gì: môn, lịch, hình thức, học phí. VD: Ôn CSD201 tối thứ 3, online, dưới 100k, có học thử"
                  className="pl-9 pr-12"
                />
                <button
                  type="submit"
                  aria-label="Gửi mô tả cho AI"
                  disabled={!prompt.trim() || aiSearch.isPending}
                  className={cn(
                    'absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40',
                    aiSearch.isPending && 'animate-pulse'
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

            {criteria && criteriaChips(criteria).length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">AI hiểu bạn cần:</span>
                {criteriaChips(criteria).map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => dropCriterion(chip.clear)}
                    aria-label={`Bỏ điều kiện ${chip.label}`}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-200"
                  >
                    {chip.label}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="text-neutral-500">Thử câu mẫu:</span>
                {AI_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setPrompt(example);
                      runPrompt(example);
                    }}
                    className="text-left text-neutral-600 underline decoration-neutral-300 underline-offset-2 hover:text-brand-700"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kết quả AI nằm trên, danh sách Mentor luôn hiển thị bên dưới */}
      {aiOpen && aiSearch.isError && (
        <AIFallbackBanner
          onFallback={() => {
            setSearch(prompt);
            setAiOpen(false);
          }}
        />
      )}
      {aiOpen && aiResult && (
        <div className="space-y-6">
          <AiMatchResults
            matches={aiResult.matches}
            criteria={aiResult.criteria}
            mentors={mentorsQuery.data || []}
            loading={aiSearch.isPending}
            onBook={(match, slot) => setBooking({ match, slot })}
          />
          <hr className="border-neutral-200 dark:border-neutral-700" />
        </div>
      )}

      <QueryBoundary query={mentorsQuery}>
          {mentors.length === 0 ? (
            <EmptyState
              title="Không tìm thấy Mentor"
              description="Hãy thử từ khóa hoặc bộ lọc khác, hoặc bấm “Tìm với AI” để mô tả điều bạn cần."
              action={
                <Button variant="outline" onClick={() => setAiOpen(true)}>
                  <Sparkles className="mr-1.5 h-4 w-4" /> Tìm với AI
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">{aiOpen && aiResult ? `Tất cả Mentor (${mentors.length})` : `Tìm thấy ${mentors.length} Mentor`}</p>
                <p className="text-xs text-neutral-500">Hiển thị {visibleMentors.length} hồ sơ trên trang này</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleMentors.map((mentor) => {
                  const trial = mentor.pricing?.trial;
                  return (
                    <Card key={mentor.userId} className="flex flex-col justify-between shadow-2xs transition-all hover:border-brand-300">
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {mentor.acceptingRequests ? (
                            <Badge variant="success" dot>Đang nhận học viên</Badge>
                          ) : (
                            <Badge variant="secondary">Tạm ngưng nhận</Badge>
                          )}
                          {mentor.rating ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {mentor.rating.toFixed(1)}
                              <span className="font-normal text-neutral-500">({mentor.reviewCount} đánh giá)</span>
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-500">Mentor mới</span>
                          )}
                        </div>
                        <UserMiniCard userId={mentor.userId} showMajor />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5 rounded-lg border border-neutral-150 bg-neutral-50 p-2.5 text-xs text-neutral-600">
                          <div className="flex items-baseline justify-between gap-2">
                            <span>Học phí</span>
                            <strong className="text-sm tabular-nums text-brand-700">{formatStartingPrice(mentor)}</strong>
                          </div>
                          {mentor.pricing && (
                            <p className="text-neutral-500">
                              {mentor.pricing.minutesPerSession} phút/buổi
                              {mentor.pricing.packages.length > 0 &&
                                ` · gói ${mentor.pricing.packages.map((pkg) => pkg.sessions).join('/')} buổi`}
                            </p>
                          )}
                          {trial?.enabled && (
                            <p className="font-medium text-emerald-700">
                              Học thử {trial.minutes} phút · {formatPrice(trial.price).toLowerCase()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {mentor.subjects.slice(0, 4).map((subject) => (
                            <Chip key={subject} size="sm" className="border-brand-200 bg-brand-50 font-semibold text-brand-700">{subject}</Chip>
                          ))}
                        </div>
                        {mentor.availability.length > 0 && (
                          <p className="flex items-start gap-1.5 text-xs text-neutral-600">
                            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                            <span>{mentor.availability.slice(0, 2).map((slot) => formatScheduleSlot(slot)).join(', ')}{mentor.availability.length > 2 && ` +${mentor.availability.length - 2}`}</span>
                          </p>
                        )}
                        <p className="text-xs text-neutral-500">
                          {mentor.supportModes.map((mode) => MODE_LABELS[mode] || mode).join(' · ')}
                          {mentor.menteesCount ? ` · ${mentor.menteesCount} học viên từng học` : ''}
                        </p>
                      </CardContent>
                      <CardFooter className="flex items-center justify-between border-t border-neutral-100 pt-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/mentoring/mentors/${mentor.userId}`)}>
                          Xem hồ sơ <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" disabled={!mentor.acceptingRequests} onClick={() => setSelectedMentorId(mentor.userId)} variant="primary">
                          <Send className="mr-1 h-3.5 w-3.5" /> {trial?.enabled ? 'Đăng ký học thử' : 'Gửi yêu cầu'}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              <Pagination page={currentPage} pageSize={PAGE_SIZE} total={mentors.length} onChange={setPage} />
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

      {booking && (
        <SendMentoringRequestDialog
          open
          onOpenChange={(open) => !open && setBooking(null)}
          mentorId={booking.match.mentorId}
          initialTopic={aiResult?.criteria.subjects.join(', ') ?? ''}
          initialContent={prompt}
          initialPlanId={
            mentorsQuery.data?.find((mentor) => mentor.userId === booking.match.mentorId)?.pricing?.trial.enabled ? 'trial' : 'single'
          }
          initialPreferredTime={booking.slot}
        />
      )}
    </div>
  );
};

export default MentorBrowsePage;
