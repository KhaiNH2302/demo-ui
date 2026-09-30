import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface EntityRowProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  unread?: boolean;
  dense?: boolean;
  className?: string;
}

export const EntityRow: React.FC<EntityRowProps> = ({
  leading,
  title,
  subtitle,
  meta,
  badge,
  trailing,
  actions,
  onClick,
  href,
  unread = false,
  dense = false,
  className,
}) => {
  const rightContent = trailing ?? actions;

  const content = (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-3 transition-colors',
        dense ? 'py-2 px-3' : 'py-3 px-4',
        (onClick || href) && 'cursor-pointer hover:bg-neutral-50',
        unread && 'bg-brand-50/30',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p
              className={cn(
                'text-sm text-neutral-900 truncate',
                unread ? 'font-semibold' : 'font-medium',
              )}
            >
              {title}
            </p>
            {badge && <span className="shrink-0">{badge}</span>}
            {unread && (
              <span className="h-2 w-2 rounded-full bg-brand-600 shrink-0" />
            )}
          </div>
          {subtitle && (
            <div className="text-xs text-neutral-500 truncate mt-0.5">
              {subtitle}
            </div>
          )}
          {meta && (
            <div className="text-xs text-neutral-500 mt-0.5">
              {meta}
            </div>
          )}
        </div>
      </div>
      {rightContent && (
        <div
          className="shrink-0 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {rightContent}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
};
