import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
        {label}
        {required && <span className="text-[#dc3c33]">*</span>}
      </label>

      {children}

      {error ? (
        <div className="flex items-center gap-1 text-[11px] text-[#b3261e] mt-0.5">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-400 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
