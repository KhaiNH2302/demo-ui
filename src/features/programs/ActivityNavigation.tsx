import { Link, useLocation } from 'react-router-dom';
import { Compass, ClipboardList, Lightbulb, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/** Shared task navigation for the complete activity journey. */
export function ActivityNavigation() {
  const location = useLocation();
  const current = location.pathname + location.search;
  const user = useAuthStore(s => s.user);
  const manager = user?.roles.includes('event_manager');
  const student = user?.roles.some(r => r.toLowerCase() === 'student' || r === 'club_rep');
  const links = [
    { to: '/programs', label: 'Khám phá', icon: Compass },
    ...(user ? [{ to: '/programs?tab=registrations', label: 'Đăng ký của tôi', icon: ClipboardList }] : []),
    ...(student ? [{ to: '/programs/proposals', label: 'Ý tưởng của tôi', icon: Lightbulb }] : []),
    ...(user?.roles.includes('event_manager') ? [{ to: '/programs/proposals/review', label: 'Duyệt ý tưởng', icon: ShieldCheck }] : []),
    ...(manager ? [ { to: '/programs?tab=organizing', label: 'Quản lý hoạt động', icon: ClipboardList }] : []),
  ];
  return <nav aria-label="Điều hướng hoạt động" className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">{links.map(({to,label,icon: Icon}) => <Link key={to} to={to} aria-current={current === to ? 'page' : undefined} className="aria-[current=page]:bg-brand-50 aria-[current=page]:border-brand-400 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-surface px-3 py-2 text-sm font-medium text-neutral-700 hover:border-brand-400 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-500"><Icon size={16}/>{label}</Link>)}</nav>;
}
