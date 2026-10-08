import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ActivityCard } from '@/components/shared/ActivityCard';
import type { ProgramChannel } from '@/types/entities';
import type { ProgramRegistrationStatus } from '@/types/status';

export const PROGRAM_TYPE_LABELS: Record<ProgramChannel['type'], string> = {
  Event: 'Sự kiện',
  Volunteer: 'Tình nguyện',
  Workshop: 'Workshop',
};

export interface ProgramCardProps {
  program: ProgramChannel;
  myRegistrationStatus?: ProgramRegistrationStatus;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  myRegistrationStatus,
}) => {
  const isFull = program.confirmedCount >= program.quota;
  const href = `/programs/${program.id}`;
  const coverUrl =
    (program as { coverImageUrl?: string; coverUrl?: string }).coverImageUrl ||
    program.coverUrl ||
    null;
  const gallery = (program as { gallery?: unknown[] }).gallery;

  return (
    <ActivityCard
      id={program.id}
      href={href}
      title={program.title}
      typeBadge={{
        label: PROGRAM_TYPE_LABELS[program.type],
        variant: program.type === 'Volunteer' ? 'good' : 'brand',
      }}
      organizer={{
        name: `${program.organizer.fullName} (${program.organizer.major})`,
        logoUrl: program.organizer.avatarUrl,
      }}
      coverImageUrl={coverUrl}
      galleryCount={Array.isArray(gallery) ? gallery.length : 0}
      startAt={program.startAt}
      deadlineAt={program.registrationDeadline}
      locationOrMode={[program.mode, program.locationOrLink].filter(Boolean).join(' · ')}
      registeredCount={program.confirmedCount}
      capacity={program.quota}
      benefitBadge={program.costInfo === 'Free' ? 'Miễn phí' : null}
      actionSlot={
        myRegistrationStatus ? (
          <StatusBadge group="programRegistration" status={myRegistrationStatus} />
        ) : (
          <Link to={href}>
            <Button
              variant={program.status === 'Published' && !isFull ? 'primary' : 'secondary'}
              size="sm"
            >
              {program.status === 'Published' && !isFull ? 'Đăng ký' : 'Xem chi tiết'}
            </Button>
          </Link>
        )
      }
    />
  );
};
