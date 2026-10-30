import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, Clock, PartyPopper, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { STATUS_META } from '@/lib/statusMeta';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import type { MentorApplication } from '@/types/entities';
import { APPLICATION_STEPS, getFlaggedSteps } from './applicationSteps';

type Tone = 'pending' | 'attention' | 'success' | 'danger';
type StopState = 'done' | 'current' | 'upcoming';

interface Stop {
  title: string;
  caption: string;
  date?: string;
  state: StopState;
  tone: Tone;
}

const TONE_DOT: Record<Tone, string> = {
  pending: 'bg-brand-600 text-white ring-brand-200 dark:ring-brand-500/30',
  attention: 'bg-amber-500 text-white ring-amber-200 dark:ring-amber-500/30',
  success: 'bg-emerald-600 text-white ring-emerald-200 dark:ring-emerald-500/30',
  danger: 'bg-rose-600 text-white ring-rose-200 dark:ring-rose-500/30',
};

const TONE_TEXT: Record<Tone, string> = {
  pending: 'text-brand-700 dark:text-brand-300',
  attention: 'text-amber-700 dark:text-amber-300',
  success: 'text-emerald-700 dark:text-emerald-300',
  danger: 'text-rose-700 dark:text-rose-300',
};

const formatDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

// Ban Quản trị hẹn phản hồi trong 3 ngày làm việc kể từ ngày nộp
const addBusinessDays = (iso: string, days: number) => {
  const date = new Date(iso);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added++;
  }
  return date.toISOString();
};

const lastAt = (app: MentorApplication, status: MentorApplication['status']) =>
  [...(app.history || [])].reverse().find((h) => h.status === status)?.at;

const buildStops = (app: MentorApplication): Stop[] => {
  const reviewStarted = lastAt(app, 'UnderReview');
  const submitted: Stop = {
    title: 'Nộp hồ sơ',
    caption: 'Đã gửi tới Ban Quản trị',
    date: app.submittedAt,
    state: 'done',
    tone: 'success',
  };
  const review: Stop = { title: 'Xét duyệt', caption: 'Ban Quản trị đọc hồ sơ', date: reviewStarted, state: 'upcoming', tone: 'pending' };
  const result: Stop = { title: 'Kết quả', caption: 'Duyệt hoặc phản hồi lý do', state: 'upcoming', tone: 'pending' };

  switch (app.status) {
    case 'Submitted':
      return [submitted, { ...review, state: 'current', caption: 'Đang chờ tiếp nhận' }, result];
    case 'UnderReview':
      return [submitted, { ...review, state: 'current', caption: 'Đang đọc hồ sơ của bạn' }, result];
    case 'NeedsMoreInfo':
      return [
        submitted,
        { ...review, state: 'current', tone: 'attention', caption: 'Chờ bạn bổ sung', date: lastAt(app, 'NeedsMoreInfo') },
        result,
      ];
    case 'Approved':
      return [
        submitted,
        { ...review, state: 'done', tone: 'success', caption: 'Đã xem xong' },
        { ...result, title: 'Được duyệt', caption: 'Bạn đã là Mentor', state: 'done', tone: 'success', date: app.decidedAt },
      ];
    case 'Rejected':
      return [
        submitted,
        { ...review, state: 'done', tone: 'success', caption: 'Đã xem xong' },
        { ...result, title: 'Không được duyệt', caption: 'Xem lý do bên dưới', state: 'done', tone: 'danger', date: app.decidedAt },
      ];
    default:
      return [submitted, review, result];
  }
};

const StopDot: React.FC<{ stop: Stop }> = ({ stop }) => {
  if (stop.state === 'upcoming') {
    return <span className="h-9 w-9 rounded-full border-2 border-dashed border-neutral-300 bg-surface dark:border-neutral-600" />;
  }
  let Icon = stop.state === 'done' ? Check : Clock;
  if (stop.tone === 'attention') Icon = AlertCircle;
  if (stop.tone === 'danger') Icon = X;
  return (
    <span className={cn('relative flex h-9 w-9 items-center justify-center rounded-full ring-4', TONE_DOT[stop.tone])}>
      {stop.state === 'current' && (
        <span className={cn('absolute inset-0 rounded-full motion-safe:animate-ping opacity-30', TONE_DOT[stop.tone])} aria-hidden />
      )}
      <Icon className="relative h-4 w-4" strokeWidth={2.5} />
    </span>
  );
};

interface MentorApplicationStatusViewProps {
  application: MentorApplication;
  withdrawing: boolean;
  onWithdraw: () => void;
}

export const MentorApplicationStatusView: React.FC<MentorApplicationStatusViewProps> = ({ application, withdrawing, onWithdraw }) => {
  const navigate = useNavigate();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const stops = buildStops(application);
  const flaggedSteps = getFlaggedSteps(application);
  const firstFlaggedStep = Math.max(1, APPLICATION_STEPS.findIndex((step) => step.key === flaggedSteps[0]) + 1);
  const status = application.status;
  const isWaiting = status === 'Submitted' || status === 'UnderReview';
  const expectedBy = application.submittedAt ? formatDay(addBusinessDays(application.submittedAt, 3)) : undefined;
  const history = [...(application.history || [])].reverse();

  return (
    <div className="space-y-6">
      {/* Đường tiến trình: trả lời ngay "hồ sơ đang ở đâu" */}
      <section className="rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm sm:p-7 dark:border-neutral-700/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Hồ sơ Mentor của bạn</h2>
            <p className="text-sm text-neutral-500">
              Nộp ngày {formatDay(application.submittedAt) || 'chưa rõ'} · Mã hồ sơ {application.id}
            </p>
          </div>
          <StatusBadge status={status} domain="mentorApplication" />
        </div>

        <ol className="mt-8 grid grid-cols-3">
          {stops.map((stop, index) => (
            <li key={stop.title} className="relative flex flex-col items-center text-center">
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute right-1/2 top-[18px] h-1 w-full -translate-y-1/2 rounded-full',
                    stop.state === 'upcoming' ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-emerald-500/70'
                  )}
                />
              )}
              <span className="relative z-10">
                <StopDot stop={stop} />
              </span>
              <span
                className={cn(
                  'mt-3 text-sm font-semibold',
                  stop.state === 'upcoming' ? 'text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'
                )}
              >
                {stop.title}
              </span>
              <span className={cn('text-xs', stop.state === 'current' ? TONE_TEXT[stop.tone] : 'text-neutral-500')}>
                {stop.caption}
              </span>
              {stop.date && <span className="mt-0.5 text-xs tabular-nums text-neutral-400">{formatDay(stop.date)}</span>}
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Việc của bạn bây giờ */}
        <section
          className={cn(
            'space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6 lg:col-span-7',
            status === 'NeedsMoreInfo' && 'border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10',
            status === 'Approved' && 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10',
            status === 'Rejected' && 'border-rose-200 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/10',
            isWaiting && 'border-neutral-200 bg-surface dark:border-neutral-700/80'
          )}
        >
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Việc của bạn bây giờ</h3>

          {isWaiting && (
            <>
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                Bạn chưa cần làm gì. Ban Quản trị thường phản hồi trong 3 ngày làm việc
                {expectedBy ? <>, dự kiến trước <strong className="text-neutral-900 dark:text-neutral-100">{expectedBy}</strong></> : null}.
                Bạn sẽ nhận thông báo khi có kết quả.
              </p>
              <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <Button variant="outline" size="sm" onClick={() => setConfirmWithdraw(true)} loading={withdrawing}>
                  Rút hồ sơ
                </Button>
                <span className="text-xs text-neutral-500">Rút xong, bạn có thể sửa và nộp lại từ bản nháp.</span>
              </div>
            </>
          )}

          {status === 'NeedsMoreInfo' && (
            <>
              {application.reviewNote && (
                <blockquote className="border-l-4 border-amber-400 pl-4 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {application.reviewNote}
                  <footer className="mt-1 text-xs text-neutral-500">Ban Quản trị</footer>
                </blockquote>
              )}
              {flaggedSteps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">Cần sửa ở các bước:</p>
                  <ul className="space-y-2">
                    {flaggedSteps.map((key) => {
                      const index = APPLICATION_STEPS.findIndex((step) => step.key === key);
                      return (
                        <li key={key}>
                          <Link
                            to={`/mentor/apply/form?step=${index + 1}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-surface px-4 py-3 text-sm transition-colors hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 dark:border-amber-500/30"
                          >
                            <span>
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Bước {index + 1}: {APPLICATION_STEPS[index].title}</span>
                              <span className="block text-xs text-neutral-500">{APPLICATION_STEPS[index].description}</span>
                            </span>
                            <Pencil className="h-4 w-4 shrink-0 text-amber-700" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <Button className="w-full sm:w-auto" onClick={() => navigate(`/mentor/apply/form?step=${firstFlaggedStep}`)}>
                Bổ sung hồ sơ <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </>
          )}

          {status === 'Approved' && (
            <>
              <p className="flex items-start gap-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                Hồ sơ đã được duyệt. Làm 2 việc dưới đây để học viên tìm thấy và đặt lịch với bạn.
              </p>
              <ol className="space-y-2">
                {[
                  { to: '/mentor/profile', title: 'Đặt học phí, gói học và lịch rảnh', hint: 'Học viên thấy ngay trên thẻ Mentor của bạn.' },
                  { to: '/mentor/requests', title: 'Bật nhận yêu cầu và theo dõi yêu cầu mới', hint: 'Yêu cầu có hạn phản hồi, nên kiểm tra thường xuyên.' },
                ].map((item, index) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-surface px-4 py-3 text-sm transition-colors hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 dark:border-emerald-500/30"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</span>
                        <span className="block text-xs text-neutral-500">{item.hint}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-emerald-700" />
                    </Link>
                  </li>
                ))}
              </ol>
              <Button className="w-full sm:w-auto" onClick={() => navigate('/mentor')}>
                Mở Mentor Center
              </Button>
            </>
          )}

          {status === 'Rejected' && (
            <>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">Hồ sơ lần này chưa được duyệt.</p>
              <blockquote className="border-l-4 border-rose-400 pl-4 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                {application.reviewNote || 'Ban Quản trị chưa ghi lý do. Hãy liên hệ Phòng Công tác sinh viên để hỏi thêm.'}
                <footer className="mt-1 text-xs text-neutral-500">Ban Quản trị</footer>
              </blockquote>
              <p className="text-sm text-neutral-600">
                Nội dung bạn đã khai vẫn được giữ. Chỉnh lại theo lý do trên rồi nộp lại.
              </p>
              <Button className="w-full sm:w-auto" onClick={() => navigate('/mentor/apply/form')}>
                Chỉnh sửa và nộp lại
              </Button>
            </>
          )}
        </section>

        {/* Lịch sử xử lý */}
        <section className="rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm sm:p-6 lg:col-span-5 dark:border-neutral-700/80">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Lịch sử xử lý</h3>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Chưa có cập nhật nào.</p>
          ) : (
            <ol className="mt-4 space-y-0">
              {history.map((item, index) => {
                const meta = STATUS_META.mentorApplication[item.status as keyof typeof STATUS_META.mentorApplication];
                const isLatest = index === 0;
                return (
                  <li key={`${item.status}-${item.at}`} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < history.length - 1 && (
                      <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-neutral-200 dark:bg-neutral-700" />
                    )}
                    <span
                      className={cn(
                        'relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full',
                        isLatest ? 'bg-neutral-900 dark:bg-neutral-100' : 'border-2 border-neutral-300 bg-surface dark:border-neutral-600'
                      )}
                    />
                    <div className="min-w-0">
                      <p className={cn('text-sm', isLatest ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300')}>
                        {meta?.label || item.status}
                      </p>
                      {item.note && <p className="text-sm text-neutral-600">{item.note}</p>}
                      <p className="text-xs tabular-nums text-neutral-400">
                        {formatDateTime(item.at)} · {item.by === application.userId ? 'Bạn' : 'Ban Quản trị'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmWithdraw}
        onOpenChange={setConfirmWithdraw}
        title="Rút hồ sơ Mentor?"
        description="Hồ sơ sẽ ra khỏi hàng chờ xét duyệt. Nội dung vẫn được giữ để bạn sửa và nộp lại."
        confirmLabel="Rút hồ sơ"
        variant="danger"
        loading={withdrawing}
        onConfirm={() => {
          onWithdraw();
          setConfirmWithdraw(false);
        }}
      />
    </div>
  );
};
