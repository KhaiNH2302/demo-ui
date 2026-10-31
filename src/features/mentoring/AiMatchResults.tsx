import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Check, Star, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Button } from '@/components/ui/Button';
import { formatSessionTime, formatStartingPrice, getUpcomingSessionDays } from './plans';
import type { AiCriterionKey, AiMentorCriteria, AiMentorMatch, Mentor, TimeOfDay } from '@/types/entities';

const CHECK_LABELS: Record<AiCriterionKey, string> = {
  subject: 'Môn',
  schedule: 'Lịch',
  mode: 'Hình thức',
  budget: 'Học phí',
  trial: 'Học thử',
};

const TIME_HOURS: Record<TimeOfDay, [number, number]> = { morning: [6, 12], afternoon: [12, 18], evening: [18, 23] };

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

interface AiMatchResultsProps {
  matches: AiMentorMatch[];
  criteria: AiMentorCriteria;
  mentors: Mentor[];
  loading?: boolean;
  onBook: (match: AiMentorMatch, slot?: string) => void;
}

/** Kết quả AI xếp hạng: mỗi Mentor kèm các điều kiện khớp (✓) hoặc lệch (✗) và giờ trống gần nhất. */
export const AiMatchResults: React.FC<AiMatchResultsProps> = ({ matches, criteria, mentors, loading, onBook }) => {
  const navigate = useNavigate();
  const [expandedChecks, setExpandedChecks] = useState<Record<string, boolean>>({});
  const mentorById = (id: string) => mentors.find((mentor) => mentor.userId === id);

  return (
    <section className="space-y-3" aria-live="polite" aria-busy={loading}>
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
              ? `Hiện chưa có Mentor đang nhận kèm ${criteria.subjects.join(', ')}. Thử bỏ bớt điều kiện ở trên, hoặc đăng bài để Mentor tìm tới bạn.`
              : 'Thêm môn bạn cần vào mô tả để AI lọc chính xác hơn.'}
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={() => navigate('/mentoring/new?type=need')}>Đăng bài nhờ kèm</Button>
          </div>
        </div>
      ) : (
        <ol className={cn('space-y-3 transition-opacity', loading && 'opacity-60')}>
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
                              className={cn('items-start gap-2 text-sm', check.ok && missCount > 0 && !showAll ? 'hidden sm:flex' : 'flex')}
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
                        <Button size="sm" onClick={() => onBook(match, slot?.label)}>
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
  );
};
