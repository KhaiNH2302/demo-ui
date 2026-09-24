import React from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={error}
        className={cn(
          'flex min-h-24 w-full rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-75 resize-y transition-colors',
          error && 'border-[#dc3c33] focus-visible:ring-[#dc3c33]/30 focus-visible:border-[#dc3c33]',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
