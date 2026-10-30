import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Edit3,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  CoParticipantsPanel,
  type CoParticipantItem,
} from '@/components/shared/CoParticipantsPanel';
import { OPPORTUNITY_TYPE_LABELS } from '@/components/shared/OpportunityCard';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { RecruitmentNextSteps } from './RecruitmentNextSteps';
import { formatClubDate, isResultOverdue } from './recruitment';
import { toast } from '@/components/ui/Toast';
import { ErrorState } from '@/components/shared/ErrorState';
import type { ClubOpportunity, ClubRepresentative, OpportunityResponse } from '@/types/entities';

interface RegistrationDetailData extends OpportunityResponse {
  opportunity?: ClubOpportunity | null;
  contact?: (ClubRepresentative & { email?: string }) | null;
  coParticipants?: CoParticipantItem[];
}

export const ClubRegistrationDetailPage: React.FC = () => {
  const { respId, responseId: paramResponseId } = useParams<{
    respId?: string;
    responseId?: string;
  }>();
  const responseId = respId || paramResponseId;
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.user?.id);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: resp, isLoading, isError, refetch } = useQuery<RegistrationDetailData>({
    queryKey: ['club-registration', responseId, userId],
    queryFn: () => apiClient.get(`/clubs/registrations/${responseId}`),
    enabled: !!responseId,
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/clubs/registrations/${responseId}`, {
        action: 'withdraw',
      }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-registration', responseId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'registrations', 'me'] });
      setWithdrawOpen(false);
      toast.success('Đã rút đơn đăng ký');
    },
  });

  const toggleVisMutation = useMutation({
    mutationFn: (visible: boolean) =>
      apiClient.put(`/clubs/registrations/${responseId}`, {
        action: 'toggleVisibility',
        visibleToCoParticipants: visible,
      }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-registration', responseId] });
      toast.success('Đã cập nhật tùy chọn hiển thị');
    },
  });

  const remindMutation = useMutation({
    mutationFn: () => apiClient.post<{ alreadySent: boolean }>(`/clubs/registrations/${responseId}/remind`),
    onSuccess: data => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); toast.success(data.alreadySent ? 'Bạn đã gửi nhắc nhở trong 24 giờ qua.' : 'Đã gửi nhắc nhở tới đại diện CLB'); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError) return <ErrorState title="Không thể tải dữ liệu" onRetry={() => refetch()} />;
  if (isLoading) {
    return <Card className="h-72 animate-pulse bg-neutral-100" />;
  }

  if (!resp) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-medium text-neutral-700">
          Không tìm thấy thông tin đơn đăng ký này.
        </p>
        <Link to="/clubs?tab=registrations">
          <Button variant="secondary" size="sm">
            Quay lại Đăng ký của tôi
          </Button>
        </Link>
      </Card>
    );
  }

  const canWithdraw =
    resp.status === 'Draft' ||
    resp.status === 'Submitted' ||
    resp.status === 'UnderReview' ||
    resp.status === 'NeedsMoreInfo' ||
    resp.status === 'Confirmed' ||
    resp.status === 'Accepted';

  const isConfirmedOrAccepted =
    resp.status === 'Confirmed' || resp.status === 'Accepted';

  const expectedResultDeadline = resp.opportunity?.resultDeadline;
  const isUnreviewedOverdue = isResultOverdue(resp, resp.opportunity);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/clubs?tab=registrations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Đăng ký của tôi</span>
        </Link>

        <div className="flex items-center gap-2">
          {canWithdraw && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setWithdrawOpen(true)}
            >
              Rút đăng ký
            </Button>
          )}
        </div>
      </div>

      {/* Header Summary Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-caption font-semibold text-neutral-600">
              {resp.clubName} · {OPPORTUNITY_TYPE_LABELS[resp.opportunityType]}
              {resp.positionName ? ` · ${resp.positionName}` : ''}
            </div>
            <Link
              to={`/clubs/opportunities/${resp.opportunityId}`}
              className="text-section-title text-neutral-900 hover:text-brand-600 mt-0.5 block"
            >
              {resp.opportunityTitle}
            </Link>
            <div className="text-caption text-neutral-600 mt-1 flex flex-wrap items-center gap-2">
              <span>Ngày nộp: {resp.submittedAt ? formatClubDate(resp.submittedAt) : 'Chưa gửi'}</span>
              <span>·</span>
              <span>
                Hạn trả kết quả dự kiến:{' '}
                <strong>{formatClubDate(expectedResultDeadline)}</strong>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge group="opportunityResponse" status={resp.status} size="md" />
            {isUnreviewedOverdue && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                CLB chưa phản hồi đúng hạn
              </span>
            )}
          </div>
        </div>

        {/* Xử lý đơn quá hạn: Cảnh báo "CLB chưa phản hồi đúng hạn" */}
        {isUnreviewedOverdue && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-900">
                  CLB chưa phản hồi đúng hạn (Hạn dự kiến: {formatClubDate(expectedResultDeadline)})
                </div>
                <p className="mt-1 text-caption text-amber-800 leading-relaxed">
                  Đã quá hạn thông báo kết quả nhưng CLB chưa hoàn tất duyệt hồ sơ. Đây là sự chậm trễ từ phía ban tuyển dụng CLB, hoàn toàn không phải lỗi của bạn. Bạn có thể gửi nhắc nhở tới đại diện CLB ngay tại đây.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => remindMutation.mutate()}
              loading={remindMutation.isPending}
              leftIcon={<Bell className="h-3.5 w-3.5 text-amber-700" />}
              className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 text-amber-900"
            >
              Gửi nhắc nhở CLB
            </Button>
          </div>
        )}

        {isConfirmedOrAccepted && <RecruitmentNextSteps responseId={resp.id} opportunity={resp.opportunity} contact={resp.contact}/>}

        {/* Feedback Alert Banner */}
        {resp.status === 'NeedsMoreInfo' && (
          <div className="p-4 rounded-lg bg-tier-attention-bg border border-tier-attention-border text-tier-attention-text flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">CLB yêu cầu bổ sung thông tin</div>
                <p className="mt-0.5">{resp.feedbackNote}</p>
              </div>
            </div>
            <Link to={`/clubs/opportunities/${resp.opportunityId}/register`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit3 className="h-4 w-4" />}
              >
                Bổ sung &amp; Gửi lại
              </Button>
            </Link>
          </div>
        )}

        {(resp.status === 'Accepted' || resp.status === 'Confirmed') && resp.feedbackNote && (
          <div className="p-4 rounded-lg bg-tier-success-bg border border-tier-success-border text-tier-success-text flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Lời nhắn xác nhận từ Đại diện CLB</div>
              <p className="mt-0.5">{resp.feedbackNote}</p>
            </div>
          </div>
        )}

        {resp.status === 'Rejected' && resp.feedbackNote && (
          <div className="p-4 rounded-lg bg-tier-danger-bg border border-tier-danger-border text-tier-danger-text flex items-start gap-2.5 text-sm">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Phản hồi từ Đại diện CLB</div>
              <p className="mt-0.5">{resp.feedbackNote}</p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submitted Answers */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 space-y-4">
            <h3 className="text-card-title text-neutral-900">
              Thông tin &amp; Câu trả lời đã nộp
            </h3>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
              <div>
                <span className="text-caption text-neutral-500 block">Họ và tên</span>
                <span className="font-medium text-neutral-900">
                  {resp.profileSnapshot.fullName}
                </span>
              </div>
              <div>
                <span className="text-caption text-neutral-500 block">MSSV</span>
                <span className="font-medium text-neutral-900">
                  {resp.profileSnapshot.studentCode}
                </span>
              </div>
              <div>
                <span className="text-caption text-neutral-500 block">Ngành &amp; Khóa</span>
                <span className="font-medium text-neutral-900">
                  {resp.profileSnapshot.major} · {resp.profileSnapshot.cohort}
                </span>
              </div>
              <div>
                <span className="text-caption text-neutral-500 block">Email</span>
                <span className="font-medium text-neutral-900">
                  {resp.profileSnapshot.email}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {resp.answers.map((ans, idx) => (
                <div key={ans.questionId} className="space-y-1">
                  <div className="text-sm font-medium text-neutral-800">
                    {idx + 1}. {ans.questionLabel}
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 whitespace-pre-wrap">
                    {Array.isArray(ans.value) ? ans.value.join(', ') : ans.value || '—'}
                  </div>
                </div>
              ))}

              {resp.note && (
                <div className="space-y-1 pt-2">
                  <div className="text-sm font-medium text-neutral-800">Ghi chú đính kèm</div>
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-800">
                    {resp.note}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {isConfirmedOrAccepted && (
            <CoParticipantsPanel
              sourceType="opportunity"
              sourceId={resp.opportunityId}
              sourceTitle={resp.opportunityTitle}
              participants={resp.coParticipants || []}
              visibleToOthers={resp.visibleToCoParticipants}
              onToggleVisibility={(val) => toggleVisMutation.mutate(val)}
            />
          )}
        </div>

        {/* Status Timeline */}
        <div>
          <Card className="p-5 space-y-4">
            <h3 className="text-card-title text-neutral-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500" />
              <span>Lịch sử xử lý đơn</span>
            </h3>
            <div className="space-y-4">
              {resp.history.map((h, idx) => (
                <div key={idx} className="relative pl-5 border-l border-neutral-200 pb-1">
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-600" />
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge group="opportunityResponse" status={h.status} />
                    <span className="text-caption text-neutral-400">
                      {new Date(h.at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {h.actorName && (
                    <div className="text-caption text-neutral-500 mt-1">
                      Bởi: {h.actorName}
                    </div>
                  )}
                  {h.note && (
                    <p className="text-caption text-neutral-700 mt-1 bg-neutral-50 p-2 rounded border border-neutral-200">
                      {h.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="Rút đơn đăng ký?"
        description="Sau khi rút, CLB sẽ ngừng xem xét đơn của bạn cho cơ hội này."
        confirmLabel="Xác nhận rút đơn"
        variant="danger"
        onConfirm={() => withdrawMutation.mutate()}
      />
    </div>
  );
};

export default ClubRegistrationDetailPage;
