import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  HeartHandshake,
  GraduationCap,
  Database,
  Sliders,
  UserCheck,
  FileText,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/cn';
import { PageLoading } from '@/components/shared/PageLoading';

export const AdminShell: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasRole = useAuthStore((state) => state.hasRole);
  const navigate = useNavigate();

  const isAdmin = hasRole('admin') || hasRole('Admin');
  const { resolvedTheme, toggleTheme } = useThemeStore();

  // Manager chỉ thấy module được cấp; Admin duy nhất thấy toàn bộ cổng quản trị.
  // Các phiên demo Manager được lưu từ trước khi có adminPermissions vẫn phải vào được Dashboard.
  const managerPermissions = user?.adminPermissions?.length ? user.adminPermissions : ['dashboard'];
  const navItems = [
    { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true, permission: 'dashboard' },
    { to: '/admin/users', label: 'Quản lý người dùng', icon: Users, systemOnly: true, permission: 'users' },
    { to: '/admin/moderation', label: 'Kiểm duyệt nội dung', icon: CheckSquare, permission: 'moderation' },
    { to: '/admin/clubs', label: 'Quyền đại diện CLB', icon: Building2, permission: 'clubs' },
    { to: '/admin/programs', label: 'Chương trình cộng đồng', icon: HeartHandshake, permission: 'programs' },
    { to: '/admin/mentor-applications', label: 'Duyệt Mentor', icon: GraduationCap, permission: 'mentoring' },
    { to: '/admin/master-data', label: 'Dữ liệu danh mục', icon: Database, permission: 'master_data' },
    { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: Sliders, systemOnly: true, permission: 'settings' },
    { to: '/admin/admins', label: 'Phân quyền quản trị', icon: UserCheck, systemOnly: true, permission: 'admins' },
    { to: '/admin/audit-logs', label: 'Nhật ký kiểm toán', icon: FileText, systemOnly: true, permission: 'reports' },
  ].filter((item) => isAdmin || (!item.systemOnly && managerPermissions.includes(item.permission)));
  const roleLabel = isAdmin ? 'Admin' : 'Manager';

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col antialiased">
      {/* Topbar Admin — Nền tối cố định (#0f172a) theo quy ước */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#1e293b] bg-[#0f172a] text-white px-4 md:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Menu quản trị"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </IconButton>

          <Link to="/admin" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <span className="tracking-tight">SCS Admin Portal</span>
            <span className="hidden sm:inline rounded-md bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-[11px] font-semibold text-neutral-200">
              {roleLabel}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title={resolvedTheme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors"
            title="Quay lại giao diện sinh viên"
          >
            <ArrowLeft size={14} className="text-brand-400" />
            <span className="hidden sm:inline">Về ứng dụng SCS</span>
            <span className="sm:hidden">Thoát</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <Avatar src={user?.avatarUrl} name={user?.fullName} size="sm" />
            <span className="text-xs font-medium text-neutral-200 hidden md:inline">{user?.fullName}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Đăng xuất"
              className="text-neutral-400 hover:text-tier-danger-text p-1.5 rounded-md hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-neutral-200 bg-surface p-4 shrink-0 sticky top-16 h-[calc(100vh-4rem)] self-start overflow-y-auto">
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
                      'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
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

          {/* Persistent Return to Social Surface Link */}
          <div className="pt-4 border-t border-neutral-200">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Về ứng dụng SCS</span>
            </Link>
          </div>
        </aside>

        {/* Drawer Mobile */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-neutral-900/50" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 max-w-xs bg-surface p-4 flex flex-col justify-between shadow-xl z-50">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-3">
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
                            'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
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

              <div className="pt-4 border-t border-neutral-200">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Về ứng dụng SCS</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Admin Content Area */}
        <main className="flex-1 px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
          <React.Suspense fallback={<PageLoading />}><Outlet /></React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
