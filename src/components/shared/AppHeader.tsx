import React, { useState, useEffect, useRef } from 'react';
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
  BadgeCheck,
  Inbox,
  Type,
  Clock,
  X,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { QuickCreateSheet } from '@/components/shared/QuickCreateSheet';
import { Button } from '@/components/ui/Button';
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

const RECENT_SEARCHES_KEY = 'scs_recent_searches';
const DEFAULT_RECENT_SEARCHES = [
  'Kinh nghiệm bảo vệ SEP490',
  'CLB Kỹ năng Mềm',
  'Tình nguyện Chủ nhật Xanh',
  'Tìm nhóm đồ án React',
];

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return DEFAULT_RECENT_SEARCHES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : DEFAULT_RECENT_SEARCHES;
  } catch {
    return DEFAULT_RECENT_SEARCHES;
  }
}

function saveRecentSearch(term: string) {
  const clean = term.trim();
  if (!clean) return;
  try {
    const current = loadRecentSearches().filter((t) => t.toLowerCase() !== clean.toLowerCase());
    const next = [clean, ...current].slice(0, 6);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export interface AppHeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [fontScale, setFontScale] = useState<FontSizeScale>(() => {
    return (localStorage.getItem('scs_font_scale') as FontSizeScale) || 'md';
  });

  const { data: counters } = useQuery<NavCounters>({
    queryKey: ['nav', 'counters'],
    queryFn: () => apiClient.get('/nav/counters'),
    refetchInterval: 30000,
    enabled: !!user,
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
    localStorage.setItem('scs_font_scale', fontScale);
  }, [fontScale]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setRecentSearches(loadRecentSearches());
    setSearchFocused(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const removeRecentSearch = (term: string) => {
    const next = recentSearches.filter((item) => item !== term);
    setRecentSearches(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // =========================================================================
  // MEMBER HEADER VARIANT (05-social-patterns.md #1 & #9) — White 56px Header
  // =========================================================================
  const isMentor = user?.roles?.some((r) => r.toLowerCase() === 'mentor');
  const isAdmin = user?.roles?.some((r) =>
    ['manager', 'admin'].includes(r.toLowerCase()),
  );
  const unreadMessagesCount =
    (counters?.unreadMessages || 0) + (counters?.pendingMessageRequests || 0);

  return (
    <header className="sticky top-0 z-30 h-14 w-full bg-surface border-b border-neutral-200 text-neutral-900 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Sidebar toggle + SCS Logo + Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Thu/mở menu"
          className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none"
        >
          <Menu size={20} />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 focus:outline-none"
        >
          <div className="h-7 w-7 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
          <span className="font-bold text-base tracking-tight text-neutral-900">
            SCS
          </span>
        </Link>

        {/* Search Box with Recent Searches & Typeahead Dropdown */}
        <div
          ref={searchBoxRef}
          className="relative flex-1 max-w-md ml-2 hidden sm:block"
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm bài viết, CLB, nhóm, sinh viên…"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-neutral-100 text-neutral-900 placeholder:text-neutral-500 text-sm border border-transparent focus:bg-surface focus:border-brand-500 focus:outline-none transition-colors"
            />
          </form>

          {searchFocused && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-neutral-200 bg-surface py-2 shadow-lg z-40">
              {searchQuery.trim().length < 2 ? (
                <div>
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Tìm kiếm gần đây
                    </span>
                  </div>
                  {recentSearches.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-neutral-500">
                      Chưa có lịch sử tìm kiếm.
                    </p>
                  ) : (
                    <ul>
                      {recentSearches.map((term) => (
                        <li
                          key={term}
                          className="flex items-center justify-between px-3 py-1.5 hover:bg-neutral-50 text-sm text-neutral-700"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              executeSearch(term);
                            }}
                            className="flex items-center gap-2.5 flex-1 text-left truncate"
                          >
                            <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate">{term}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(term);
                            }}
                            aria-label={`Xóa ${term}`}
                            className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Gợi ý nhanh
                  </div>
                  <button
                    type="button"
                    onClick={() => executeSearch(searchQuery)}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50 flex items-center justify-between"
                  >
                    <span>
                      Bài viết & Câu hỏi về <strong>"{searchQuery.trim()}"</strong>
                    </span>
                    <span className="text-xs text-neutral-400">Kiến thức</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/clubs?q=${encodeURIComponent(searchQuery.trim())}`)
                    }
                    className="w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50 flex items-center justify-between"
                  >
                    <span>
                      Câu lạc bộ & Cơ hội khớp <strong>"{searchQuery.trim()}"</strong>
                    </span>
                    <span className="text-xs text-neutral-400">CLB</span>
                  </button>
                  <div className="border-t border-neutral-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => executeSearch(searchQuery)}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-brand-600 hover:bg-brand-50/50 flex items-center justify-between"
                    >
                      <span>Xem tất cả kết quả cho "{searchQuery.trim()}"</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, Chats, Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/search')}
          aria-label="Tìm kiếm"
          className="sm:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        >
          <Search size={18} />
        </button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setQuickCreateOpen(true)}
          className="hidden md:inline-flex"
          leftIcon={<Plus size={15} />}
        >
          Tạo mới
        </Button>

        <QuickCreateSheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen} />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Đổi giao diện sáng/tối"
          className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          title={resolvedTheme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={19} className="text-amber-400" />
          ) : (
            <Moon size={19} />
          )}
        </button>

        {!user ? (
          <>
            <Link
              to="/login"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 px-2 py-1"
            >
              Đăng nhập
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Đăng ký
              </Button>
            </Link>
          </>
        ) : (
          <>
          <NotificationBell variant="light" />

          <Link
            to="/chats"
            aria-label="Tin nhắn"
            className="relative p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <MessageCircle size={19} />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[10px] font-bold text-white">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Tài khoản cá nhân"
              >
                <UserAvatar user={user} size="sm" />
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
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

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
                <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-md">
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
                          ? 'bg-surface text-brand-600 dark:text-brand-300 shadow-sm font-bold'
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
                <span>Yêu cầu của tôi</span>
              </DropdownMenuItem>

              {isMentor && (
                <DropdownMenuItem onClick={() => navigate('/mentor')} className="cursor-pointer">
                  <BadgeCheck size={16} className="mr-2 text-brand-600" />
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
          </>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
