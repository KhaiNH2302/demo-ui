import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Inbox, MessageSquare, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import type { MentoringRequest } from '@/types/entities';
import { RequestPlanDetails } from '@/features/mentoring/RequestPlanDetails';
import { useMentorRequestActions } from './useMentorRequestActions';

type Tab = 'pending' | 'accepted' | 'rejected';

const TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'Chờ trả lời' },
  { value: 'accepted', label: 'Đã kết nối' },
  { value: 'rejected', label: 'Đã từ chối' },
];

const EMPTY_TEXT: Record<Tab, string> = {
  pending: 'Không có yêu cầu nào đang chờ. Hồ sơ có đủ học phí và lịch rảnh sẽ được đặt nhiều hơn.',
  accepted: 'Bạn chưa nhận kèm ai.',
  rejected: 'Bạn chưa từ chối yêu cầu nào.',
};

// Lý do hay gặp để Mentor từ chối nhanh, vẫn sửa được trước khi gửi
const QUICK_REASONS = [
  'Mình đã kín lịch khung giờ này',
  'Mình chưa nhận kèm môn này',
  'Mình đã đủ học viên tháng này',
  'Nội dung chưa rõ, bạn mô tả thêm giúp mình',
];

const DAY_MS = 86_400_000;

const deadlineInfo = (deadline?: string) => {
  if (!deadline) return { label: 'Không có hạn', tone: 'neutral' as const, ms: Number.POSITIVE_INFINITY };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return { label: 'Đã quá hạn', tone: 'expired' as const, ms };
  const days = Math.floor(ms / DAY_MS);
  if (days === 0) return { label: 'Hạn hôm nay', tone: 'urgent' as const, ms };
  if (days <= 2) return { label: `Còn ${days} ngày`, tone: 'soon' as const, ms };
  return { label: `Còn ${days} ngày`, tone: 'neutral' as const, ms };
};

const TONE_CLASS = {
  expired: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800',
  urgent: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  soon: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
};

export const MentorRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = tabParam === 'accepted' || tabParam === 'rejected' ? tabParam : 'pending';

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rejecting, setRejecting] = useState<MentoringRequest | null>(null);
  const [reason, setReason] = useState('');

  const requestsQuery = useQuery({
    queryKey: ['mentor', 'requests'],
    queryFn: () => apiClient.get<MentoringRequest[]>('/mentor/requests'),
  });

  const { accept, reject } = useMentorRequestActions({
    onRejected: () => {
      setRejecting(null);
      setReason('');
    },
  });

  const all = requestsQuery.data || [];
  const byTab: Record<Tab, MentoringRequest[]> = {
    pending: all.filter((r) => r.status === 'PENDING_MENTOR_RESPONSE'),
    accepted: all.filter((r) => r.status === 'ACCEPTED'),
    rejected: all.filter((r) => r.status === 'REJECTED'),
  };
  // Chờ trả lời: hạn gần nhất lên đầu; tab khác: mới nhất lên đầu
  const items = [...byTab[tab]].sort((a, b) =>
    tab === 'pending'
      ? deadlineInfo(a.deadline).ms - deadlineInfo(b.deadline).ms
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800" role="tablist" aria-label="Lọc yêu cầu">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setSearchParams(item.value === 'pending' ? {} : { tab: item.value }, { replace: true })}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              tab === item.value
                ? 'bg-surface text-neutral-900 shadow-xs dark:text-neutral-100'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
            )}
          >
            {item.label} <span className="tabular-nums text-neutral-400">{byTab[item.value].length}</span>
          </button>
        ))}
      </div>

      <QueryBoundary queries={[requestsQuery]}>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
            <Inbox className="mx-auto mb-3 h-7 w-7 text-neutral-300" />
            <p className="text-sm text-neutral-600">{EMPTY_TEXT[tab]}</p>
            {tab === 'pending' && (
              <Button size="sm" variant="outline" className="mt-4" onClick={() => navigate('/mentor/profile')}>
                Xem lại hồ sơ & học phí
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((req) => {
              const studentId = req.requesterId && req.requesterId !== req.mentorId ? req.requesterId : req.studentId;
              const due = deadlineInfo(req.deadline);
              const isOpen = Boolean(expanded[req.id]);
              const expired = due.tone === 'expired';
              return (
                <li
                  key={req.id}
                  className={cn(
                    'rounded-2xl border bg-surface p-4 sm:p-5',
                    tab === 'pending' && due.tone === 'urgent'
                      ? 'border-rose-200 dark:border-rose-500/30'
                      : 'border-neutral-200 dark:border-neutral-700/80'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <UserMiniCard userId={studentId} showMajor />
                    <div className="flex items-center gap-2">
                      {req.sourceType === 'POST' && (
                        <span className="text-xs text-neutral-500">Từ bài đăng</span>
                      )}
                      {tab === 'pending' && (
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', TONE_CLASS[due.tone])}>
                          {due.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">{req.topic}</h3>
                  <div className="mt-2">
                    <RequestPlanDetails request={req} />
                  </div>

                  <p
                    className={cn(
                      'mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-400',
                      !isOpen && 'line-clamp-2'
                    )}
                  >
                    {req.content}
                  </p>
                  {req.content.length > 140 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [req.id]: !e[req.id] }))}
                      className="mt-1 text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                    >
                      {isOpen ? 'Thu gọn' : 'Đọc hết'}
                    </button>
                  )}

                  {req.status === 'REJECTED' && req.rejectReason && (
                    <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-800">
                      Lý do bạn gửi: {req.rejectReason}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <span className="text-xs text-neutral-500">
                      Gửi ngày {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    {req.status === 'PENDING_MENTOR_RESPONSE' && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRejecting(req)}
                          disabled={expired}
                        >
                          <X className="mr-1 h-4 w-4" /> Từ chối
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => accept.mutate(req.id)}
                          loading={accept.isPending && accept.variables === req.id}
                          disabled={expired}
                        >
                          <Check className="mr-1 h-4 w-4" /> Nhận kèm
                        </Button>
                      </div>
                    )}
                    {req.status === 'ACCEPTED' && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/chats?targetUser=${studentId}`)}>
                        <MessageSquare className="mr-1.5 h-4 w-4" /> Nhắn chốt lịch
                      </Button>
                    )}
                  </div>
                  {expired && req.status === 'PENDING_MENTOR_RESPONSE' && (
                    <p className="mt-2 text-xs text-neutral-500">Yêu cầu đã quá hạn trả lời nên không nhận được nữa.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>

      {/* Từ chối: chọn nhanh lý do, học viên thấy lý do này */}
      <Dialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => {
          if (!open) {
            setRejecting(null);
            setReason('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Học viên sẽ thấy lý do này. Một câu ngắn giúp bạn ấy tìm Mentor khác nhanh hơn.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((item) => (
                <Chip key={item} selected={reason === item} onClick={() => setReason(item)}>
                  {item}
                </Chip>
              ))}
            </div>
            <Textarea
              rows={3}
              aria-label="Lý do từ chối"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Hoặc tự viết lý do..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Hủy</Button>
            <Button
              variant="danger"
              loading={reject.isPending}
              onClick={() => rejecting && reject.mutate({ id: rejecting.id, reason: reason.trim() || undefined })}
            >
              Từ chối yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorRequestsPage;
