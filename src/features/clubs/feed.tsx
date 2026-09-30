import React from 'react';
import { Link } from 'react-router-dom';
import { ActivityCard } from '@/components/shared/ActivityCard';
import { Button } from '@/components/ui/Button';

export interface ClubFeedItem {
  id: string;
  title: string;
  clubName: string;
  clubLogoUrl?: string;
  typeLabel: string;
  coverImageUrl?: string | null;
  galleryCount?: number;
  startAt?: string | null;
  deadlineAt?: string | null;
  locationOrMode?: string;
  registeredCount?: number;
  capacity?: number | null;
  href: string;
}

export const clubFeed = {
  render: (item: ClubFeedItem): React.ReactNode => (
    <ActivityCard
      id={item.id}
      href={item.href}
      title={item.title}
      typeBadge={{ label: item.typeLabel, variant: 'brand' }}
      organizer={{ name: item.clubName, logoUrl: item.clubLogoUrl, verified: true }}
      coverImageUrl={item.coverImageUrl}
      galleryCount={item.galleryCount}
      startAt={item.startAt}
      deadlineAt={item.deadlineAt}
      locationOrMode={item.locationOrMode}
      registeredCount={item.registeredCount}
      capacity={item.capacity}
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
