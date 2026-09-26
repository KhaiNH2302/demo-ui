import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  variant?: 'plain' | 'band';
  icon?: LucideIcon;
  breadcrumb?: BreadcrumbItem[];
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  variant = 'plain',
  icon: Icon,
  breadcrumb,
  breadcrumbs,
  actions,
  backHref,
  className,
}) => {
  const navigate = useNavigate();
  const activeBreadcrumbs = breadcrumb || breadcrumbs;

  if (variant === 'band') {
    return (
      <div
        className={cn(
          'bg-white border-b border-neutral-200 px-4 sm:px-6 md:px-8 py-5 -mx-4 sm:-mx-6 md:-mx-8 -mt-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4',
          className
        )}
      >
        <div className="flex items-center gap-3.5">
          {backHref && (
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Quay lại"
              onClick={() => (backHref === '-1' ? navigate(-1) : navigate(backHref))}
              className="text-neutral-500 hover:text-neutral-900 -ml-1"
            >
              <ArrowLeft size={18} />
            </IconButton>
          )}

          {Icon && (
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-brand-100">
              <Icon size={24} />
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 leading-snug">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 mb-6', className)}>
      {activeBreadcrumbs && activeBreadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
          {activeBreadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.href ? (
                <Link to={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-neutral-800 font-medium">{item.label}</span>
              )}
              {idx < activeBreadcrumbs.length - 1 && <span className="text-neutral-300">/</span>}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {backHref && (
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Quay lại"
              onClick={() => (backHref === '-1' ? navigate(-1) : navigate(backHref))}
              className="text-neutral-500 hover:text-neutral-900 -ml-1.5"
            >
              <ArrowLeft size={18} />
            </IconButton>
          )}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
            {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
