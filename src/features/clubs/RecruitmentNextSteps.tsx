import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import { formatClubDate, onboardingCalendar } from './recruitment';
import type { ClubOpportunity, ClubRepresentative } from '@/types/entities';

export function RecruitmentNextSteps({
  responseId,
  opportunity,
  contact,
}: {
  responseId: string;
  opportunity?: ClubOpportunity | null;
  contact?: (ClubRepresentative & { email?: string }) | null;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const conversation = useMutation({
    mutationFn: () =>
      apiClient.post<{ id: string }>(
        `/clubs/registrations/${responseId}/conversation`
      ),
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      navigate(`/chats/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const download = () => {
    const calendar = opportunity && onboardingCalendar(opportunity);
    if (!calendar) return;
    const url = URL.createObjectURL(
      new Blob([calendar], { type: 'text/calendar;charset=utf-8' })
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gap-mat-clb-${opportunity!.id}.ics`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="space-y-4 rounded-xl border border-tier-success-border bg-tier-success-bg p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-semibold text-tier-success-text">
        <CheckCircle2 size={20} />
        Bạn đã được nhận. Cùng chuẩn bị bước tiếp theo.
      </h2>
      {contact ? (
        <div className="space-y-1 text-sm text-tier-success-text">
          <p className="font-semibold">Người phụ trách: {contact.fullName}</p>
          <p>{contact.roleNote}</p>
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-block break-all underline underline-offset-4"
            >
              {contact.email}
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-tier-success-text">
          CLB chưa công bố người phụ trách. Theo dõi hồ sơ CLB để cập nhật đầu
          mối liên hệ.
        </p>
      )}
      {opportunity?.onboarding ? (
        <div className="space-y-1 text-sm text-tier-success-text">
          <p className="font-semibold">Buổi gặp mặt / onboarding</p>
          <p>
            {formatClubDate(opportunity.onboarding.startAt)} –{' '}
            {formatClubDate(opportunity.onboarding.endAt)}
          </p>
          <p className="break-words">{opportunity.onboarding.location}</p>
        </div>
      ) : (
        <p className="text-sm text-tier-success-text">
          Lịch gặp mặt chưa được công bố. Trao đổi với người phụ trách để thống
          nhất thời gian.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {contact && (
          <Button
            size="sm"
            loading={conversation.isPending}
            onClick={() => conversation.mutate()}
            leftIcon={<MessageSquare size={15} />}
          >
            Nhắn tin người phụ trách
          </Button>
        )}
        {opportunity && onboardingCalendar(opportunity) && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<CalendarPlus size={15} />}
            onClick={download}
          >
            Tải lịch gặp mặt (.ics)
          </Button>
        )}
      </div>
    </section>
  );
}
