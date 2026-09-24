import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  Database,
  Sliders,
  UserCheck,
  FileText,
  ArrowLeft,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';

export const AdminShell: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasRole = useAuthStore((state) => state.hasRole);
  const navigate = useNavigate();

  const isSystemAdmin = hasRole('system_admin');

  const navItems = [
    { to: '/admin', label: 'Tổng quan (Dashboard)', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
    { to: '/admin/moderation', label: 'Kiểm duyệt nội dung', icon: CheckSquare },
    { to: '/admin/clubs', label: 'Duyệt CLB', icon: Building2 },
    { to: '/admin/master-data', label: 'Dữ liệu danh mục', icon: Database },
    { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: Sliders },
    ...(isSystemAdmin ? [{ to: '/admin/admins', label: 'Phân quyền quản trị', icon: UserCheck }] : []),
    { to: '/admin/audit-logs', label: 'Nhật ký kiểm toán (Audit)', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Topbar Admin */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-neutral-900 text-white px-4 md:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </IconButton>

          <Link to="/admin" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
              <Shield size={20} />
            </div>
            <span className="tracking-tight">SCS Admin Portal</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Về giao diện Sinh viên
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-neutral-700">
            <Avatar src={user?.avatarUrl} name={user?.fullName} size="sm" />
            <span className="text-xs font-medium text-neutral-200 hidden md:inline">{user?.fullName}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Đăng xuất"
              className="text-neutral-400 hover:text-rose-400 p-1 transition-colors ml-2"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-neutral-200 bg-white p-4 shrink-0 shadow-xs">
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
                        ? 'bg-purple-50 text-purple-700 font-semibold'
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
        </aside>

        {/* Drawer Mobile */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-neutral-900/50" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 max-w-xs bg-white p-4 flex flex-col shadow-xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                <span className="font-bold text-sm text-neutral-900">Quản trị hệ thống</span>
                <IconButton variant="ghost" size="sm" aria-label="Đóng" onClick={() => setMobileOpen(false)}>
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
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3.5 py-2.5 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-purple-50 text-purple-700 font-semibold'
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

        {/* Admin Content Area */}
        <main className="flex-1 px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
