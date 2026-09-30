import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface SwapFeedItem {
  id: string;
  subjectCode: string;
  currentClassCode: string;
  targetClassCode: string;
  partnerName: string;
  scheduleSummary: string;
  matchNote?: string;
  href: string;
}

export interface SwapMatchRowProps {
  item: SwapFeedItem;
  className?: string;
}

export const SwapMatchRow: React.FC<SwapMatchRowProps> = ({ item, className }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-neutral-300',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tier="brand" size="sm">
            {item.subjectCode}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
            <span>{item.currentClassCode}</span>
            <ArrowRight className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span>{item.targetClassCode}</span>
          </span>
          {item.matchNote && (
            <Badge tier="success" size="sm">
              {item.matchNote}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
          <span>
            Đối tác phù hợp: <strong className="font-medium text-neutral-800">{item.partnerName}</strong>
          </span>
          <span className="text-neutral-300">·</span>
          <span className="inline-flex items-center gap-1 text-neutral-500">
            <Clock className="h-3 w-3 text-neutral-400" />
            {item.scheduleSummary}
          </span>
        </div>
      </div>

      <Link to={item.href} className="shrink-0">
        <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
          Xem đối tác
        </Button>
      </Link>
    </div>
  );
};

export const swapFeed = {
  render: (item: SwapFeedItem): React.ReactNode => <SwapMatchRow item={item} />,
};
