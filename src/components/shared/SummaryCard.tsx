import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { SemanticTier } from '@/types/status';

export interface SummaryCardProps {
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  label?: string;
  title?: string;
  description?: string;
  value: string | number;
  tone?: SemanticTier;
  onClick?: () => void;
  className?: string;
}

const toneStyles: Record<SemanticTier, { bg: string; text: string }> = {
  neutral: { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  pending: { bg: 'bg-[#e8effe]', text: 'text-[#2952d9]' },
  attention: { bg: 'bg-[#fef6e7]', text: 'text-[#92620a]' },
  success: { bg: 'bg-[#e7f7ee]', text: 'text-[#16794a]' },
  danger: { bg: 'bg-[#fdecec]', text: 'text-[#b3261e]' },
  brand: { bg: 'bg-brand-50', text: 'text-brand-600' },
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  icon: Icon,
  label,
  title,
  description,
  value,
  tone = 'neutral',
  onClick,
  className,
}) => {
  const styles = toneStyles[tone] || toneStyles.neutral;
  const displayLabel = title || label || '';

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) {
      const IconComp = Icon as React.ComponentType<{ size?: number; className?: string }>;
      return <IconComp size={24} />;
    }
    return null;
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-all shadow-sm',
        onClick && 'cursor-pointer hover:border-brand-300 hover:shadow-md',
        className
      )}
    >
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl shrink-0', styles.bg, styles.text)}>
          {renderIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-meta text-neutral-500 font-medium truncate">{displayLabel}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-0.5 tracking-tight">{value}</p>
          {description && <p className="text-[11px] text-neutral-400 mt-0.5">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
};
