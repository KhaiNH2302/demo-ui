import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { ActivityImageSlider } from '@/features/programs/ActivityImageSlider';
import { ReportDialog } from './ReportDialog';
import { useGuardedAction } from '@/lib/guestGate';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ActivityCard } from '@/components/shared/ActivityCard';
import type { ProgramChannel } from '@/types/entities';
import type { ProgramRegistrationStatus } from '@/types/status';

export const PROGRAM_TYPE_LABELS: Record<ProgramChannel['type'], string> = {
  Event: 'Sự kiện CLB',
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
  const [reportOpen, setReportOpen] = useState(false);
  const guard = useGuardedAction();
  const isFull = program.confirmedCount >= program.quota;
  const isOpen = program.status === 'Published' && !isFull && Date.parse(program.registrationDeadline) > Date.now();
  const href = `/programs/${program.id}`;
  const coverUrl =
    (program as { coverImageUrl?: string; coverUrl?: string }).coverImageUrl ||
    program.coverUrl ||
    null;
  const gallery = (program as { gallery?: unknown[] }).gallery;

  const images = [...(coverUrl ? [{ id: 'cover', url: coverUrl, alt: program.title }] : []), ...(program.gallery || []).filter(img => img.url !== coverUrl)];
  return (
    <> <div className="relative"><ActivityCard
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
      mediaSlot={images.length > 1 ? <div className="relative"><ActivityImageSlider key={program.id} images={images} title={program.title} compact/><span className="pointer-events-none absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">{PROGRAM_TYPE_LABELS[program.type]}</span></div> : undefined}
      startAt={program.startAt}
      deadlineAt={program.registrationDeadline}
      locationOrMode={[program.mode, program.locationOrLink].filter(Boolean).join(' · ')}
      registeredCount={program.confirmedCount}
      capacity={program.quota}
      benefitBadge={null}
      actionSlot={
        myRegistrationStatus ? (
          <StatusBadge group="programRegistration" status={myRegistrationStatus} />
        ) : (
          <div className="flex flex-col items-start gap-2"><span className="text-xs text-neutral-500">{program.confirmMode === 'Instant' ? 'Xác nhận ngay khi còn chỗ' : 'Cần xét hồ sơ · Gửi đơn chưa giữ chỗ'}</span><Link to={href}>
            <Button
              variant={isOpen ? 'primary' : 'secondary'}
              size="sm"
            >
              {isOpen ? 'Chọn ca và đăng ký' : 'Xem chi tiết'}
            </Button>
          </Link></div>
        )
      }
    /><div className="border-t border-neutral-100 rounded-b-lg bg-surface px-4 py-2"><button type="button" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-tier-danger-text focus-visible:outline-2" aria-label={`Báo cáo hoạt động: ${program.title}`} onClick={guard('report', () => setReportOpen(true))}><Flag size={14}/>Báo cáo hoạt động</button></div></div>
    <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="program" targetId={program.id} targetTitle={program.title} targetAuthorName={program.organizer.fullName}/></>
  );
};
