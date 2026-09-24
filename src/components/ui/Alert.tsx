import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-xs [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 flex items-start gap-3',
  {
    variants: {
      tier: {
        neutral: 'bg-neutral-50 text-neutral-800 border-neutral-200 [&>svg]:text-neutral-500',
        pending: 'bg-[#e8effe] text-[#2952d9] border-[#c7d7fb] [&>svg]:text-[#3366ff]',
        attention: 'bg-[#fef6e7] text-[#92620a] border-[#f9e3b3] [&>svg]:text-[#d9910b]',
        success: 'bg-[#e7f7ee] text-[#16794a] border-[#bfead2] [&>svg]:text-[#1fa15c]',
        danger: 'bg-[#fdecec] text-[#b3261e] border-[#f7c9c7] [&>svg]:text-[#dc3c33]',
        brand: 'bg-brand-50 text-brand-900 border-brand-200 [&>svg]:text-brand-600',
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
