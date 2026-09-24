import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-neutral-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md">
            <GraduationCap size={24} />
          </div>
          <span>SCS Portal</span>
        </Link>
        <p className="mt-2 text-xs text-neutral-500">Student Connection System — Hệ thống kết nối sinh viên</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Outlet />
      </div>

      <div className="mt-8 text-center text-xs text-neutral-400">
        © 2026 SEP490 - G72 (Student Connection System)
      </div>
    </div>
  );
};
