import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat2, UsersRound, FileCheck, GraduationCap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ActionItem {
  id: string;
  type: 'swap' | 'group' | 'club' | 'mentoring';
  title: string;
  count: number;
  linkTo: string;
  color?: string;
}

export interface ActionStripProps {
  items: ActionItem[];
  className?: string;
}

export const ActionStrip: React.FC<ActionStripProps> = ({ items, className }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number }>; bg: string; text: string; border: string }> = {
    swap: {
      icon: Repeat2,
      bg: 'bg-blue-50 hover:bg-blue-100/80',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    group: {
      icon: UsersRound,
      bg: 'bg-emerald-50 hover:bg-emerald-100/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    club: {
      icon: FileCheck,
      bg: 'bg-amber-50 hover:bg-amber-100/80',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    mentoring: {
      icon: GraduationCap,
      bg: 'bg-purple-50 hover:bg-purple-100/80',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Việc cần bạn xử lý
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
        {items.map((item) => {
          const config = typeConfig[item.type] || typeConfig.swap;
          const Icon = config.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.linkTo)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs',
                config.bg,
                config.text,
                config.border
              )}
            >
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/90 text-[11px] font-bold shadow-xs">
                {item.count}
              </span>
              <Icon size={15} />
              <span>{item.title}</span>
              <ChevronRight size={14} className="opacity-70" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
