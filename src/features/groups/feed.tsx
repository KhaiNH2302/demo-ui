import React from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/cn';

export interface GroupFeedItem {
  id: string;
  name: string;
  purpose: string;
  subjectCode?: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  neededSkills: string[];
  scheduleSummary?: string;
  href: string;
}

export interface GroupCardProps {
  group: GroupFeedItem;
  density?: 'default' | 'compact';
  className?: string;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  density = 'default',
  className,
}) => {
  const isCompact = density === 'compact';

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-surface transition-colors hover:border-neutral-300',
        isCompact ? 'p-3.5 space-y-2.5' : 'p-4 space-y-3',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tier="neutral" size="sm">
              {group.purpose}
            </Badge>
            {group.subjectCode && (
              <Badge tier="brand" size="sm">
                {group.subjectCode}
              </Badge>
            )}
          </div>
          <Link
            to={group.href}
            className="block text-sm font-semibold text-neutral-900 hover:text-brand-600 line-clamp-1"
          >
            {group.name}
          </Link>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 tabular-nums shrink-0">
          <UsersRound className="h-3.5 w-3.5 text-neutral-400" />
          {group.memberCount}/{group.maxMembers} thành viên
        </span>
      </div>

      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
        {group.description}
      </p>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {group.neededSkills.slice(0, 3).map((skill) => (
            <Chip key={skill} size="sm">
              {skill}
            </Chip>
          ))}
          {group.scheduleSummary && (
            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 ml-1">
              <Clock className="h-3 w-3 text-neutral-400" />
              {group.scheduleSummary}
            </span>
          )}
        </div>

        <Link to={group.href} className="shrink-0">
          <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
            Xin tham gia
          </Button>
        </Link>
      </div>
    </div>
  );
};

export const groupFeed = {
  render: (item: GroupFeedItem): React.ReactNode => (
    <GroupCard group={item} density="compact" />
  ),
};
