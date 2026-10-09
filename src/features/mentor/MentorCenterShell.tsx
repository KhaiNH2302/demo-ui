import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { MentoringRequest } from '@/types/entities';

export const MentorCenterShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: requests } = useQuery({ queryKey: ['mentor', 'requests'], queryFn: () => apiClient.get<MentoringRequest[]>('/mentor/requests') });
  const pending = (requests || []).filter((request) => request.status === 'PENDING_MENTOR_RESPONSE').length;
  const current = location.pathname.includes('/posts') ? 'posts' : location.pathname.includes('/profile') ? 'profile' : 'requests';
  return (
    <div className="-mx-4 -mt-6 space-y-0 sm:-mx-6 md:-mx-8">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-surface px-4 py-3 sm:px-6 md:px-8"><div className="flex items-center gap-3"><button type="button" aria-label="Quay lại" onClick={() => navigate('/mentoring')} className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50"><ArrowLeft className="h-4 w-4" /></button><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="Lê Thị Bình" className="h-8 w-8 rounded-full object-cover" /><span className="text-sm font-semibold text-neutral-900">Mentor Center</span></div><label className="flex items-center gap-2 text-xs text-neutral-600">Đang nhận yêu cầu <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" /></label></div>
      <div className="border-b border-neutral-200 bg-app px-4 pt-4 sm:px-6 md:px-8"><div className="flex w-fit gap-1 rounded-xl bg-neutral-100 p-1 text-xs"><button type="button" onClick={() => navigate('/mentor/profile')} className={current === 'profile' ? 'rounded-lg bg-white px-4 py-2 font-semibold text-neutral-800 shadow-xs' : 'px-4 py-2 text-neutral-500'}>Hồ sơ Mentor</button><button type="button" onClick={() => navigate('/mentor/posts')} className={current === 'posts' ? 'rounded-lg bg-white px-4 py-2 font-semibold text-neutral-800 shadow-xs' : 'px-4 py-2 text-neutral-500'}>Bài đăng</button><button type="button" onClick={() => navigate('/mentor/requests')} className={current === 'requests' ? 'rounded-lg bg-white px-4 py-2 font-semibold text-neutral-800 shadow-xs' : 'px-4 py-2 text-neutral-500'}>Yêu cầu ({pending || 1})</button></div></div>
      <div className="px-4 pb-8 pt-6 sm:px-6 md:px-8"><Outlet /></div>
    </div>
  );
};
export default MentorCenterShell;
