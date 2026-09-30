import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  HeartHandshake,
  UsersRound,
  GraduationCap,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export type FeedInsertKind =
  | 'opportunity'
  | 'program'
  | 'group'
  | 'mentoring_post'
  | 'swap_match';

const KIND_META: Record<
  FeedInsertKind,
  { icon: LucideIcon; defaultLabel: string; defaultHref: string }
> = {
  opportunity: {
    icon: Building2,
    defaultLabel: 'Câu lạc bộ',
    defaultHref: '/clubs',
  },
  program: {
    icon: HeartHandshake,
    defaultLabel: 'Tình nguyện & Workshop',
    defaultHref: '/programs',
  },
  group: {
    icon: UsersRound,
    defaultLabel: 'Nhóm học tập',
    defaultHref: '/groups',
  },
  mentoring_post: {
    icon: GraduationCap,
    defaultLabel: 'Mentoring',
    defaultHref: '/mentoring',
  },
  swap_match: {
    icon: ArrowLeftRight,
    defaultLabel: 'Đổi lớp',
    defaultHref: '/swap',
  },
};

export interface FeedInsertProps {
  kind: FeedInsertKind;
  /**
   * Ví dụ: "Câu lạc bộ · F-Code Club", "Tình nguyện & Workshop", "Nhóm học tập · SWP391"
   */
  contextLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FeedInsert (30/09 — thay CommunityActivityCard):
 * Khung mỏng cho nội dung module khác xen vào bảng tin Trang chủ:
 * - 1 dòng ngữ cảnh text-xs text-neutral-500 phía trên (icon module 14px + nhãn)
 * - Thẻ gốc của module (density="compact") bên dưới
 * - Không nền màu, ngăn với thread bằng đường kẻ như thread
 */
export const FeedInsert: React.FC<FeedInsertProps> = ({
  kind,
  contextLabel,
  actionHref,
  actionLabel = 'Xem thêm →',
  children,
  className,
}) => {
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'py-4 border-b border-neutral-100 space-y-2.5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Icon className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <span className="truncate font-medium text-neutral-600">
            {contextLabel || meta.defaultLabel}
          </span>
        </div>

        <Link
          to={actionHref || meta.defaultHref}
          className="text-xs font-medium text-brand-600 hover:underline shrink-0"
        >
          {actionLabel}
        </Link>
      </div>

      <div>{children}</div>
    </div>
  );
};

export default FeedInsert;
