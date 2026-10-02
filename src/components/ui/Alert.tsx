import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-xs [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 flex items-start gap-3',
  {
    variants: {
      tier: {
        neutral: 'bg-tier-neutral-bg text-tier-neutral-text border-tier-neutral-border [&>svg]:text-tier-neutral-dot',
        pending: 'bg-tier-pending-bg text-tier-pending-text border-tier-pending-border [&>svg]:text-tier-pending-dot',
        attention: 'bg-tier-attention-bg text-tier-attention-text border-tier-attention-border [&>svg]:text-tier-attention-dot',
        success: 'bg-tier-success-bg text-tier-success-text border-tier-success-border [&>svg]:text-tier-success-dot',
        danger: 'bg-tier-danger-bg text-tier-danger-text border-tier-danger-border [&>svg]:text-tier-danger-dot',
        brand: 'bg-brand-50 text-brand-900 border-brand-200 [&>svg]:text-brand-600 dark:bg-brand-950/40 dark:text-brand-200 dark:border-brand-800 dark:[&>svg]:text-brand-400',
      },
    },
    defaultVariants: {
      tier: 'neutral',
    },
  }
);

const defaultIcons: Record<string, any> = {
  neutral: Info,
  pending: Info,
  attention: AlertTriangle,
  success: CheckCircle2,
  danger: AlertCircle,
  brand: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  variant?: 'neutral' | 'pending' | 'attention' | 'success' | 'danger' | 'brand';
  title?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, tier, variant, title, icon, onClose, children, ...props }, ref) => {
    const activeTier = (tier || variant || 'neutral') as any;
    const IconComponent = defaultIcons[activeTier] || Info;
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ tier: activeTier }), className)}
        {...props}
      >
        <div className="shrink-0 mt-0.5">
          {icon || <IconComponent size={16} />}
        </div>
        <div className="flex-1 leading-relaxed">
          {title && <div className="font-semibold text-sm mb-0.5">{title}</div>}
          {children}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';
