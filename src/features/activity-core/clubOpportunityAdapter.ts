import type { ClubOpportunity } from '@/types/entities';
import type { ActivityAdapter } from './activityAdapter';
import { OPPORTUNITY_TYPE_LABELS } from '@/components/shared/OpportunityCard';

export const clubOpportunityAdapter: ActivityAdapter<ClubOpportunity> = {
  kind: 'club-opportunity',
  basePath: '/clubs',
  endpoints: {
    list: '/opportunities',
    detail: (id) => `/opportunities/${id}`,
    create: '/opportunities',
    update: (id) => `/opportunities/${id}`,
    apply: (id) => `/opportunities/${id}/responses`,
    responses: (id) => `/opportunities/${id}/responses`,
    reviewResponse: (id, respId) => `/opportunities/${id}/responses/${respId}`,
    coParticipants: (id) => `/opportunities/${id}/co-participants`,
  },
  toSummary: (item) => ({
    id: item.id,
    kind: 'club-opportunity',
    href: `/opportunities/${item.id}`,
    title: item.title,
    typeLabel: OPPORTUNITY_TYPE_LABELS[item.type],
    typeBadgeVariant: item.type === 'Event' ? 'brand' : 'info',
    organizerName: item.clubName,
    organizerLogo: item.clubLogo,
    coverImageUrl: item.coverImageUrl || item.coverUrl || null,
    gallery: item.gallery,
    startAt: item.type === 'Event' ? item.startAt : null,
    endAt: item.endAt,
    deadlineAt: item.registrationDeadline,
    locationOrMode: [item.mode, item.locationOrLink || item.expectedCommitment]
      .filter(Boolean)
      .join(' · '),
    registeredCount: item.used,
    capacity: item.quota,
    benefitBadge: null,
    status: item.status,
  }),
  getQuestions: (item) => item.questions || [],
};
