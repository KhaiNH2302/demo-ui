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
  Building2,
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
import type { NavCounters, Club } from '@/types/entities';
import { cn } from '@/lib/cn';

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

  // Counters query for badges
  const { data: counters } = useQuery<NavCounters>({
    queryKey: ['nav', 'counters'],
    queryFn: () => apiClient.get('/nav/counters'),
    refetchInterval: 30000,
  });

  // User's joined clubs for sidebar sub-items
  const { data: myClubs } = useQuery<Club[]>({
    queryKey: ['clubs', 'mine'],
    queryFn: () => apiClient.get('/clubs/mine'),
  });

  const isMentor = user?.roles?.some((r) => r.toLowerCase() === 'mentor');

  const renderBadge = (item: NavItemConfig) => {
    if (!item.badge || !counters) return null;
    const badgeValue = item.badge(counters);
    if (!badgeValue) return null;

    if (badgeValue === true) {
      // Dot badge
      return (
        <span
          className={cn(
            'h-2 w-2 rounded-full bg-accent-500 shrink-0',
            isCollapsed && 'absolute top-2 right-2 ring-2 ring-white'
          )}
        />
      );
    }

    // Number badge
    const count = Number(badgeValue);
    if (count <= 0) return null;

    return (
      <span
        className={cn(
          'flex h-5 min-w-5 items-center justify-center rounded-full bg-tier-danger-dot px-1.5 text-[11px] font-bold text-white shadow-sm shrink-0',
          isCollapsed && 'absolute top-1 right-1 ring-2 ring-white text-[10px] h-4 min-w-4 px-1'
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  const renderItem = (item: NavItemConfig) => {
    if (item.requiresRole === 'mentor' && !isMentor) {
      return null;
    }

    const isActive = activeKey === item.key;
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.href}
        onClick={onNavigate}
        className={({ isActive: exactActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-xl transition-all select-none',
            isCollapsed ? 'justify-center p-2.5 my-1' : 'px-3.5 py-2.5 my-0.5',
            isActive || exactActive
              ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
              : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900 font-medium'
          )
        }
      >
        {/* Active Left Indicator Bar */}
        {(isActive) && (
          <span
            className={cn(
              'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600',
              isCollapsed && 'hidden'
            )}
          />
        )}

        <Icon
          size={isCollapsed ? 22 : 19}
          className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-brand-600' : 'text-neutral-500 group-hover:text-neutral-800'
          )}
        />

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-sm">{item.label}</span>
            {renderBadge(item)}
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

    return (
      <div key={item.key}>
        {content}

        {/* Render Clubs sub-items when in Clubs section (expanded only) */}
        {item.key === 'clubs' && !isCollapsed && myClubs && myClubs.length > 0 && (
          <div className="pl-6 pr-1 py-1 space-y-0.5">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-3 py-1">
              CLB của tôi
            </div>
            {myClubs.slice(0, 5).map((club) => {
              const isClubActive = location.pathname.startsWith(`/clubs/${club.id}/workspace`);
              const hasNewActivity = counters?.clubsWithNewActivity?.includes(club.id);

              return (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}/workspace/overview`}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                    isClubActive
                      ? 'bg-brand-50/80 text-brand-700 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  {club.logoUrl ? (
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="h-5 w-5 rounded-full object-cover shrink-0 ring-1 ring-neutral-200"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {club.name.charAt(0)}
                    </div>
                  )}
                  <span className="truncate flex-1">{club.name}</span>
                  {hasNewActivity && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBecomeMentorCard = () => {
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
                className="flex items-center justify-center p-2.5 my-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
              >
                <GraduationCap size={20} className="text-brand-600" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              {status ? 'Hồ sơ Mentor của bạn' : 'Trở thành Mentor'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (status === 'UnderReview' || status === 'Submitted') {
      return (
        <div className="mx-2 my-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <span className="text-xs font-semibold">Hồ sơ đang xét duyệt</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-tight mb-2">
            Đang được ban quản trị xét duyệt trong 1–3 ngày.
          </p>
          <Link
            to="/mentor/apply"
            onClick={onNavigate}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            <span>Xem tiến độ</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      );
    }

    if (status === 'NeedsMoreInfo') {
      return (
        <div className="mx-2 my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">Hồ sơ cần bổ sung</span>
          </div>
          <p className="text-[11px] text-rose-700 leading-tight mb-2">
            Admin đã gửi yêu cầu bổ sung thông tin cho hồ sơ Mentor.
          </p>
          <Link
            to="/mentor/apply"
            onClick={onNavigate}
            className="text-[11px] font-semibold text-rose-800 hover:underline flex items-center gap-1"
          >
            <span>Bổ sung ngay</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      );
    }

    if (status === 'Approved') {
      return (
        <div className="mx-2 my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">Đã duyệt Mentor!</span>
          </div>
          <Link
            to="/mentor"
            onClick={onNavigate}
            className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Vào Mentor Center</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      );
    }

    return (
      <div className="mx-2 my-3 p-3.5 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-100 text-brand-900">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="h-7 w-7 rounded-lg bg-white shadow-xs text-brand-600 flex items-center justify-center shrink-0">
            <GraduationCap size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-brand-900 leading-tight">Trở thành Mentor</span>
            <span className="text-[10px] text-brand-600">Chia sẻ & Hướng dẫn</span>
          </div>
        </div>
        <p className="text-[11px] text-brand-700 leading-snug mb-2.5">
          Hỗ trợ các bạn sinh viên khóa dưới và nhận chứng nhận Mentor SCS.
        </p>
        <Link
          to="/mentor/apply"
          onClick={onNavigate}
          className="w-full py-1.5 px-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
        >
          <span>Đăng ký ngay</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-neutral-200 flex flex-col justify-between transition-all select-none overflow-y-auto overflow-x-hidden',
        isCollapsed ? 'w-[72px] px-2' : 'w-[248px] px-3',
        !isSheet && 'sticky top-16 z-20 h-[calc(100vh-4rem)] shrink-0 self-start',
        isSheet && 'w-full h-full p-3',
        className
      )}
    >
      {/* Upper Navigation Sections */}
      <div className="space-y-4 py-3">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {section.title && !isCollapsed && (
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-3 pt-2 pb-1">
                {section.title}
              </div>
            )}
            {section.items.map(renderItem)}
          </div>
        ))}

        {/* Become a Mentor card */}
        {renderBecomeMentorCard()}
      </div>

      {/* Footer Navigation items (Settings, Help, Collapse) */}
      <div className="pt-2 pb-3 border-t border-neutral-100 space-y-1">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1 text-xs text-neutral-500">
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

            {/* Collapse Toggle Button (Desktop only) */}
            {!isSheet && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Thu gọn sidebar"
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
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
                        className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
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
                      className="p-2 mt-1 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Mở rộng sidebar</TooltipContent>
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
