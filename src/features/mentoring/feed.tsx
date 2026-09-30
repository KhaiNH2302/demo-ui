import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Users } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/cn';

export interface MentoringFeedItem {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorAvatarUrl?: string;
  mentorHeadline: string;
  title: string;
  summary: string;
  tags: string[];
  slotsRemaining?: number;
  href: string;
}

export interface MentoringPostCardProps {
  post: MentoringFeedItem;
  density?: 'default' | 'compact';
  className?: string;
}

export const MentoringPostCard: React.FC<MentoringPostCardProps> = ({
  post,
  density = 'default',
  className,
}) => {
  const isCompact = density === 'compact';

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white transition-colors hover:border-neutral-300',
        isCompact ? 'p-3.5 space-y-2.5' : 'p-4 space-y-3',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar
            user={{
              id: post.mentorId,
              fullName: post.mentorName,
              avatarUrl: post.mentorAvatarUrl,
            }}
            size="sm"
            linkToProfile
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to={`/mentoring/mentors/${post.mentorId}`}
                className="text-xs font-semibold text-neutral-900 hover:text-brand-600 truncate"
              >
                {post.mentorName}
              </Link>
              <Badge tier="brand" size="sm" className="gap-0.5 text-[10px]">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>Mentor</span>
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-500 truncate">{post.mentorHeadline}</p>
          </div>
        </div>

        {typeof post.slotsRemaining === 'number' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 tabular-nums shrink-0">
            <Users className="h-3.5 w-3.5 text-neutral-400" />
            Còn {post.slotsRemaining} chỗ
          </span>
        )}
      </div>

      <div className="space-y-1">
        <Link
          to={post.href}
          className="block text-sm font-semibold text-neutral-900 hover:text-brand-600 line-clamp-1"
        >
          {post.title}
        </Link>
        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
          {post.summary}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {post.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} size="sm">
              {tag}
            </Chip>
          ))}
        </div>

        <Link to={post.href} className="shrink-0">
          <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
            Gửi yêu cầu
          </Button>
        </Link>
      </div>
    </div>
  );
};

export const mentoringFeed = {
  render: (item: MentoringFeedItem): React.ReactNode => (
    <MentoringPostCard post={item} density="compact" />
  ),
};
