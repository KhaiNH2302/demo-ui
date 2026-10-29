import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ActivityCard } from '@/components/shared/ActivityCard';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import type { ClubOpportunity } from '@/types/entities';
import type { OpportunityResponseStatus } from '@/types/status';

export const OPPORTUNITY_TYPE_LABELS: Record<ClubOpportunity['type'], string> = {
  Event: 'Sự kiện CLB',
  MemberRecruitment: 'Tuyển thành viên',
  CollaboratorRecruitment: 'Tuyển cộng tác viên',
};

export interface OpportunityCardProps {
  opportunity: ClubOpportunity;
  myResponseStatus?: OpportunityResponseStatus;
  myResponseId?: string;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  myResponseStatus,
  myResponseId,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const isFull = opportunity.used >= opportunity.quota;
  const href = `/clubs/opportunities/${opportunity.id}`;
  const coverUrl =
    (opportunity as { coverImageUrl?: string; coverUrl?: string }).coverImageUrl ||
    (opportunity as { coverImageUrl?: string; coverUrl?: string }).coverUrl ||
    null;
  const gallery = (opportunity as { gallery?: unknown[] }).gallery;

  return (
    <ActivityCard
      id={opportunity.id}
      href={href}
      title={opportunity.title}
      typeBadge={{
        label: OPPORTUNITY_TYPE_LABELS[opportunity.type],
        variant: opportunity.type === 'Event' ? 'brand' : 'info',
      }}
      organizer={{
        name: opportunity.clubName,
        logoUrl: opportunity.clubLogo,
        verified: true,
      }}
      coverImageUrl={coverUrl}
      galleryCount={Array.isArray(gallery) ? gallery.length : 0}
      startAt={opportunity.type === 'Event' ? opportunity.startAt : null}
      deadlineAt={opportunity.registrationDeadline}
      locationOrMode={
        [opportunity.mode, opportunity.locationOrLink || opportunity.expectedCommitment]
          .filter(Boolean)
          .join(' · ')
      }
      registeredCount={opportunity.used}
      capacity={opportunity.quota}
      actionSlot={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const nextState = !isSaved;
              setIsSaved(nextState);
              if (nextState) {
                toast.success(`Đã lưu cơ hội "${opportunity.title}" vào danh sách theo dõi`);
              } else {
                toast.info(`Đã bỏ lưu cơ hội "${opportunity.title}"`);
              }
            }}
            className={cn('text-caption', isSaved ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-neutral-500')}
            leftIcon={<Bookmark className={cn('h-3.5 w-3.5', isSaved && 'fill-amber-500 text-amber-500')} />}
          >
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </Button>

          {myResponseStatus ? (
            <div className="flex items-center gap-2">
              <StatusBadge group="opportunityResponse" status={myResponseStatus} />
              {myResponseId && (
                <Link to={`/clubs/registrations/${myResponseId}`}>
                  <Button variant="secondary" size="sm">
                    Xem đơn
                  </Button>
                </Link>
              )}
            </div>
          ) : myResponseId ? (
            <Link to={`/clubs/registrations/${myResponseId}`}>
              <Button variant="secondary" size="sm">
                Xem đơn
              </Button>
            </Link>
          ) : (
            <Link to={href}>
              <Button
                variant={opportunity.status === 'Published' && !isFull ? 'primary' : 'secondary'}
                size="sm"
              >
                {opportunity.status === 'Published' && !isFull ? 'Xem & Đăng ký' : 'Xem chi tiết'}
              </Button>
            </Link>
          )}
        </div>
      }
    />
  );
};
