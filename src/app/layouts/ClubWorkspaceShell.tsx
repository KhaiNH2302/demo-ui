import React from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ContextHeader } from '@/components/shared/ContextHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { seedClubs } from '@/mocks/data/clubs';
import {
  LayoutGrid,
  CalendarDays,
  ListChecks,
  MessageCircle,
  Users,
  UserPlus,
  Wallet,
  Settings,
} from 'lucide-react';

export const ClubWorkspaceShell: React.FC = () => {
  const { clubId = 'club_01' } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const clubRole = useAuthStore((state) => state.clubRole);
  const myRole = clubRole(clubId) || 'manager';

  const club = seedClubs.find((c) => c.id === clubId) || seedClubs[0];

  const pathParts = location.pathname.split('/');
  const activeTab = pathParts[pathParts.length - 1] || 'overview';

  const allMenuItems = [
    { value: 'overview', label: 'Tổng quan', icon: LayoutGrid, show: () => true },
    { value: 'events', label: 'Sự kiện', icon: CalendarDays, show: () => true },
    { value: 'tasks', label: 'Nhiệm vụ', icon: ListChecks, show: () => true },
    { value: 'chat', label: 'Chat CLB', icon: MessageCircle, show: () => true },
    { value: 'members', label: 'Thành viên', icon: Users, show: () => true },
    {
      value: 'recruitments',
      label: 'Tuyển thành viên',
      icon: UserPlus,
      show: (role: string) => role === 'manager' || role === 'lead',
    },
    {
      value: 'finance',
      label: 'Quỹ CLB',
      icon: Wallet,
      show: (role: string) => role === 'manager' || role === 'treasurer' || role === 'lead',
    },
    {
      value: 'settings',
      label: 'Cài đặt',
      icon: Settings,
      show: (role: string) => role === 'manager' || role === 'lead',
    },
  ];

  const visibleTabs = allMenuItems.filter((item) => item.show(myRole));

  const roleLabelMap: Record<string, string> = {
    manager: 'Ban Quản Lý (Manager)',
    treasurer: 'Thủ Quỹ (Treasurer)',
    member: 'Thành Viên (Member)',
    lead: 'Trưởng ban (Lead)',
    vice: 'Phó ban (Vice)',
  };

  const handleTabChange = (val: string) => {
    navigate(`/clubs/${clubId}/workspace/${val}`);
  };

  return (
    <div className="space-y-6">
      {/* ContextHeader for nested workspace with explicit backHref */}
      <ContextHeader
        backHref={`/clubs/${clubId}`}
        title={`Workspace: ${club.name}`}
        subtitle={`${club.field} • Không gian làm việc nội bộ`}
        avatar={{
          src: club.logoUrl,
          name: club.name,
        }}
        actions={
          <Badge tier="brand" size="sm">
            {roleLabelMap[myRole] || 'Thành viên CLB'}
          </Badge>
        }
      />

      {/* SegmentedControl Workspace Sub-Menu */}
      <div className="flex items-center pb-2 overflow-x-auto">
        <SegmentedControl
          options={visibleTabs}
          value={activeTab}
          onValueChange={handleTabChange}
          size="md"
        />
      </div>

      {/* Workspace Active Tab View */}
      <div className="pt-1">
        <Outlet />
      </div>
    </div>
  );
};

export default ClubWorkspaceShell;
