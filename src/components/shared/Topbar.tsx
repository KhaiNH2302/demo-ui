import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, LogOut, User, GraduationCap, ShieldCheck, Flag, Sparkles } from 'lucide-react';
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
              placeholder="Tìm bạn học, môn học, nhóm, CLB hoặc Mentor..."
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
            <Plus size={16} strokeWidth={2.5} />
            <span>Tạo mới</span>
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 cursor-pointer">
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

              <DropdownMenuItem onClick={() => navigate('/profile/me')} className="cursor-pointer">
                <User size={15} className="mr-2 text-neutral-500" />
                <span>Hồ sơ & Tiêu chí matching</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/applications')} className="cursor-pointer">
                <Flag size={15} className="mr-2 text-neutral-500" />
                <span>Đơn ứng tuyển CLB</span>
              </DropdownMenuItem>

              {isMentor && (
                <DropdownMenuItem onClick={() => navigate('/mentor/profile')} className="cursor-pointer">
                  <GraduationCap size={15} className="mr-2 text-purple-600" />
                  <span>Mentor Center</span>
                </DropdownMenuItem>
              )}

              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                  <ShieldCheck size={15} className="mr-2 text-rose-600" />
                  <span>Quản trị viên (Admin Portal)</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-rose-600 hover:bg-rose-50 cursor-pointer focus:text-rose-600"
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
