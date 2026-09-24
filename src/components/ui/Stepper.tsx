import React from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

export interface StepItem {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  current: number; // 0-indexed
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, current, className }) => {
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isCurrent = idx === current;
        const isUpcoming = idx > current;

        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  isDone && 'bg-brand-500/15 text-brand-600 border border-brand-500',
                  isCurrent && 'bg-brand-500 text-white shadow-md ring-4 ring-brand-500/20',
                  isUpcoming && 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                )}
              >
                {isDone ? <Check size={14} className="stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1.5 font-medium whitespace-nowrap',
                  isCurrent && 'text-brand-600 font-semibold',
                  isDone && 'text-neutral-700',
                  isUpcoming && 'text-neutral-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-3 -mt-5 transition-colors',
                  idx < current ? 'bg-brand-500' : 'bg-neutral-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
