import React from 'react';
import { Globe, Users, Lock } from 'lucide-react';
import type { Audience } from '@/types/entities';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { AUDIENCE_CONFIG } from '../profileConstants';
import { cn } from '@/lib/cn';

interface AudienceSelectProps {
  value?: Audience;
  onChange?: (audience: Audience) => void;
  disabled?: boolean;
  size?: 'sm' | 'xs';
  showLabel?: boolean;
  className?: string;
}

export const AudienceSelect: React.FC<AudienceSelectProps> = ({
  value = 'public',
  onChange,
  disabled = false,
  size = 'xs',
  showLabel = false,
  className,
}) => {
  const current = AUDIENCE_CONFIG[value] || AUDIENCE_CONFIG.public;

  const renderIcon = (val: Audience, classNameProps = 'w-3.5 h-3.5') => {
    switch (val) {
      case 'public':
        return <Globe className={classNameProps} />;
      case 'followers':
        return <Users className={classNameProps} />;
      case 'only_me':
        return <Lock className={classNameProps} />;
      default:
        return <Globe className={classNameProps} />;
    }
  };

  if (disabled) {
    return (
      <span
        title={current.label}
        className={cn(
          'inline-flex items-center gap-1 text-neutral-400 select-none',
          size === 'xs' ? 'text-[11px]' : 'text-xs',
          className
        )}
      >
        {renderIcon(value)}
        {showLabel && <span>{current.label}</span>}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer',
            'border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
            size === 'xs' ? 'text-[11px]' : 'text-xs',
            className
          )}
          title={`Quyền riêng tư: ${current.label} — Nhấp để thay đổi`}
        >
          {renderIcon(value)}
          {showLabel && <span>{current.label}</span>}
          <span className="text-[9px] text-neutral-400">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1 z-50">
        {(Object.keys(AUDIENCE_CONFIG) as Audience[]).map((key) => {
          const cfg = AUDIENCE_CONFIG[key];
          const isSelected = key === value;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onChange?.(key)}
              className={cn(
                'flex items-start gap-2.5 p-2 rounded-md cursor-pointer text-xs',
                isSelected && 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium'
              )}
            >
              <div className="mt-0.5 text-neutral-500">{renderIcon(key)}</div>
              <div className="flex-1">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                  <span>{cfg.label}</span>
                  {isSelected && <span className="text-brand-600">✓</span>}
                </div>
                <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                  {cfg.description}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
