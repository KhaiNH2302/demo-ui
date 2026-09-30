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
    <div className={cn('rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm', className)}>
      {/* Cover Image Banner (144px height per 02-shared-components.md § 2.3) */}
      <div className="relative h-36 md:h-40 w-full bg-gradient-to-br from-accent-500 to-brand-500 overflow-hidden">
        {coverUrl && (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Header Info Area */}
      <div className="px-6 pb-5 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-11 mb-3">
          <div className="flex items-end gap-4">
            {/* Logo / Avatar Overlap (88px) */}
            <div className="relative h-[88px] w-[88px] rounded-xl bg-white p-0.5 ring-4 ring-white shadow-sm shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={title}
                  className="h-full w-full rounded-[10px] object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-[10px] bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-2xl">
                  {title.charAt(0)}
                </div>
              )}
            </div>

            <div className="pb-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-page-title text-neutral-900">{title}</h1>
                {badge}
              </div>
              {subtitle && <p className="text-meta text-neutral-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0 pb-0.5 flex-wrap">{actions}</div>}
        </div>

        {children && <div className="pt-2 border-t border-neutral-100">{children}</div>}
      </div>
    </div>
  );
};
