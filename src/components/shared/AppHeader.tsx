import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  MessageCircle,
  User as UserIcon,
  Settings,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Inbox,
  Type,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { QuickCreateSheet } from '@/components/shared/QuickCreateSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { NavCounters } from '@/types/entities';
import type { FontSizeScale } from '@/types/status';

export interface AppHeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [fontScale, setFontScale] = useState<FontSizeScale>(() => {
    return (localStorage.getItem('scs_font_scale') as FontSizeScale) || 'md';
  });

  // Query global nav counters
  const { data: counters } = useQuery<NavCounters>({
    queryKey: ['nav', 'counters'],
    queryFn: () => apiClient.get('/nav/counters'),
    refetchInterval: 30000,
  });

  // Apply font scale to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
    localStorage.setItem('scs_font_scale', fontScale);
  }, [fontScale]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isMentor = user?.roles?.some((r) => r.toLowerCase() === 'mentor');
  const isAdmin = user?.roles?.some((r) =>
    ['system_admin', 'school_admin', 'admin'].includes(r.toLowerCase())
  );

  const unreadMessagesCount = (counters?.unreadMessages || 0) + (counters?.pendingMessageRequests || 0);

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-brand-600 text-white shadow-sm flex items-center justify-between px-4 sm:px-6">
      {/* Left: Sidebar toggle + SCS Logo */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Thu/mở menu"
          className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <Menu size={22} />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-white/40 rounded-lg p-0.5"
        >
          <div className="h-8 w-8 rounded-lg bg-white text-brand-600 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-white">SCS</span>
            <span className="hidden xl:inline text-[10px] text-white/70 leading-none font-normal">
              Student Connection
            </span>
          </div>
        </Link>
      </div>

      {/* Middle: Search Box */}
      <div className="flex-1 max-w-lg mx-4 sm:mx-8 hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Tìm bài viết, CLB, nhóm, sinh viên…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/15 text-white placeholder:text-white/70 text-sm border border-white/20 focus:bg-white focus:text-neutral-900 focus:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right: Actions, Notifications, Chats, Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={() => navigate('/search')}
          aria-label="Tìm kiếm"
          className="sm:hidden p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10"
        >
          <Search size={20} />
        </button>

        {/* Quick Create Button */}
        <button
          type="button"
          onClick={() => setQuickCreateOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white text-brand-700 hover:bg-brand-50 rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow"
        >
          <Plus size={16} className="text-brand-600" />
          <span>Tạo mới</span>
        </button>

        {/* Quick Create Sheet Dialog */}
        <QuickCreateSheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen} />

        {/* Notification Bell */}
        <NotificationBell variant="onDark" />

        {/* Direct Messages Icon Button */}
        <Link
          to="/chats"
          aria-label="Tin nhắn"
          className="relative p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
        >
          <MessageCircle size={20} />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-brand-600">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
        </Link>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 rounded-full p-0.5 ring-2 ring-white/60 hover:ring-white transition-all focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Tài khoản cá nhân"
            >
              <UserAvatar user={user} size="header" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-1.5 text-neutral-800">
            <DropdownMenuLabel className="font-normal px-2.5 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-neutral-900 leading-none">
                  {user?.fullName || 'Sinh viên'}
                </p>
                <p className="text-xs text-neutral-500 leading-none truncate">
                  {user?.email || 'student@fpt.edu.vn'}
                </p>
                {user?.roles && user.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {user.roles.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-700 capitalize"
                      >
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Quick Font Size Picker */}
            <div className="px-2.5 py-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Type size={14} />
                  <span>Cỡ chữ</span>
                </span>
                <span className="text-[11px] font-semibold text-brand-600">
                  {fontScale === 'sm' && 'Nhỏ'}
                  {fontScale === 'md' && 'Vừa (chuẩn)'}
                  {fontScale === 'lg' && 'Lớn'}
                  {fontScale === 'xl' && 'Rất lớn'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-lg">
                {(['sm', 'md', 'lg', 'xl'] as FontSizeScale[]).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFontScale(scale);
                    }}
                    className={`text-xs py-1 rounded font-medium transition-all ${
                      fontScale === scale
                        ? 'bg-white text-brand-700 shadow-sm font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {scale === 'sm' && 'A-'}
                    {scale === 'md' && 'A'}
                    {scale === 'lg' && 'A+'}
                    {scale === 'xl' && 'A++'}
                  </button>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/profile/me')} className="cursor-pointer">
              <UserIcon size={16} className="mr-2 text-neutral-500" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/requests')} className="cursor-pointer">
              <Inbox size={16} className="mr-2 text-neutral-500" />
              <span>Quản lý yêu cầu</span>
            </DropdownMenuItem>

            {isMentor && (
              <DropdownMenuItem onClick={() => navigate('/mentor')} className="cursor-pointer">
                <GraduationCap size={16} className="mr-2 text-brand-600" />
                <span className="text-brand-700 font-medium">Mentor Center</span>
              </DropdownMenuItem>
            )}

            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                <ShieldCheck size={16} className="mr-2 text-brand-600" />
                <span className="text-brand-700 font-medium">Quản trị hệ thống</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings size={16} className="mr-2 text-neutral-500" />
              <span>Cài đặt</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer">
              <LifeBuoy size={16} className="mr-2 text-neutral-500" />
              <span>Trợ giúp & FAQ</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-tier-danger-text focus:text-tier-danger-text focus:bg-tier-danger-bg"
            >
              <LogOut size={16} className="mr-2" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
