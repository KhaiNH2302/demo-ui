import React from 'react';
import { Outlet, useParams, NavLink, Link } from 'react-router-dom';
import {
  LayoutGrid,
  CalendarDays,
  ListChecks,
  MessageCircle,
  Users,
  UserPlus,
  Wallet,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { seedClubs } from '@/mocks/data/clubs';
import { cn } from '@/lib/cn';

export const ClubWorkspaceShell: React.FC = () => {
  const { clubId = 'club_01' } = useParams<{ clubId: string }>();
  const clubRole = useAuthStore((state) => state.clubRole);
  const myRole = clubRole(clubId) || 'manager'; // Default fallback for seed manager demo

  const club = seedClubs.find((c) => c.id === clubId) || seedClubs[0];

  const menuItems = [
    { key: 'overview', label: 'Tổng quan', href: 'overview', icon: LayoutGrid, show: () => true },
    { key: 'events', label: 'Sự kiện', href: 'events', icon: CalendarDays, show: () => true },
    { key: 'tasks', label: 'Nhiệm vụ', href: 'tasks', icon: ListChecks, show: () => true },
    { key: 'chat', label: 'Chat CLB', href: 'chat', icon: MessageCircle, show: () => true },
    { key: 'members', label: 'Thành viên', href: 'members', icon: Users, show: () => true },
    { key: 'recruitments', label: 'Tuyển thành viên', href: 'recruitments', icon: UserPlus, show: (role: string) => role === 'manager' },
    { key: 'finance', label: 'Quỹ CLB', href: 'finance', icon: Wallet, show: (role: string) => role === 'manager' || role === 'treasurer' },
    { key: 'settings', label: 'Cài đặt', href: 'settings', icon: Settings, show: (role: string) => role === 'manager' },
  ];

  const roleLabelMap: Record<string, string> = {
    manager: 'Ban Quản Lý (Manager)',
    treasurer: 'Thủ Quỹ (Treasurer)',
    member: 'Thành Viên (Member)',
    lead: 'Trưởng ban (Lead)',
    vice: 'Phó ban (Vice)',
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/clubs/${clubId}`}
              className="p-2 -ml-2 text-neutral-400 hover:text-neutral-700 transition-colors"
              title="Về trang giới thiệu CLB"
            >
              <ArrowLeft size={20} />
            </Link>
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="h-14 w-14 rounded-xl object-cover border border-neutral-100 shadow-xs"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
                {club.name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-section-title text-neutral-900">{club.name}</h2>
                <Badge tier="brand" size="sm">
                  {roleLabelMap[myRole]}
                </Badge>
              </div>
              <p className="text-meta text-neutral-500 mt-0.5">{club.field} — Không gian làm việc nội bộ CLB</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 border-t border-neutral-100 mt-6 pt-2 overflow-x-auto">
          {menuItems
            .filter((item) => item.show(myRole))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  to={`/clubs/${clubId}/workspace/${item.href}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    )
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </div>
      </div>

      {/* Nested View */}
      <Outlet />
    </div>
  );
};
