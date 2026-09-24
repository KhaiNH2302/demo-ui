import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { statusMeta, type StatusGroup } from '@/lib/statusMeta';

export interface StatusBadgeProps {
  group?: StatusGroup;
  domain?: string;
  value?: string | null;
  status?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  group,
  domain,
  value,
  status,
  size = 'sm',
  className,
}) => {
  const activeValue = value || status;
  if (!activeValue) return null;

  const activeGroup = (group || domain || 'common') as StatusGroup;
  const groupMeta = (statusMeta as any)[activeGroup] as Record<string, { tier: any; label: string }> | undefined;

  let meta = groupMeta?.[activeValue];
  if (!meta) {
    // Search across all groups
    for (const g of Object.values(statusMeta)) {
      if ((g as any)[activeValue]) {
        meta = (g as any)[activeValue];
        break;
      }
    }
  }

  const finalMeta = meta || { tier: 'neutral', label: String(activeValue) };

  return (
    <Badge tier={finalMeta.tier} size={size} dot className={className}>
      {finalMeta.label}
    </Badge>
  );
};
