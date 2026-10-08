import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  CheckCircle2,
  Building2,
  HeartHandshake,
} from 'lucide-react';
import { formatDateTime } from '@/lib/format';

export interface CalendarEventItem {
  id: string;
  sourceType: 'club' | 'program';
  programType?: 'Event' | 'Volunteer' | 'Workshop';
  sourceLabel: string;
  clubId?: string;
  clubName?: string;
  clubLogo?: string;
  coverUrl?: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  mode: 'Offline' | 'Online' | 'Hybrid';
  location: string;
  capacity: number;
  registeredCount: number;
  registeredByMe: boolean;
  myStatus?: string;
  status: 'Published' | 'Finished';
  detailUrl: string;
  tags?: string[];
}

export interface EventDetailDialogProps {
  event: CalendarEventItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailDialog: React.FC<EventDetailDialogProps> = ({
  event,
  open,
  onOpenChange,
}) => {
  if (!event) return null;

  const isVolunteer = event.programType === 'Volunteer';
  const isWorkshop = event.programType === 'Workshop';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Cover banner */}
        <div className="relative h-44 sm:h-52 w-full bg-gradient-to-br from-brand-600 to-accent-600 shrink-0 overflow-hidden">
          {event.coverUrl && (
            <img
              src={event.coverUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  event.sourceType === 'club'
                    ? 'bg-brand-500/90 text-white'
                    : isVolunteer
                    ? 'bg-tier-success-dot text-white'
                    : 'bg-accent-500 text-white'
                }`}
              >
                {event.sourceLabel}
              </span>
              <span className="text-[11px] bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 rounded-full">
                {event.mode}
              </span>
              {event.registeredByMe && (
                <span className="text-[11px] bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={12} /> Đã đăng ký
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold line-clamp-2 leading-snug">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-600">
          {/* Key metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2.5">
              <Calendar size={16} className="text-brand-600 shrink-0" />
              <div>
                <span className="text-neutral-400 block text-[11px]">Bắt đầu:</span>
                <span className="font-semibold text-neutral-900">
                  {formatDateTime(event.startAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-brand-600 shrink-0" />
              <div>
                <span className="text-neutral-400 block text-[11px]">Kết thúc:</span>
                <span className="font-semibold text-neutral-900">
                  {formatDateTime(event.endAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} className="text-brand-600 shrink-0" />
              <div>
                <span className="text-neutral-400 block text-[11px]">Địa điểm:</span>
                <span className="font-semibold text-neutral-900 line-clamp-1">
                  {event.location}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Users size={16} className="text-brand-600 shrink-0" />
              <div>
                <span className="text-neutral-400 block text-[11px]">Số chỗ:</span>
                <span className="font-semibold text-neutral-900">
                  {event.registeredCount} / {event.capacity} người tham gia
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-neutral-900 mb-1.5 uppercase tracking-wider">
              Mô tả sự kiện
            </h4>
            <p className="text-xs leading-relaxed text-neutral-700 whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[11px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Link to={event.detailUrl}>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ExternalLink size={14} />}
              >
                Xem tại nguồn
              </Button>
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
