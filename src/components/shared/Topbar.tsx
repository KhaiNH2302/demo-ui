import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  LogOut,
  User,
  LayoutList,
  GraduationCap,
  ShieldCheck,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { QuickCreateSheet } from './QuickCreateSheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isMentor = user?.roles.some((r) => r.toLowerCase().includes('mentor'));
  const isAdmin = user?.roles.some((r) => r.toLowerCase().includes('admin'));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-neutral-200/80 bg-white/95 px-4 md:px-8 backdrop-blur-md transition-all shadow-2xs">
        {/* Left / Search Bar Area */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm nhóm, CLB, Mentor, bài viết…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-full border border-neutral-200 bg-neutral-100/80 pl-9.5 pr-4 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </form>
        </div>

        {/* Right Action Icons & Avatar */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Quick Create '+' Button */}
          <button
            type="button"
            onClick={() => setIsQuickCreateOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-600 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.25} />
            <span>Tạo mới</span>
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Menu tài khoản"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 cursor-pointer"
            >
              <Avatar
                src={user?.avatarUrl}
                name={user?.fullName || 'User'}
                size="md"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-bold text-neutral-900 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-neutral-500 truncate font-normal">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Group 1: Hồ sơ & Của tôi */}
              <DropdownMenuItem onClick={() => navigate('/profile/me')} className="cursor-pointer">
                <User size={15} className="mr-2 text-neutral-500" />
                <span>Hồ sơ</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/me')} className="cursor-pointer">
                <LayoutList size={15} className="mr-2 text-neutral-500" />
                <span>Của tôi</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Group 2: Role-based shortcuts */}
              {isMentor ? (
                <DropdownMenuItem onClick={() => navigate('/mentor/profile')} className="cursor-pointer">
                  <GraduationCap size={15} className="mr-2 text-neutral-500" />
                  <span>Mentor Center</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/mentor/profile')} className="cursor-pointer">
                  <GraduationCap size={15} className="mr-2 text-neutral-500" />
                  <span>Trở thành Mentor</span>
                </DropdownMenuItem>
              )}

              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                  <ShieldCheck size={15} className="mr-2 text-neutral-500" />
                  <span>Quản trị</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Group 3: Settings & Help */}
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings size={15} className="mr-2 text-neutral-500" />
                <span>Cài đặt</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer">
                <LifeBuoy size={15} className="mr-2 text-neutral-500" />
                <span>Trợ giúp</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Group 4: Logout */}
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-tier-danger-text hover:bg-tier-danger-bg cursor-pointer focus:text-tier-danger-text"
              >
                <LogOut size={15} className="mr-2" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <QuickCreateSheet open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen} />
    </>
  );
};

export default Topbar;
