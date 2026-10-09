import React from 'react';
import { cn } from '@/lib/cn';
import { useFieldAccessibility } from './FieldContext';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    const fieldProps = useFieldAccessibility(props, error);
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          'flex min-h-24 w-full rounded-sm border border-neutral-300 dark:border-neutral-700 bg-surface px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:opacity-75 resize-y transition-colors',
          error && 'border-[#dc3c33] focus-visible:ring-[#dc3c33]/30 focus-visible:border-[#dc3c33]',
          className
        )}
        {...props}
        {...fieldProps}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
