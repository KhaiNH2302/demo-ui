import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from './StatusBadge';
import { ClubSaveButton } from '@/features/clubs/ClubRecruitmentActions';
import {
  formatClubDate,
  isRecruitment,
  isRecruitmentOpen,
} from '@/features/clubs/recruitment';
import type { ClubOpportunity } from '@/types/entities';
import type { OpportunityResponseStatus } from '@/types/status';

export const OPPORTUNITY_TYPE_LABELS: Record<ClubOpportunity['type'], string> =
  {
    Event: 'Sự kiện CLB',
    MemberRecruitment: 'Tuyển thành viên',
    CollaboratorRecruitment: 'Tuyển cộng tác viên',
  };
export interface OpportunityCardProps {
  opportunity: ClubOpportunity;
  myResponseStatus?: OpportunityResponseStatus;
  myResponseId?: string;
}
export function OpportunityCard({
  opportunity: item,
  myResponseStatus,
  myResponseId,
}: OpportunityCardProps) {
  const open = isRecruitmentOpen(item);
  const href = `/clubs/opportunities/${item.id}`;
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Link
            to={`/clubs/${item.clubId}`}
            className="flex min-w-0 flex-1 items-center gap-2 text-sm text-neutral-600 hover:text-brand-700"
          >
            {item.clubLogo && (
              <img
                alt=""
                src={item.clubLogo}
                className="h-8 w-8 rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <span className="truncate">{item.clubName}</span>
          </Link>
          <Badge
            variant={item.type === 'MemberRecruitment' ? 'brand' : 'neutral'}
          >
            {item.type === 'MemberRecruitment'
              ? 'Thành viên'
              : item.type === 'CollaboratorRecruitment'
                ? 'CTV'
                : 'Sự kiện'}
          </Badge>
        </div>
        <h2 className="text-base font-semibold leading-snug text-neutral-900">
          <Link to={href} className="hover:text-brand-700">
            {item.title}
          </Link>
        </h2>
        <p className="line-clamp-2 text-sm text-neutral-600">{item.summary}</p>
        <div className="space-y-2 text-xs text-neutral-600">
          <p className="flex items-start gap-2">
            <Clock size={15} className="mt-0.5 shrink-0" />
            <span>
              {item.expectedCommitment ||
                'Xem thời gian tham gia trong chi tiết'}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Users size={15} />
            {Math.max(0, item.quota - item.used)} chỉ tiêu còn lại · {item.used}{' '}
            đã được nhận
          </p>
          <p>
            Hạn nhận đơn:{' '}
            <strong className="font-medium text-neutral-800">
              {formatClubDate(item.registrationDeadline)}
            </strong>
          </p>
          {item.resultDeadline && (
            <p>Dự kiến trả kết quả: {formatClubDate(item.resultDeadline)}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
            >
              {tag}
            </span>
          ))}
        </div>
        {myResponseStatus ? (
          <StatusBadge group="opportunityResponse" status={myResponseStatus} />
        ) : (
          <p
            className={`text-xs font-medium ${open ? 'text-brand-700' : 'text-neutral-600'}`}
          >
            {open
              ? 'Đang nhận hồ sơ · CLB xét duyệt từng đơn'
              : 'Đợt tuyển hiện không nhận thêm hồ sơ'}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 p-4">
        {isRecruitment(item) && <ClubSaveButton opportunityId={item.id} />}
        <Link to={myResponseId ? `/clubs/registrations/${myResponseId}` : href}>
          <Button
            size="sm"
            variant={open || myResponseId ? 'primary' : 'secondary'}
            rightIcon={<ArrowRight size={14} />}
          >
            {myResponseId ? 'Xem đơn' : 'Xem đợt tuyển'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
