import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { PublicFooter } from '@/components/shared/PublicFooter';

export const AuthLayout: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between text-neutral-900">
      {/* Top minimal header */}
      <header className="h-14 border-b border-neutral-200 bg-surface px-4 md:px-8 flex items-center justify-between">
        <Link to="/welcome" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
          <span className="font-bold text-base text-neutral-900 tracking-tight">
            SCS
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title={resolvedTheme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} />
            )}
          </button>
          <Link
            to="/welcome"
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Về trang giới thiệu
          </Link>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* 1-line Footer */}
      <PublicFooter />
    </div>
  );
};

export default AuthLayout;
