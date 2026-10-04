import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-full border font-medium select-none',
  {
    variants: {
      tier: {
        neutral: 'bg-tier-neutral-bg text-tier-neutral-text border-tier-neutral-border',
        pending: 'bg-tier-pending-bg text-tier-pending-text border-tier-pending-border',
        attention: 'bg-tier-attention-bg text-tier-attention-text border-tier-attention-border',
        success: 'bg-tier-success-bg text-tier-success-text border-tier-success-border',
        danger: 'bg-tier-danger-bg text-tier-danger-text border-tier-danger-border',
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
  neutral: 'bg-tier-neutral-dot',
  pending: 'bg-tier-pending-dot',
  attention: 'bg-tier-attention-dot',
  success: 'bg-tier-success-dot',
  danger: 'bg-tier-danger-dot',
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
        {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[activeTier] || 'bg-tier-neutral-dot')} />}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
