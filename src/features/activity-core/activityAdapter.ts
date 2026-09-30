import type { FormQuestion, MediaImageItem } from '@/types/entities';

export interface ActivitySummaryItem {
  id: string;
  kind: 'club-opportunity' | 'program';
  href: string;
  title: string;
  typeLabel: string;
  typeBadgeVariant: 'brand' | 'info' | 'good' | 'warning' | 'neutral';
  organizerName: string;
  organizerLogo?: string;
  coverImageUrl?: string | null;
  gallery?: MediaImageItem[];
  startAt?: string | null;
  endAt?: string | null;
  deadlineAt: string;
  locationOrMode?: string;
  registeredCount: number;
  capacity: number;
  benefitBadge?: string | null;
  status: string;
}

export interface ActivityAdapter<TEntity> {
  kind: 'club-opportunity' | 'program';
  basePath: '/clubs' | '/programs';
  endpoints: {
    list: string;
    detail: (id: string) => string;
    create: string;
    update: (id: string) => string;
    apply: (id: string) => string;
    responses: (id: string) => string;
    reviewResponse: (id: string, respId: string) => string;
    coParticipants: (id: string) => string;
  };
  toSummary: (item: TEntity) => ActivitySummaryItem;
  getQuestions: (item: TEntity) => FormQuestion[];
}
