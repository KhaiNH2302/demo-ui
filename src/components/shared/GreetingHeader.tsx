import React from 'react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface GreetingHeaderProps {
  fullName?: string;
  className?: string;
}

function getGreetingTime(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/**
 * [C6] GreetingHeader — Mở đầu Home Feed
 * Text thuần, không phải Card. .text-page-title "Chào buổi sáng/chiều/tối, {fullName} 👋"
 * (đổi theo new Date().getHours()) + .text-meta ngày hôm nay.
 * Không số liệu, không khung viền — chủ đích tương phản với mở đầu kiểu "bảng điều khiển".
 */
export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ fullName, className }) => {
  const greeting = getGreetingTime();
  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className={cn('space-y-0.5', className)}>
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
        {greeting}, {fullName || 'bạn'} 👋
      </h1>
      <p className="text-xs text-neutral-500 capitalize">
        {todayStr}
      </p>
    </div>
  );
};

export default GreetingHeader;
