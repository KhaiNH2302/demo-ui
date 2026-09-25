import React from 'react';
import { cn } from '@/lib/cn';

export interface CoverHeaderProps {
  coverUrl?: string;
  avatarUrl?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const CoverHeader: React.FC<CoverHeaderProps> = ({
  coverUrl,
  avatarUrl,
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn('rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-xs', className)}>
      {/* Cover Image Banner */}
      <div className="relative h-40 md:h-52 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 overflow-hidden">
        {coverUrl && (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover opacity-90 transition-opacity"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Header Info Area */}
      <div className="px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          <div className="flex items-end gap-4">
            {/* Logo / Avatar Overlap */}
            <div className="relative h-24 w-24 rounded-2xl bg-white p-1 ring-4 ring-white shadow-md shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={title}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-2xl">
                  {title.charAt(0)}
                </div>
              )}
            </div>

            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
                {badge}
              </div>
              {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
              {children && <div className="mt-2">{children}</div>}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2.5 shrink-0 pb-1">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
