import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SuggestionCardProps {
  id: string;
  type: 'group' | 'mentor' | 'club';
  title: string;
  subtitle: string;
  avatarUrl?: string;
  coverUrl?: string;
  reason: string;
  linkTo: string;
  tags?: string[];
  onDismiss?: (id: string) => void;
  onClick?: () => void;
  className?: string;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  id,
  type,
  title,
  subtitle,
  avatarUrl,
  coverUrl,
  reason,
  linkTo,
  tags = [],
  onDismiss,
  onClick,
  className,
}) => {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-neutral-200 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between p-4 group',
        className
      )}
      onClick={onClick}
    >
      {/* Dismiss button 'X' */}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(id);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors z-10"
          aria-label="Không quan tâm"
          title="Không quan tâm"
        >
          <X size={14} />
        </button>
      )}

      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start gap-3">
          <Avatar
            src={avatarUrl}
            name={title}
            size="lg"
            className="shrink-0 ring-1 ring-neutral-200"
          />
          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge tier="brand" size="sm" className="text-[10px]">
                {type === 'group' && 'Nhóm gợi ý'}
                {type === 'mentor' && 'Mentor'}
                {type === 'club' && 'CLB phù hợp'}
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-neutral-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
              {title}
            </h4>
            <p className="text-xs text-neutral-500 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        {/* Written Reasoning with Sparkles */}
        <div className="bg-accent-50/70 border border-accent-200/60 rounded-lg p-2.5 flex items-start gap-2 text-xs text-neutral-800">
          <Sparkles size={14} className="text-accent-600 shrink-0 mt-0.5" />
          <span className="leading-snug text-neutral-700">{reason}</span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="pt-4 mt-auto border-t border-neutral-100 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          rightIcon={<ArrowRight size={13} />}
          className="w-full justify-center"
        >
          {type === 'group' ? 'Xem nhóm' : type === 'mentor' ? 'Xem Mentor' : 'Xem chi tiết'}
        </Button>
      </div>
    </Card>
  );
};
