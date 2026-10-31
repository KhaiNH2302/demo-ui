import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  NAV_SECTIONS,
  FOOTER_NAV_ITEMS,
  getActiveNavKey,
  type NavItemConfig,
} from '@/lib/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { NavCounters } from '@/types/entities';
import { cn } from '@/lib/cn';
import { getGuestAccess } from '@/lib/access';

export interface AppSidebarProps {
  variant?: 'expanded' | 'collapsed' | 'sheet';
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  variant = 'expanded',
  onNavigate,
  onToggleCollapse,
  className,
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const isCollapsed = variant === 'collapsed';
  const isSheet = variant === 'sheet';

  const activeKey = getActiveNavKey(location.pathname);

  const { data: counters } = useQuery<NavCounters>({
    queryKey: ['nav', 'counters'],
    queryFn: () => apiClient.get('/nav/counters'),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const isMentor = user?.roles?.some((r) => r.toLowerCase() === 'mentor');

  /**
   * 05-social-patterns.md #2:
   * - Chỉ giữ số đếm đỏ ở Tin nhắn và Thông báo (badgeType === 'count')
   * - Mọi mục module khác chỉ hiển thị chấm nhỏ 8px (h-2 w-2 rounded-full bg-tier-danger-dot)
   */
  const renderBadge = (item: NavItemConfig) => {
    if (!item.badge || !counters) return null;
    const badgeValue = item.badge(counters);
    if (!badgeValue) return null;

    if (item.badgeType !== 'count' || badgeValue === true) {
      return (
        <span
          className={cn(
            'h-2 w-2 rounded-full bg-tier-danger-dot shrink-0',
            isCollapsed && 'absolute top-2 right-2 ring-2 ring-surface',
          )}
        />
      );
    }

    const count = Number(badgeValue);
    if (count <= 0) return null;

    return (
      <span
        className={cn(
          'flex h-5 min-w-5 items-center justify-center rounded-full bg-tier-danger-dot text-white px-1.5 text-[11px] font-semibold shrink-0 tabular-nums',
          isCollapsed && 'absolute top-1 right-1 ring-2 ring-surface h-4 min-w-4 px-1',
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  const renderItem = (rawItem: NavItemConfig) => {
    const item = isMentor && rawItem.mentorVariant ? { ...rawItem, ...rawItem.mentorVariant } : rawItem;
    if (item.requiresRole === 'mentor' && !isMentor) {
      return null;
    }

    const isActive = activeKey === item.key;
    const Icon = item.icon;
    const lockedForGuest = !user && getGuestAccess(item.href) === 'member';

    // 05-social-patterns.md #3: Mục đang chọn chỉ dùng bg-neutral-100 text-neutral-900 font-semibold, bỏ vạch dọc màu
    const content = (
      <NavLink
        to={item.href}
        onClick={onNavigate}
        className={({ isActive: exactActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-lg transition-colors select-none',
            isCollapsed ? 'justify-center p-2.5 my-0.5' : 'px-3 py-2 my-0.5',
            isActive || exactActive
              ? 'bg-neutral-100 text-neutral-900 font-semibold'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium',
          )
        }
      >
        <Icon
          size={isCollapsed ? 20 : 18}
          className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-800',
          )}
        />

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-sm">{item.label}</span>
            {lockedForGuest ? (
              <Lock size={12} className="text-neutral-400 shrink-0" aria-label="Cần đăng nhập" />
            ) : (
              renderBadge(item)
            )}
          </>
        )}

        {isCollapsed && renderBadge(item)}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider key={item.key} delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2 font-medium">
              <span>{item.label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={item.key}>{content}</div>;
  };

  const renderJoinCard = () => {
    if (isCollapsed) return null;
    return (
      <div className="mx-2 my-3 p-3 rounded-lg border border-brand-200 bg-brand-50/50 space-y-2">
        <p className="text-caption font-semibold text-neutral-900">Bạn đang xem với tư cách khách</p>
        <p className="text-caption text-neutral-600 leading-snug">
          Đăng nhập để đăng bài, tham gia nhóm, nhắn tin và theo dõi CLB.
        </p>
        <div className="flex items-center gap-3 text-caption font-semibold pt-0.5">
          <Link to="/login" onClick={onNavigate} className="text-brand-600 hover:underline">
            Đăng nhập
          </Link>
          <Link to="/register" onClick={onNavigate} className="text-neutral-600 hover:text-neutral-900">
            Tạo tài khoản
          </Link>
        </div>
      </div>
    );
  };

  const renderBecomeMentorCard = () => {
    if (!user) return renderJoinCard();
    if (isMentor) return null;

    const status = counters?.mentorApplicationStatus;

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/mentor/apply"
                onClick={onNavigate}
                className="flex items-center justify-center p-2.5 my-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                <GraduationCap size={20} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Đăng ký làm Mentor</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (status === 'Submitted' || status === 'UnderReview') {
      return (
        <Link
          to="/mentor/apply/review"
          onClick={onNavigate}
          className="block mx-2 my-3 p-3 rounded-lg border border-tier-pending-border bg-tier-pending-bg/50 hover:bg-tier-pending-bg transition-colors"
        >
          <div className="flex items-center gap-2 text-caption font-semibold text-tier-pending-text">
            <Clock size={14} />
            <span>Hồ sơ Mentor đang xét duyệt</span>
          </div>
          <p className="text-caption text-neutral-600 mt-1">
            Xem tiến độ xét duyệt hồ sơ của bạn
          </p>
        </Link>
      );
    }

    if (status === 'NeedsMoreInfo') {
      return (
        <Link
          to="/mentor/apply/review"
          onClick={onNavigate}
          className="block mx-2 my-3 p-3 rounded-lg border border-tier-attention-border bg-tier-attention-bg/60 hover:bg-tier-attention-bg transition-colors"
        >
          <div className="flex items-center gap-2 text-caption font-semibold text-tier-attention-text">
            <AlertCircle size={14} />
            <span>Hồ sơ Mentor cần bổ sung</span>
          </div>
          <p className="text-caption text-neutral-600 mt-1">
            Cập nhật thông tin theo phản hồi của Admin
          </p>
        </Link>
      );
    }

    if (status === 'Approved') {
      return (
        <Link
          to="/mentor/profile"
          onClick={onNavigate}
          className="block mx-2 my-3 p-3 rounded-lg border border-tier-success-border bg-tier-success-bg/60"
        >
          <div className="flex items-center gap-2 text-caption font-semibold text-tier-success-text">
            <CheckCircle2 size={14} />
            <span>Đã duyệt làm Mentor</span>
          </div>
        </Link>
      );
    }

    return (
      <Link
        to="/mentor/apply"
        onClick={onNavigate}
        className="group block mx-2 my-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50 hover:border-neutral-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-surface border border-neutral-200 text-neutral-700">
              <GraduationCap size={15} />
            </div>
            <span className="text-caption font-semibold text-neutral-900">
              Đăng ký làm Mentor
            </span>
          </div>
          <ArrowRight
            size={14}
            className="text-neutral-400 group-hover:text-neutral-700 transition-colors"
          />
        </div>
        <p className="text-caption text-neutral-500 mt-1.5 leading-snug">
          Hỗ trợ khóa dưới học tập và xây dựng hồ sơ học thuật.
        </p>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-surface border-r border-neutral-200 transition-all duration-200',
        isSheet
          ? 'w-full h-full border-r-0'
          : isCollapsed
            ? 'w-16 sticky top-14 h-[calc(100vh-3.5rem)]'
            : 'w-[232px] sticky top-14 h-[calc(100vh-3.5rem)]',
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {user?.roles.includes('event_manager') && renderItem({key:'admin-programs',label:'Quản lý hoạt động',href:'/admin/programs',to:'/admin/programs',icon:LayoutDashboard})}
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx}>
            {section.title && !isCollapsed && (
              <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {section.title}
              </div>
            )}
            {section.title && isCollapsed && idx > 0 && (
              <div className="my-2 mx-2 border-t border-neutral-200" />
            )}
            <div className="space-y-0.5">{section.items.map(renderItem)}</div>
          </div>
        ))}

        {renderBecomeMentorCard()}
      </div>

      <div className="border-t border-neutral-200 px-3 py-2.5 bg-neutral-50/40">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-caption font-medium text-neutral-500">
            <div className="flex items-center gap-3">
              {FOOTER_NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={onNavigate}
                  className="hover:text-neutral-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {!isSheet && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Thu gọn thanh điều hướng"
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <ChevronsLeft size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {FOOTER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <TooltipProvider key={item.key} delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        onClick={onNavigate}
                        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                      >
                        <Icon size={18} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}

            {!isSheet && onToggleCollapse && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      className="p-2 mt-1 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Mở rộng thanh điều hướng</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
