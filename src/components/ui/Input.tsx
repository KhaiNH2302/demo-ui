import React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const WRAPPER_CLASS_RE =
  /^(?:(?:sm|md|lg|xl|2xl):)?(?:w-|min-w-|max-w-|flex-|shrink|grow|basis-|col-|self-|m[trblxy]?-)/;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    const tokens = (className || '').split(/\s+/).filter(Boolean);
    const wrapperClasses = tokens.filter((t) => WRAPPER_CLASS_RE.test(t)).join(' ');
    const inputClasses = tokens.filter((t) => !WRAPPER_CLASS_RE.test(t)).join(' ');

    return (
      <div className={cn('relative flex items-center w-full', wrapperClasses)}>
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 z-10 flex items-center text-neutral-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          aria-invalid={error}
          className={cn(
            'flex h-10 w-full rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-75 transition-colors',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-[#dc3c33] focus-visible:ring-[#dc3c33]/30 focus-visible:border-[#dc3c33]',
            inputClasses
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 z-10 flex items-center text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
