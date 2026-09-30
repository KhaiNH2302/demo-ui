import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PublicFooter } from '@/components/shared/PublicFooter';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between text-neutral-900">
      {/* Top minimal header */}
      <header className="h-14 border-b border-neutral-200 bg-white px-4 md:px-8 flex items-center justify-between">
        <Link to="/welcome" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
          <span className="font-bold text-base text-neutral-900 tracking-tight">
            SCS
          </span>
        </Link>
        <Link
          to="/welcome"
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} /> Về trang giới thiệu
        </Link>
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
