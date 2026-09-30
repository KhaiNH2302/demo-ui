import React from 'react';
import { Link } from 'react-router-dom';
import { ActivityCard } from '@/components/shared/ActivityCard';
import { Button } from '@/components/ui/Button';

export interface ProgramFeedItem {
  id: string;
  title: string;
  organizerName: string;
  categoryLabel: string;
  coverImageUrl?: string | null;
  galleryCount?: number;
  startAt?: string | null;
  deadlineAt?: string | null;
  locationOrMode?: string;
  registeredCount?: number;
  capacity?: number | null;
  benefitBadge?: string | null;
  href: string;
}

export const programFeed = {
  render: (item: ProgramFeedItem): React.ReactNode => (
    <ActivityCard
      id={item.id}
      href={item.href}
      title={item.title}
      typeBadge={{ label: item.categoryLabel, variant: 'good' }}
      organizer={{ name: item.organizerName }}
      coverImageUrl={item.coverImageUrl}
      galleryCount={item.galleryCount}
      startAt={item.startAt}
      deadlineAt={item.deadlineAt}
      locationOrMode={item.locationOrMode}
      registeredCount={item.registeredCount}
      capacity={item.capacity}
      benefitBadge={item.benefitBadge}
      density="compact"
      actionSlot={
        <Link to={item.href}>
          <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
            Đăng ký
          </Button>
        </Link>
      }
    />
  ),
};
