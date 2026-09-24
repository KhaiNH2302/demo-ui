import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { ChatWindow } from '@/components/shared/ChatWindow';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';
import type { ClubMembership } from '@/types/entities';

export const ClubChatPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user } = useAuthStore();

  const membersQuery = useQuery({
    queryKey: queryKeys.clubs.members(clubId!),
    queryFn: () => apiClient.get<ClubMembership[]>(`/clubs/${clubId}/members`),
    enabled: !!clubId,
  });

  const membership = (membersQuery.data || []).find((m) => m.userId === user?.id);
  const isActiveMember = membership?.status === 'Active' || user?.roles.includes('SystemAdmin') || user?.roles.includes('SchoolAdmin');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kênh thảo luận chung CLB"
        description="Không gian trao đổi, thông báo và thảo luận trực tuyến giữa các thành viên"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Workspace', href: `/clubs/${clubId}/workspace/overview` },
          { label: 'Kênh Chat' },
        ]}
      />

      {!isActiveMember && membership ? (
        <Alert variant="danger" title="Không có quyền truy cập">
          <div className="flex items-center gap-2 mt-1">
            <AlertCircle className="w-4 h-4 text-[var(--status-danger-fg)]" />
            <span>Tài khoản của bạn đang ở trạng thái Tạm ngưng hoặc đã rời CLB nên không thể gửi tin nhắn vào kênh này.</span>
          </div>
        </Alert>
      ) : null}

      <div className="h-[600px] border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--surface-card)]">
        <ChatWindow conversationId={`club_${clubId}`} readOnly={!isActiveMember} />
      </div>
    </div>
  );
};

export default ClubChatPage;
