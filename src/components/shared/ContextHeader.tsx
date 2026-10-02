import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

export interface ContextHeaderProps {
  backHref: string;
  title: string;
  subtitle?: string;
  avatar?: {
    src?: string;
    name?: string;
  };
  actions?: React.ReactNode;
  className?: string;
}

export const ContextHeader: React.FC<ContextHeaderProps> = ({
  backHref,
  title,
  subtitle,
  avatar,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'sticky top-14 z-20 flex items-center justify-between gap-3 border-b border-neutral-200 bg-surface/95 px-5 py-3.5 backdrop-blur-md transition-all',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors shrink-0"
          title="Quay lại"
        >
          <ChevronLeft size={18} />
        </Link>

        {avatar && (
          <Avatar src={avatar.src} name={avatar.name || title} size="sm" className="shrink-0" />
        )}

        <div className="min-w-0">
          <h2 className="text-sm font-bold text-neutral-900 truncate leading-snug">{title}</h2>
          {subtitle && <p className="text-[11px] text-neutral-500 truncate">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
