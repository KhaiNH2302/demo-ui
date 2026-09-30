import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  HeartHandshake,
  Images,
  MapPin,
  Sparkles,
  Users,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DateBadge } from './DateBadge';
import { formatDeadline } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface ActivityCardProps {
  id: string;
  href: string;
  title: string;
  typeBadge: {
    label: string;
    variant?: 'brand' | 'info' | 'good' | 'warning' | 'neutral';
  };
  organizer: {
    name: string;
    logoUrl?: string;
    verified?: boolean;
  };
  coverImageUrl?: string | null;
  galleryCount?: number;
  startAt?: string | null;
  deadlineAt?: string | null;
  locationOrMode?: string;
  registeredCount?: number;
  capacity?: number | null;
  benefitBadge?: string | null;
  actionSlot?: React.ReactNode;
  className?: string;
}

/**
 * Thẻ chung cho Cơ hội CLB & Chương trình Tình nguyện/Workshop
 * theo 05-social-patterns.md #5 và 04-reuse-plan.md § 2.2:
 * - Ảnh bìa 16:9 hoặc khối bg-neutral-100 + icon loại hoạt động (không gradient)
 * - Góc phải-dưới ảnh bìa hiện badge Images n nếu có gallery
 * - Có startAt -> DateBadge + tiêu đề 2 dòng + địa điểm
 * - Không có startAt (Recruitment) -> tiêu đề + dòng hạn chót
 * - Dòng cuối: 24/40 đã đăng ký + badge quyền lợi
 */
export const ActivityCard: React.FC<ActivityCardProps> = ({
  href,
  title,
  typeBadge,
  organizer,
  coverImageUrl,
  galleryCount = 0,
  startAt,
  deadlineAt,
  locationOrMode,
  registeredCount = 0,
  capacity,
  benefitBadge,
  actionSlot,
  className,
}) => {
  const deadlineInfo = formatDeadline(deadlineAt);

  return (
    <div
      className={cn(
        'group rounded-lg border border-neutral-200 bg-white overflow-hidden flex flex-col justify-between transition-colors hover:border-neutral-300',
        className,
      )}
    >
      <div>
        <Link to={href} className="block relative aspect-video bg-neutral-100 overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-1.5">
              {typeBadge.label.toLowerCase().includes('tình nguyện') ? (
                <HeartHandshake className="h-7 w-7 text-neutral-400" />
              ) : typeBadge.label.toLowerCase().includes('workshop') ? (
                <Sparkles className="h-7 w-7 text-neutral-400" />
              ) : (
                <Calendar className="h-7 w-7 text-neutral-400" />
              )}
              <span className="text-[11px] font-medium text-neutral-500">
                {organizer.name}
              </span>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5">
            <Badge
              variant={
                typeBadge.variant === 'good'
                  ? 'success'
                  : typeBadge.variant === 'warning'
                    ? 'attention'
                    : typeBadge.variant === 'info'
                      ? 'pending'
                      : typeBadge.variant || 'brand'
              }
            >
              {typeBadge.label}
            </Badge>
          </div>

          {galleryCount > 0 && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-neutral-900/75 px-2 py-0.5 text-[11px] font-medium text-white">
              <Images className="h-3 w-3" />
              <span>{galleryCount}</span>
            </div>
          )}
        </Link>

        <div className="p-4 space-y-2.5">
          <div className="flex items-start gap-3">
            {startAt && <DateBadge date={startAt} size="sm" />}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs text-neutral-500 truncate">{organizer.name}</p>
              <Link
                to={href}
                className="block text-sm font-semibold text-neutral-900 group-hover:text-brand-600 line-clamp-2 leading-snug"
              >
                {title}
              </Link>
            </div>
          </div>

          <div className="space-y-1 text-xs text-neutral-600">
            {locationOrMode && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{locationOrMode}</span>
              </div>
            )}

            {!startAt && deadlineAt && (
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  deadlineInfo.isUrgent && 'text-tier-warning-fg font-medium',
                  deadlineInfo.isExpired && 'text-neutral-400',
                )}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{deadlineInfo.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Users className="h-3.5 w-3.5 text-neutral-400" />
          <span className="tabular-nums">
            {capacity ? `${registeredCount}/${capacity} đã đăng ký` : `${registeredCount} quan tâm`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {benefitBadge && (
            <Badge variant="success" className="text-[11px]">
              {benefitBadge}
            </Badge>
          )}
          {actionSlot}
        </div>
      </div>
    </div>
  );
};
