import type { ProgramChannel } from '@/types/entities';
import type { ActivityAdapter } from './activityAdapter';
import { PROGRAM_TYPE_LABELS } from '@/components/shared/ProgramCard';

export const programAdapter: ActivityAdapter<ProgramChannel> = {
  kind: 'program',
  basePath: '/programs',
  endpoints: {
    list: '/programs',
    detail: (id) => `/programs/${id}`,
    create: '/programs',
    update: (id) => `/programs/${id}`,
    apply: (id) => `/programs/${id}/registrations`,
    responses: (id) => `/programs/${id}/registrations`,
    reviewResponse: (id, respId) => `/programs/${id}/registrations/${respId}`,
    coParticipants: (id) => `/programs/${id}/co-participants`,
  },
  toSummary: (item) => ({
    id: item.id,
    kind: 'program',
    href: `/programs/${item.id}`,
    title: item.title,
    typeLabel: PROGRAM_TYPE_LABELS[item.type],
    typeBadgeVariant: item.type === 'Volunteer' ? 'good' : 'brand',
    organizerName: `${item.organizer.fullName} (${item.organizer.major})`,
    organizerLogo: item.organizer.avatarUrl,
    coverImageUrl: item.coverImageUrl || item.coverUrl || null,
    gallery: item.gallery,
    startAt: item.startAt,
    endAt: item.endAt,
    deadlineAt: item.registrationDeadline,
    locationOrMode: [item.mode, item.locationOrLink].filter(Boolean).join(' · '),
    registeredCount: item.confirmedCount,
    capacity: item.quota,
    benefitBadge: null,
    status: item.status,
  }),
  getQuestions: (item) => item.questions || [],
};
