import React from 'react';
import { CalendarDays, Wallet } from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';

// Gói học + khung giờ học viên chọn khi gửi yêu cầu; dùng ở cả phía học viên và Mentor Center
export const RequestPlanDetails: React.FC<{ request: MentoringRequest }> = ({ request }) => {
  const slots = request.preferredTime ? [request.preferredTime].flat() : [];
  if (!request.planSummary && slots.length === 0) return null;

  return (
    <div className="space-y-1.5 text-xs text-neutral-600">
      {request.planSummary && (
        <p className="flex items-start gap-1.5">
          <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <span className={request.planType === 'TRIAL' ? 'font-medium text-emerald-700' : undefined}>
            {request.planSummary}
          </span>
        </p>
      )}
      {slots.length > 0 && (
        <p className="flex items-start gap-1.5">
          <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <span>Học được: {slots.join(', ')}</span>
        </p>
      )}
    </div>
  );
};
