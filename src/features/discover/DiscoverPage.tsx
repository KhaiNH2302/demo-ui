import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Users, Building2, GraduationCap, BookOpen } from 'lucide-react';

import GroupsFindPage from '@/features/groups/GroupsFindPage';
import ClubsListPage from '@/features/clubs/ClubsListPage';
import MentorBrowsePage from '@/features/mentoring/MentorBrowsePage';
import KnowledgeFeedPage from '@/features/knowledge/KnowledgeFeedPage';

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'groups';

  const tabs = [
    { value: 'groups', label: 'Nhóm học tập', icon: Users },
    { value: 'clubs', label: 'Câu lạc bộ & Tổ chức', icon: Building2 },
    { value: 'mentors', label: 'Mentor & Hướng dẫn', icon: GraduationCap },
    { value: 'knowledge', label: 'Tài liệu & Kiến thức', icon: BookOpen },
  ];

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khám phá Cộng đồng SCS"
        description="Tìm kiếm bạn học cùng môn, gia nhập câu lạc bộ sinh viên, kết nối Mentor và tra cứu tài liệu học tập"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Khám phá' },
        ]}
      />

      {/* Segmented Control Switcher */}
      <div className="flex items-center justify-start pb-2 overflow-x-auto">
        <SegmentedControl
          options={tabs}
          value={currentTab}
          onValueChange={handleTabChange}
          size="lg"
        />
      </div>

      {/* Embedded Sub-views */}
      <div className="pt-2">
        {currentTab === 'groups' && <GroupsFindPage />}
        {currentTab === 'clubs' && <ClubsListPage />}
        {currentTab === 'mentors' && <MentorBrowsePage />}
        {currentTab === 'knowledge' && <KnowledgeFeedPage />}
      </div>
    </div>
  );
};

export default DiscoverPage;
