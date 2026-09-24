import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Repeat2,
  BookOpen,
  UsersRound,
  Building2,
  Sparkles,
  Award,
  MessageCircle,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasRole = useAuthStore((state) => state.hasRole);
  const navigate = useNavigate();

  const isMentor = hasRole('mentor');
  const isAdmin = hasRole('system_admin') || hasRole('school_admin');

  const navItems = [
    { to: '/', label: 'Trang chủ', icon: LayoutDashboard, end: true },
    { to: '/swap', label: 'Đổi lớp', icon: Repeat2 },
    { to: '/knowledge', label: 'Kiến thức', icon: BookOpen },
    { to: '/groups', label: 'Tìm nhóm', icon: UsersRound },
    { to: '/clubs', label: 'Câu lạc bộ', icon: Building2 },
    { to: '/mentoring', label: 'Mentoring', icon: Sparkles },
    ...(isMentor ? [{ to: '/mentor/profile', label: 'Mentor Center', icon: Award }] : []),
    { to: '/chats', label: 'Tin nhắn', icon: MessageCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-neutral-600"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </IconButton>

          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-neutral-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-xs">
              <GraduationCap size={20} />
            </div>
            <span className="tracking-tight">SCS</span>
          </Link>
        </div>

        {/* Right action area */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/chats"
            className="p-2 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors"
            title="Tin nhắn"
          >
            <MessageCircle size={20} />
          </Link>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 pl-2 cursor-pointer outline-none rounded-full"
              >
                <Avatar src={user?.avatarUrl} name={user?.fullName} size="md" />
                <span className="text-xs font-semibold text-neutral-800 hidden sm:inline max-w-[120px] truncate">
                  {user?.fullName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>{user?.fullName}</div>
                <div className="text-[11px] text-neutral-400 font-normal truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile/me')}>
                <UserIcon size={14} /> Hồ sơ & Tiêu chí
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="text-brand-600 font-semibold">
                  <Shield size={14} /> Admin Portal
                </DropdownMenuItem>
              )}
              {import.meta.env.DEV && (
                <DropdownMenuItem onClick={() => navigate('/dev/components')}>
                  <Sparkles size={14} /> Kitchen Sink (UI Test)
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem danger onClick={handleLogout}>
                <LogOut size={14} /> Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-neutral-200 bg-white p-4 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3.5 py-2.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    )
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {isAdmin && (
            <div className="mt-auto pt-4 border-t border-neutral-100">
              <Link
                to="/admin"
                className="flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Shield size={18} />
                <span>Trang Quản Trị</span>
              </Link>
            </div>
          )}
        </aside>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-neutral-900/40" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 max-w-xs bg-white p-4 flex flex-col shadow-xl z-50">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-2">
                <span className="font-bold text-sm text-neutral-900">Danh mục chính</span>
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Đóng"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={18} />
                </IconButton>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3.5 py-2.5 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-semibold'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        )
                      }
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
