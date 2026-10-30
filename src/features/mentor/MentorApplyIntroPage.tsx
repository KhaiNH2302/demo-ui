import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import type { MentorApplication } from '@/types/entities';
import { MentorApplicationStatusView } from './MentorApplicationStatusView';
import { MentorApplyLanding } from './MentorApplyLanding';

export const MentorApplyIntroPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: application, isLoading } = useQuery<MentorApplication>({
    queryKey: ['mentor', 'application', 'me'],
    queryFn: () => apiClient.get('/mentor/applications/me'),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => apiClient.post('/mentor/applications/me/withdraw'),
    onSuccess: () => {
      toast({ title: 'Đã rút hồ sơ đăng ký Mentor' });
      queryClient.invalidateQueries({ queryKey: ['mentor', 'application', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['nav', 'counters'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Đăng ký Mentor" backHref="/mentoring" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const hasApplication = application && application.status !== 'Draft' && application.status !== 'Withdrawn';

  // If user already submitted an application, show MR3 status screen
  if (hasApplication) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Trạng thái hồ sơ Mentor"
          backHref="/mentoring"
          breadcrumb={[
            { label: 'Mentoring', href: '/mentoring' },
            { label: 'Hồ sơ Mentor của tôi' },
          ]}
        />
        <MentorApplicationStatusView
          application={application}
          withdrawing={withdrawMutation.isPending}
          onWithdraw={() => withdrawMutation.mutate()}
        />
      </div>
    );
  }

  // MR0: giới thiệu cho người chưa nộp (hoặc đang có bản nháp / đã rút)
  return <MentorApplyLanding draft={application} />;
};

export default MentorApplyIntroPage;
