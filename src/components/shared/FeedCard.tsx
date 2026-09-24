import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Calendar, BookOpen, Users, Repeat2, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/cn';

export type FeedCardKind = 'knowledge' | 'group-suggestion' | 'event' | 'swap-match' | 'mentor-post';

export interface FeedCardProps {
  kind: FeedCardKind;
  context?: string;
  badgeText?: string;
  badgeVariant?: 'neutral' | 'pending' | 'attention' | 'success' | 'danger' | 'brand';
  header?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const kindIcons: Record<FeedCardKind, { icon: React.ComponentType<{ size?: number }>; color: string; label: string }> = {
  knowledge: { icon: BookOpen, color: 'text-amber-600 bg-amber-50', label: 'Tài liệu & Kinh nghiệm' },
  'group-suggestion': { icon: Users, color: 'text-emerald-600 bg-emerald-50', label: 'Gợi ý nhóm học tập' },
  event: { icon: Calendar, color: 'text-indigo-600 bg-indigo-50', label: 'Sự kiện CLB sắp tới' },
  'swap-match': { icon: Repeat2, color: 'text-blue-600 bg-blue-50', label: 'Khớp lịch đổi lớp mới' },
  'mentor-post': { icon: GraduationCap, color: 'text-purple-600 bg-purple-50', label: 'Bài hướng dẫn Mentoring' },
};

export const FeedCard: React.FC<FeedCardProps> = ({
  kind,
  context,
  badgeText,
  badgeVariant = 'brand',
  header,
  children,
  actions,
  onClick,
  className,
}) => {
  const meta = kindIcons[kind] || kindIcons.knowledge;
  const Icon = meta.icon;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all shadow-xs hover:border-neutral-300 hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Context Top Line */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/70 px-5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold', meta.color)}>
            <Icon size={14} />
          </div>
          <span className="font-semibold text-neutral-700">{context || meta.label}</span>
        </div>

        {badgeText && (
          <Badge variant={badgeVariant} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      <CardContent className="p-5 space-y-3.5">
        {header}
        {children}
      </CardContent>

      {actions && (
        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/40 px-5 py-3 text-xs">
          {actions}
        </div>
      )}
    </Card>
  );
};
