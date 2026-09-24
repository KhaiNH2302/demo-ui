import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

export interface AIResultCardProps {
  score: number; // 0 to 100
  reasons: string[];
  confidence?: number; // 0 to 1
  children: React.ReactNode;
  className?: string;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({
  score,
  reasons,
  confidence,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-brand-200 bg-brand-50/20 p-4 relative transition-all hover:border-brand-300 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-brand-100">
        <div className="flex items-center gap-2">
          <Badge tier="brand" dot className="font-semibold text-xs">
            <Sparkles size={12} className="mr-1 text-brand-600 inline" />
            Gợi ý bởi AI
          </Badge>
          {confidence !== undefined && (
            <span className="text-[11px] text-neutral-500">
              Độ tin cậy: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        <Badge tier="success" size="sm" className="font-bold">
          {score}% phù hợp
        </Badge>
      </div>

      {reasons && reasons.length > 0 && (
        <div className="mb-3 space-y-1 bg-white/70 rounded-md p-2.5 border border-brand-100/60">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-neutral-700">
              <Sparkles size={12} className="text-brand-500 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
};
