import React from 'react';
import { CalendarClock, Info, Wallet } from 'lucide-react';
import { formatScheduleSlot } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import type { Mentor } from '@/types/entities';
import { formatPrice, getPlanOptions } from './plans';

interface MentorOfferPanelProps {
  mentor: Mentor;
  // Không truyền khi chủ hồ sơ tự xem: chỉ hiển thị, không có nút đăng ký
  onChoosePlan?: (planId: string) => void;
}

// Khối "Học phí & lịch học" trên hồ sơ Mentor: trả lời ngay số buổi, học phí, lịch rảnh
export const MentorOfferPanel: React.FC<MentorOfferPanelProps> = ({ mentor, onChoosePlan }) => {
  const options = getPlanOptions(mentor);
  const canRequest = Boolean(onChoosePlan) && mentor.acceptingRequests;

  return (
    <section className="bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 shadow-sm p-5 sm:p-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            <Wallet className="h-4 w-4 text-primary" /> Học phí & gói học
          </h2>
          {options.length === 0 ? (
            <p className="text-sm text-neutral-600">Mentor chưa công bố học phí. Hãy nhắn tin để hỏi trước khi gửi yêu cầu.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              {options.map((option) => (
                <li key={option.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {option.title}
                      {option.type === 'TRIAL' && (
                        <span className="ml-2 text-xs font-medium text-emerald-700">học trước, quyết sau</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {option.sessions} buổi × {option.minutes} phút
                      {option.type === 'PACKAGE' &&
                        ` · khoảng ${formatPrice(Math.round(option.price / option.sessions))}/buổi`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-brand-700 tabular-nums">{formatPrice(option.price)}</span>
                    {canRequest && (
                      <Button size="sm" variant={option.type === 'TRIAL' ? 'primary' : 'outline'} onClick={() => onChoosePlan?.(option.id)}>
                        Đăng ký
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="flex items-start gap-1.5 text-xs text-neutral-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Học phí trả trực tiếp cho Mentor sau khi Mentor nhận yêu cầu và hai bên chốt lịch.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            <CalendarClock className="h-4 w-4 text-primary" /> Lịch rảnh hằng tuần
          </h2>
          {mentor.availability.length === 0 ? (
            <p className="text-sm text-neutral-600">Mentor chưa cập nhật lịch rảnh.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              {mentor.availability.map((slot) => {
                const label = formatScheduleSlot(slot);
                return <li key={label} className="tabular-nums">{label}</li>;
              })}
            </ul>
          )}
          {!mentor.acceptingRequests && (
            <p className="text-xs font-medium text-amber-700">Mentor đang tạm ngưng nhận học viên mới.</p>
          )}
        </div>
      </div>
    </section>
  );
};
