import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap [&_svg]:shrink-0 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        // brand-600: chữ trắng trên brand-500 (#3366ff) chỉ ~4.4:1, dưới AA cho chữ 13px (dark mode 500 = 600)
        primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        outline: 'border border-neutral-300 bg-surface text-neutral-700 hover:bg-neutral-100 shadow-sm',
        ghost: 'text-neutral-700 hover:bg-neutral-100',
        destructive: 'bg-tier-danger-dot text-white hover:opacity-90 shadow-sm',
        danger: 'bg-tier-danger-dot text-white hover:opacity-90 shadow-sm',
        link: 'text-brand-600 dark:text-brand-400 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-small rounded-sm gap-1.5',
        md: 'h-10 px-4 text-body rounded-md gap-2',
        lg: 'h-11 px-6 text-body rounded-md gap-2.5',
        icon: 'h-10 w-10 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const busy = loading || isLoading;
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || busy}
        aria-disabled={disabled || busy}
        aria-busy={busy}
        {...props}
      >
        {busy ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} /> : leftIcon}
        {children}
        {!busy && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
