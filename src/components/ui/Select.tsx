import React from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

const WRAPPER_CLASS_RE =
  /^(?:(?:sm|md|lg|xl|2xl):)?(?:w-|min-w-|max-w-|flex-|shrink|grow|basis-|col-|self-|m[trblxy]?-)/;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      value,
      onValueChange,
      onChange,
      placeholder,
      error,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    const tokens = (className || '').split(/\s+/).filter(Boolean);
    const wrapperClasses = tokens.filter((t) => WRAPPER_CLASS_RE.test(t)).join(' ');
    const selectClasses = tokens.filter((t) => !WRAPPER_CLASS_RE.test(t)).join(' ');

    return (
      <div className={cn('relative w-full', wrapperClasses)}>
        <select
          ref={ref}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-75 transition-colors cursor-pointer',
            !value && placeholder && 'text-neutral-400',
            error && 'border-[#dc3c33] focus-visible:ring-[#dc3c33]/30 focus-visible:border-[#dc3c33]',
            selectClasses
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="text-neutral-900"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          size={16}
        />
      </div>
    );
  }
);
Select.displayName = 'Select';
