import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-medium select-none',
  {
    variants: {
      tier: {
        neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        pending: 'bg-[#e8effe] text-[#2952d9] border-[#c7d7fb]',
        attention: 'bg-[#fef6e7] text-[#92620a] border-[#f9e3b3]',
        success: 'bg-[#e7f7ee] text-[#16794a] border-[#bfead2]',
        danger: 'bg-[#fdecec] text-[#b3261e] border-[#f7c9c7]',
        brand: 'bg-brand-50 text-brand-700 border-brand-200',
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-neutral-100 text-neutral-800 border-neutral-200',
        outline: 'bg-transparent text-neutral-700 border-neutral-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs gap-1.5',
        md: 'px-2.5 py-1 text-xs gap-2',
      },
    },
    defaultVariants: {
      tier: 'neutral',
      size: 'sm',
    },
  }
);

const dotColors: Record<string, string> = {
  neutral: 'bg-neutral-400',
  pending: 'bg-[#3366ff]',
  attention: 'bg-[#d9910b]',
  success: 'bg-[#1fa15c]',
  danger: 'bg-[#dc3c33]',
  brand: 'bg-brand-500',
  primary: 'bg-primary',
  secondary: 'bg-neutral-500',
  outline: 'bg-neutral-400',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  variant?: 'neutral' | 'pending' | 'attention' | 'success' | 'danger' | 'brand' | 'primary' | 'secondary' | 'outline';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tier, variant, size, dot = false, children, ...props }, ref) => {
    const activeTier = (tier || variant || 'neutral') as any;
    return (
      <span ref={ref} className={cn(badgeVariants({ tier: activeTier, size }), className)} {...props}>
        {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[activeTier] || 'bg-neutral-400')} />}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
