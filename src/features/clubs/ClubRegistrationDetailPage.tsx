import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Edit3,
  Mail,
  MessageSquare,
  User,
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
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import { ErrorState } from '@/components/shared/ErrorState';
import type { ClubOpportunity, OpportunityResponse } from '@/types/entities';

interface RegistrationDetailData extends OpportunityResponse {
  opportunity?: ClubOpportunity | null;
  coParticipants?: CoParticipantItem[];
}

export const ClubRegistrationDetailPage: React.FC = () => {
  const { respId, responseId: paramResponseId } = useParams<{
    respId?: string;
    responseId?: string;
  }>();
  const responseId = respId || paramResponseId;
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: resp, isLoading, isError, refetch } = useQuery<RegistrationDetailData>({
    queryKey: ['club-registration', responseId],
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
    resp.status === 'Submitted' ||
    resp.status === 'UnderReview' ||
    resp.status === 'NeedsMoreInfo' ||
    resp.status === 'Confirmed' ||
    resp.status === 'Accepted';

  const isConfirmedOrAccepted =
    resp.status === 'Confirmed' || resp.status === 'Accepted';

  // Hạn trả kết quả dự kiến và kiểm tra quá hạn
  const expectedResultDeadline = (resp.opportunity as unknown as { resultDeadline?: string })?.resultDeadline || '2026-10-14';
  const isPastResultDeadline = new Date(expectedResultDeadline).getTime() < Date.now();
  const isUnreviewedOverdue = isPastResultDeadline && (resp.status === 'Submitted' || resp.status === 'UnderReview');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/clubs?tab=registrations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Đăng ký của tôi</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to={resp.conversationId ? `/chats/${resp.conversationId}` : '/chats'}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<MessageSquare className="h-4 w-4" />}
            >
              Trao đổi với Đại diện CLB
            </Button>
          </Link>
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
            <div className="text-caption text-neutral-500 mt-1 flex items-center gap-2">
              <span>Ngày nộp: {new Date(resp.submittedAt || Date.now()).toLocaleDateString('vi-VN')}</span>
              <span>·</span>
              <span>
                Hạn trả kết quả dự kiến:{' '}
                <strong>{new Date(expectedResultDeadline).toLocaleDateString('vi-VN')}</strong>
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
                  CLB chưa phản hồi đúng hạn (Hạn dự kiến: {new Date(expectedResultDeadline).toLocaleDateString('vi-VN')})
                </div>
                <p className="mt-1 text-caption text-amber-800 leading-relaxed">
                  Đã quá hạn thông báo kết quả nhưng CLB chưa hoàn tất duyệt hồ sơ. Đây là sự chậm trễ từ phía ban tuyển dụng CLB, hoàn toàn không phải lỗi của bạn. Hệ thống đã tự động gửi thông báo nhắc nhở tới đại diện CLB.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Đã gửi thêm lời nhắc ưu tiên tới Ban chủ nhiệm CLB!')}
              leftIcon={<Bell className="h-3.5 w-3.5 text-amber-700" />}
              className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 text-amber-900"
            >
              Gửi nhắc nhở CLB
            </Button>
          </div>
        )}

        {/* Khi trạng thái chuyển sang [Được nhận] / [Confirmed]: Hiển thị Người phụ trách và Onboarding */}
        {isConfirmedOrAccepted && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-brand-50/50 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Chúc mừng! Bạn đã trúng tuyển vào {resp.clubName}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-caption font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Tiếp nhận thành công
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    Người phụ trách: Nguyễn Hoàng Nam
                  </div>
                  <div className="text-caption text-neutral-500">
                    Trưởng ban Tuyển dụng &amp; Onboarding · {resp.clubName}
                  </div>
                  <div className="text-caption text-neutral-600 flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3 text-neutral-400" /> namnh.fu@fpt.edu.vn
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link to={resp.conversationId ? `/chats/${resp.conversationId}` : '/chats'}>
                  <Button variant="primary" size="sm" leftIcon={<MessageSquare className="h-4 w-4" />}>
                    Nhắn tin trao đổi
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Đã thêm lịch Onboarding & Buổi gặp mặt đầu tiên vào Lịch cá nhân!')}
                  leftIcon={<CalendarPlus className="h-4 w-4" />}
                >
                  Thêm lịch onboarding vào lịch
                </Button>
              </div>
            </div>
          </div>
        )}

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
                <div key={idx} className="relative pl-5 border-l-2 border-neutral-200 pb-1">
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
