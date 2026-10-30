import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Wallet, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatScheduleSlot } from '@/lib/format';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { FormField } from '@/components/shared/FormField';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DialogOverlay, DialogPortal } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { toast } from '@/components/ui/Toast';
import type { Mentor, MentoringRequest, MentorPost } from '@/types/entities';
import { describePlan, describePostFee, formatPrice, getPlanOptions } from './plans';

interface SendMentoringRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  initialTopic?: string;
  initialContent?: string;
  initialPlanId?: string;
  // Ngày giờ cụ thể học viên đã chọn ở khung đặt lịch trên hồ sơ Mentor / trang AI
  initialPreferredTime?: string;
  sourcePostId?: string;
  recipientLabel?: string;
}

const getDefaultDeadline = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

export const SendMentoringRequestDialog: React.FC<SendMentoringRequestDialogProps> = ({
  open,
  onOpenChange,
  mentorId,
  initialTopic = '',
  initialContent = '',
  initialPlanId,
  initialPreferredTime,
  sourcePostId,
  recipientLabel = 'Mentor',
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState(initialTopic);
  const [content, setContent] = useState(initialContent);
  const [deadline, setDeadline] = useState(getDefaultDeadline);
  const [planId, setPlanId] = useState('');
  const [preferredSlots, setPreferredSlots] = useState<string[]>([]);
  // Đã chọn gói/giờ từ trước thì gập phần chọn lại thành 1 dòng tóm tắt
  const [changingPlan, setChangingPlan] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Dùng chung cache với trang Tìm Mentor; bài Need Mentor gửi tới học viên sẽ không có hồ sơ Mentor
  const mentorsQuery = useQuery({
    queryKey: ['mentoring', 'mentors'],
    queryFn: () => apiClient.get<Mentor[]>('/mentoring/mentors'),
    enabled: open && !sourcePostId,
  });
  const mentor = sourcePostId ? undefined : mentorsQuery.data?.find((item) => item.userId === mentorId);

  // Đăng ký từ bài đăng: nhắc lại lịch, học phí, số buổi của bài để người gửi biết mình đang đồng ý với điều gì
  const postQuery = useQuery({
    queryKey: ['mentoring', 'posts', sourcePostId],
    queryFn: () => apiClient.get<{ post: MentorPost }>(`/mentoring/posts/${sourcePostId}`),
    enabled: open && Boolean(sourcePostId),
  });
  const post = postQuery.data?.post;
  const planOptions = useMemo(() => getPlanOptions(mentor), [mentor]);
  const selectedPlan = planOptions.find((option) => option.id === planId);
  const preselected = Boolean(initialPlanId || initialPreferredTime);

  // Mỗi lần mở: điền lại từ đầu theo nơi gọi (hồ sơ, trang AI, thẻ Mentor...)
  useEffect(() => {
    if (!open) return;
    setTopic(initialTopic);
    setContent(initialContent);
    setDeadline(getDefaultDeadline());
    setPreferredSlots(initialPreferredTime ? [initialPreferredTime] : []);
    setChangingPlan(false);
  }, [open, initialTopic, initialContent, initialPreferredTime]);

  useEffect(() => {
    if (!open || planOptions.length === 0) return;
    setPlanId(planOptions.some((option) => option.id === initialPlanId) ? initialPlanId! : planOptions[0].id);
  }, [open, initialPlanId, planOptions]);

  const slotLabels = useMemo(() => {
    const weekly = (mentor?.availability || []).map((slot) => formatScheduleSlot(slot));
    return initialPreferredTime && !weekly.includes(initialPreferredTime) ? [initialPreferredTime, ...weekly] : weekly;
  }, [mentor, initialPreferredTime]);

  const toggleSlot = (label: string) =>
    setPreferredSlots((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));

  const dirty = topic.trim() !== initialTopic.trim() || content.trim() !== initialContent.trim();

  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  };

  const sendMutation = useMutation({
    mutationFn: () =>
      apiClient.post<MentoringRequest>('/mentoring/requests', {
        mentorId,
        topic,
        content,
        sourceType: sourcePostId ? 'POST' : 'DIRECT',
        sourcePostId,
        deadline,
        planType: selectedPlan?.type,
        packageId: selectedPlan?.packageId,
        planSummary: selectedPlan ? describePlan(selectedPlan) : undefined,
        totalSessions: selectedPlan?.sessions ?? post?.sessions,
        preferredTime: preferredSlots.length ? preferredSlots : undefined,
      }),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu. Mentor sẽ phản hồi trước hạn bạn chọn.');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] });
      navigate('/mentoring/requests');
    },
    onError: (error: any) => toast.error(error?.message || 'Chưa gửi được yêu cầu, thử lại sau ít phút.'),
  });

  const canSend = topic.trim() && content.trim() && deadline;
  const showPicker = !preselected || changingPlan || !selectedPlan;

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              'fixed z-51 flex flex-col bg-surface shadow-xl focus:outline-none dark:border-neutral-700',
              // Điện thoại: bảng trượt từ dưới lên
              'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl border-t border-neutral-200',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom duration-200',
              // Từ sm: popup giữa màn hình
              'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh] sm:rounded-2xl sm:border',
              'sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95'
            )}
          >
            {/* Thanh kéo chỉ để báo đây là bảng trượt trên điện thoại */}
            <span aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-neutral-300 sm:hidden" />

            <header className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 pb-4 pt-3 sm:pt-5 dark:border-neutral-800">
              <div className="min-w-0 space-y-2">
                <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Gửi yêu cầu kèm học
                </DialogPrimitive.Title>
                <UserMiniCard userId={mentorId} showMajor />
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Đóng"
                className="rounded-md p-1 text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              id="mentoring-request-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSend) sendMutation.mutate();
              }}
              className="flex-1 space-y-5 overflow-y-auto px-5 py-4"
            >
              {/* Tóm tắt gói & giờ: điều quan trọng nhất của yêu cầu */}
              {planOptions.length > 0 && !showPicker && selectedPlan && (
                <section className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5 text-sm">
                      <p className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                        <Wallet className="h-4 w-4 shrink-0 text-brand-600" />
                        {selectedPlan.title} · {formatPrice(selectedPlan.price)}
                      </p>
                      <p className="pl-6 text-neutral-600">
                        {selectedPlan.sessions > 1 ? `${selectedPlan.sessions} buổi × ` : ''}
                        {selectedPlan.minutes} phút
                      </p>
                      {preferredSlots.length > 0 && (
                        <p className="flex items-start gap-2 text-neutral-800 dark:text-neutral-200">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                          <span className="tabular-nums">{preferredSlots.join(', ')}</span>
                        </p>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setChangingPlan(true)}>
                      Đổi
                    </Button>
                  </div>
                </section>
              )}

              {post && (
                <section className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
                  <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{post.title}</p>
                  <dl className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                    <div className="flex items-start gap-2">
                      <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <dt className="sr-only">{post.postType === 'NEED_MENTOR' ? 'Ngân sách' : 'Học phí'}</dt>
                      <dd className="font-semibold">
                        {describePostFee(post.fee)}
                        {post.sessions ? <span className="font-normal text-neutral-600">, {post.sessions} buổi</span> : null}
                        {post.trial && <span className="font-normal text-neutral-600"> · có học thử</span>}
                      </dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <dt className="sr-only">Lịch học</dt>
                      <dd>{post.schedule?.length ? post.schedule.join(', ') : 'Lịch thỏa thuận'}</dd>
                    </div>
                  </dl>
                </section>
              )}

              {planOptions.length > 0 && showPicker && (
                <FormField label="Hình thức đăng ký" required>
                  <RadioGroup value={planId} onValueChange={setPlanId} className="gap-2">
                    {planOptions.map((option) => (
                      <label
                        key={option.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                          planId === option.id ? 'border-brand-300 bg-brand-50/60' : 'border-neutral-200 hover:bg-neutral-50'
                        )}
                      >
                        <RadioGroupItem value={option.id} className="mt-0.5" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-neutral-900">{option.title}</span>
                            <span className="text-sm font-semibold tabular-nums text-brand-700">{formatPrice(option.price)}</span>
                          </span>
                          <span className="block text-xs text-neutral-500">
                            {option.sessions} buổi × {option.minutes} phút
                            {option.type === 'TRIAL' && ' · gặp thử trước khi quyết định học tiếp'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </FormField>
              )}

              {showPicker && slotLabels.length > 0 && (
                <FormField label="Khung giờ bạn học được" helperText="Chọn một hoặc nhiều khung giờ để Mentor chốt lịch nhanh hơn.">
                  <div className="flex flex-wrap gap-2">
                    {slotLabels.map((label) => (
                      <Chip key={label} selected={preferredSlots.includes(label)} onClick={() => toggleSlot(label)}>
                        {label}
                      </Chip>
                    ))}
                  </div>
                </FormField>
              )}

              <FormField label="Môn / chủ đề" required>
                <Input
                  placeholder="VD: CSD201, duyệt cây nhị phân"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Bạn đang vướng ở đâu?" required helperText="Mentor đọc phần này để chuẩn bị trước buổi học.">
                <Textarea
                  rows={4}
                  placeholder="VD: Em làm bài tập duyệt cây vẫn sai thứ tự, tuần sau thi giữa kỳ..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </FormField>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
                <label htmlFor="request-deadline">Mentor cần trả lời trước</label>
                <Input
                  id="request-deadline"
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-9 w-auto"
                />
              </div>
            </form>

            {/* Nút gửi luôn nằm ở đáy, không bị bàn phím hay nội dung dài đẩy mất */}
            <footer className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-neutral-800">
              <p className="hidden text-xs text-neutral-500 sm:block">
                {selectedPlan && selectedPlan.price > 0 ? 'Học phí trả trực tiếp cho Mentor sau khi chốt lịch.' : `Gửi tới ${recipientLabel}`}
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={requestClose}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  form="mentoring-request-form"
                  className="flex-1 sm:flex-none"
                  disabled={!canSend}
                  loading={sendMutation.isPending}
                >
                  Gửi yêu cầu
                </Button>
              </div>
            </footer>
          </DialogPrimitive.Content>
        </DialogPortal>
      </DialogPrimitive.Root>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Bỏ yêu cầu đang viết?"
        description="Nội dung bạn vừa gõ sẽ không được lưu."
        confirmLabel="Bỏ yêu cầu"
        cancelLabel="Viết tiếp"
        variant="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onOpenChange(false);
        }}
      />
    </>
  );
};
