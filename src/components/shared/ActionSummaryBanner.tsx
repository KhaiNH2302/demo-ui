import React, { useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ActionStrip, type ActionItem } from './ActionStrip';

export interface ActionSummaryBannerProps {
  items: ActionItem[];
  className?: string;
}

/**
 * "Việc cần xử lý" bị hạ cấp chủ đích — KHÔNG mở đầu Home như 1 dải chip nổi
 * bật (đó chính là điều khiến Home giống dashboard admin). Mặc định thu gọn
 * thành 1 dòng mảnh, bấm mới xổ ActionStrip ra; 0 việc thì ẩn hẳn.
 *
 * Xem đặc tả: specs/ui/design-system/02-shared-components.md § ActionSummaryBanner
 */
export const ActionSummaryBanner: React.FC<ActionSummaryBannerProps> = ({ items, className }) => {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md bg-neutral-50 px-4 py-2.5 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        <Bell size={14} className="text-neutral-400 shrink-0" />
        <span className="flex-1">
          Bạn có <strong className="text-neutral-800">{totalCount}</strong> việc cần xử lý
        </span>
        <ChevronDown size={14} className={cn('text-neutral-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && <ActionStrip items={items} className="pl-1" showLabel={false} />}
    </div>
  );
};

export default ActionSummaryBanner;
