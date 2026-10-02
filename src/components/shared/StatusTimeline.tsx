import React from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

export interface TimelineStep {
  key?: string;
  label: string;
  state?: 'done' | 'completed' | 'current' | 'upcoming' | 'rejected';
  status?: 'done' | 'completed' | 'current' | 'upcoming' | 'rejected';
}

export interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ steps, className }) => {
  return (
    <div className={cn('flex items-center w-full overflow-x-auto py-2', className)}>
      {steps.map((step, idx) => {
        const activeState = step.state || step.status || 'upcoming';
        const isDone = activeState === 'done' || activeState === 'completed';
        const isCurrent = activeState === 'current';
        const isRejected = activeState === 'rejected';
        const isUpcoming = activeState === 'upcoming';

        return (
          <React.Fragment key={step.key || `${step.label}_${idx}`}>
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                  isDone && 'bg-[#1fa15c] text-white',
                  isCurrent && 'border-2 border-primary bg-surface text-primary ring-2 ring-primary/20',
                  isRejected && 'bg-[#dc3c33] text-white',
                  isUpcoming && 'bg-neutral-200 text-neutral-500'
                )}
              >
                {isDone ? <Check size={12} className="stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] mt-1 whitespace-nowrap font-medium',
                  isCurrent && 'text-primary font-bold',
                  isDone && 'text-[#16794a]',
                  isRejected && 'text-[#b3261e]',
                  isUpcoming && 'text-neutral-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && !isRejected && (
              <div
                className={cn(
                  'h-0.5 min-w-[2rem] flex-1 mx-2 -mt-4 transition-colors',
                  isDone ? 'bg-[#1fa15c]' : 'bg-neutral-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
