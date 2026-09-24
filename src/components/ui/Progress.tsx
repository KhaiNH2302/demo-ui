import React from 'react';
import { cn } from '@/lib/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  className,
  value,
  max = 100,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  let barColor = 'bg-brand-500';
  if (percentage >= 100) {
    barColor = 'bg-[#dc3c33]'; // tier danger
  } else if (percentage >= 80) {
    barColor = 'bg-[#d9910b]'; // tier attention
  }

  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-neutral-100', className)}
      {...props}
    >
      <div
        className={cn('h-full w-full flex-1 transition-all duration-300', barColor)}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
};
