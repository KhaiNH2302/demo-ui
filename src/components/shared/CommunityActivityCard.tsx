import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/format';
import { Calendar, UsersRound, Building2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CommunityActivityItem {
  id: string;
  sourceType: 'club' | 'group';
  sourceId: string;
  sourceName: string;
  sourceLogoUrl?: string;
  activityType: 'event' | 'recruitment' | 'milestone' | 'announcement';
  title: string;
  summary?: string;
  timestamp: string;
  eventDetails?: {
    date: string;
    location: string;
    rsvpCount?: number;
  };
  linkTo: string;
}

export interface CommunityActivityCardProps {
  activity: CommunityActivityItem;
  className?: string;
}

export const CommunityActivityCard: React.FC<CommunityActivityCardProps> = ({
  activity,
  className,
}) => {
  const navigate = useNavigate();

  const isClub = activity.sourceType === 'club';

  return (
    <div
      className={cn(
        'flex gap-3.5 py-4 border-b border-neutral-100 hover:bg-neutral-50/60 -mx-3 px-3 rounded-lg transition-colors cursor-pointer',
        className
      )}
      onClick={() => navigate(activity.linkTo)}
    >
      {/* Avatar column */}
      <div className="shrink-0 pt-0.5">
        <Avatar
          src={activity.sourceLogoUrl}
          name={activity.sourceName}
          size="md"
          className="ring-1 ring-neutral-200"
        />
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Source info & relative time */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-neutral-900 truncate">{activity.sourceName}</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">
              {activity.activityType === 'event' && 'đã đăng một sự kiện mới'}
              {activity.activityType === 'recruitment' && 'đã mở đợt tuyển thành viên'}
              {activity.activityType === 'milestone' && 'đạt cột mốc mới'}
              {activity.activityType === 'announcement' && 'đã đăng thông báo'}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 shrink-0">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>

        {/* Inner Card Preview Box */}
        <div className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-300 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-neutral-900 leading-snug">
              {activity.title}
            </h4>
            <Badge tier="brand" size="sm">
              {isClub ? 'CLB' : 'Nhóm'}
            </Badge>
          </div>

          {activity.summary && (
            <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
              {activity.summary}
            </p>
          )}

          {activity.eventDetails && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-neutral-500 border-t border-neutral-200/60 mt-2">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-brand-600" />
                {activity.eventDetails.date}
              </span>
              <span className="text-neutral-400">·</span>
              <span>{activity.eventDetails.location}</span>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              navigate(activity.linkTo);
            }}
            rightIcon={<ArrowRight size={13} />}
          >
            Xem chi tiết
          </Button>
        </div>
      </div>
    </div>
  );
};
