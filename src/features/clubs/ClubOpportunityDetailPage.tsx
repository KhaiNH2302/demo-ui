import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Flag,
  Info,
  MapPin,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OPPORTUNITY_TYPE_LABELS } from '@/components/shared/OpportunityCard';
import {
  CoParticipantsPanel,
  type CoParticipantItem,
} from '@/components/shared/CoParticipantsPanel';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useGuardedAction } from '@/lib/guestGate';
import { toast } from '@/components/ui/Toast';
import type { ClubOpportunity, OpportunityResponse } from '@/types/entities';

interface OpportunityDetailData extends ClubOpportunity {
  myResponse?: OpportunityResponse | null;
  coParticipants?: CoParticipantItem[];
}

export const ClubOpportunityDetailPage: React.FC = () => {
  const { oppId } = useParams<{ oppId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isRepresentativeOf } = useAuthStore();
  const guard = useGuardedAction();
  const [reportOpen, setReportOpen] = useState(false);

  const { data: opp, isLoading } = useQuery<OpportunityDetailData>({
    queryKey: ['club-opportunity', oppId],
    queryFn: () => apiClient.get(`/clubs/opportunities/${oppId}`),
    enabled: !!oppId,
  });

  const toggleVisMutation = useMutation({
    mutationFn: (visible: boolean) =>
      apiClient.put(`/clubs/registrations/${opp?.myResponse?.id}`, {
        action: 'toggleVisibility',
        visibleToCoParticipants: visible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-opportunity', oppId] });
      toast.success('Đã cập nhật tùy chọn hiển thị danh sách');
    },
  });

  if (isLoading || !opp) {
    return <Card className="h-80 animate-pulse bg-neutral-100" />;
  }

  const isRep = isRepresentativeOf(opp.clubId);
  const isFull = opp.used >= opp.quota;
  const pct = Math.min(100, Math.round((opp.used / Math.max(1, opp.quota)) * 100));
  const myResponse = opp.myResponse;
  const isConfirmedOrAccepted =
    myResponse?.status === 'Confirmed' || myResponse?.status === 'Accepted';

  const handleRegisterClick = guard(
    'register_opportunity',
    () => {
      navigate(`/clubs/opportunities/${opp.id}/register`);
    },
    { redirectTo: `/clubs/opportunities/${opp.id}/register`, targetId: opp.id }
  );

  return (
    <div className="space-y-6">
      {/* Top Back Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/clubs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Kết nối CLB</span>
        </Link>

        <div className="flex items-center gap-2">
          {isRep && (
            <Link to={`/clubs/manage/${opp.id}`}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
              >
                Quản lý bài đăng &amp; đơn
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={guard('report', () => setReportOpen(true))}
            leftIcon={<Flag className="h-4 w-4" />}
          >
            Báo cáo
          </Button>
        </div>
      </div>

      {/* Main 2-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Content */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Link
                to={`/clubs/${opp.clubId}`}
                className="inline-flex items-center gap-2.5 group"
              >
                {opp.clubLogo ? (
                  <img
                    src={opp.clubLogo}
                    alt={opp.clubName}
                    className="h-8 w-8 rounded-lg object-cover border border-neutral-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                    {opp.clubName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-brand-600">
                    {opp.clubName}
                  </div>
                  <div className="text-caption text-neutral-500">
                    Đăng bởi đại diện {opp.createdByName}
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-caption font-semibold bg-neutral-100 text-neutral-700">
                  {OPPORTUNITY_TYPE_LABELS[opp.type]}
                </span>
                <StatusBadge group="opportunity" status={opp.status} />
              </div>
            </div>

            <h1 className="text-page-title text-neutral-900">{opp.title}</h1>
            <p className="text-meta text-neutral-600 font-medium">{opp.summary}</p>

            {/* Key Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
              {opp.type === 'Event' && opp.startAt && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-caption text-neutral-500">Thời gian diễn ra</div>
                    <div className="font-medium text-neutral-900">
                      {new Date(opp.startAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}

              {opp.expectedCommitment && (
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-caption text-neutral-500">Mức cam kết dự kiến</div>
                    <div className="font-medium text-neutral-900">{opp.expectedCommitment}</div>
                  </div>
                </div>
              )}

              {opp.locationOrLink && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-caption text-neutral-500">
                      Địa điểm / Hình thức ({opp.mode || 'Offline'})
                    </div>
                    <div className="font-medium text-neutral-900">{opp.locationOrLink}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <Users className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-caption text-neutral-500">Hạn đăng ký</div>
                  <div className="font-medium text-neutral-900">
                    {new Date(opp.registrationDeadline).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-card-title text-neutral-900">Mô tả chi tiết</h3>
              <div className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                {opp.description}
              </div>
            </div>

            {opp.gallery && opp.gallery.length > 0 && (
              <div className="pt-3 border-t border-neutral-100">
                <ImageGallery
                  title="Hình ảnh hoạt động / các đợt trước"
                  images={opp.gallery}
                />
              </div>
            )}

            {/* Positions Table for CollaboratorRecruitment */}
            {opp.type === 'CollaboratorRecruitment' &&
              opp.positions &&
              opp.positions.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-neutral-100">
                  <h3 className="text-card-title text-neutral-900">
                    Các vị trí Cộng tác viên đang tuyển
                  </h3>
                  <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-caption font-semibold text-neutral-600">
                        <tr>
                          <th className="py-2.5 px-3.5">Vị trí / Ban</th>
                          <th className="py-2.5 px-3.5">Mô tả công việc</th>
                          <th className="py-2.5 px-3.5 text-right">Chỉ tiêu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {opp.positions.map((pos) => (
                          <tr key={pos.id}>
                            <td className="py-2.5 px-3.5 font-medium text-neutral-900">
                              {pos.name}
                            </td>
                            <td className="py-2.5 px-3.5 text-neutral-600">{pos.description}</td>
                            <td className="py-2.5 px-3.5 text-right font-medium text-neutral-800 whitespace-nowrap">
                              {pos.registeredCount}/{pos.quota}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* "Đăng ký nghĩa là gì?" Explanation Box per CL3 spec */}
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <Info className="h-4 w-4 text-brand-600 shrink-0" />
                <span>Đăng ký trên SCS hoạt động như thế nào?</span>
              </div>
              <p className="text-caption text-neutral-600 leading-relaxed">
                {opp.type === 'Event' && opp.confirmMode !== 'Approval'
                  ? 'Đây là sự kiện xác nhận tự động: ngay khi bạn gửi form, hệ thống sẽ giữ chỗ cho bạn và mở danh sách sinh viên cùng tham gia để bạn kết nối đi chung.'
                  : 'Khi bạn gửi đăng ký, hồ sơ sinh viên và câu trả lời của bạn sẽ được chuyển trực tiếp tới Đại diện CLB để xem xét, trao đổi qua kênh chat hoặc phản hồi kết quả trên hệ thống.'}
              </p>
            </div>
          </Card>

          {/* CoParticipantsPanel (CL11) shown when Confirmed / Accepted */}
          {isConfirmedOrAccepted && (
            <CoParticipantsPanel
              sourceType="opportunity"
              sourceId={opp.id}
              sourceTitle={opp.title}
              participants={opp.coParticipants || []}
              visibleToOthers={Boolean(myResponse?.visibleToCoParticipants)}
              onToggleVisibility={(val) => toggleVisMutation.mutate(val)}
            />
          )}
        </div>

        {/* Right Sticky Action Card */}
        <div className="lg:sticky lg:top-20 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Tiến độ chỉ tiêu</span>
                <span className="font-semibold text-neutral-900">
                  {opp.used} / {opp.quota} chỗ
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-caption text-neutral-500">
                Hạn đăng ký:{' '}
                {new Date(opp.registrationDeadline).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            </div>

            {myResponse ? (
              <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-neutral-600">
                    Trạng thái đơn của bạn
                  </span>
                  <StatusBadge group="opportunityResponse" status={myResponse.status} />
                </div>

                {myResponse.feedbackNote && (
                  <p className="text-caption text-neutral-700 bg-white p-2.5 rounded border border-neutral-200">
                    <strong>Phản hồi từ CLB:</strong> {myResponse.feedbackNote}
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {myResponse.status === 'NeedsMoreInfo' && (
                    <Link to={`/clubs/opportunities/${opp.id}/register`}>
                      <Button variant="primary" className="w-full">
                        Bổ sung thông tin ngay
                      </Button>
                    </Link>
                  )}
                  <Link to={`/clubs/registrations/${myResponse.id}`}>
                    <Button variant="secondary" className="w-full">
                      Xem chi tiết đơn đã nộp
                    </Button>
                  </Link>
                  <Link to="/chats">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      leftIcon={<MessageSquare className="h-4 w-4" />}
                    >
                      Nhắn tin cho đại diện CLB
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={opp.status !== 'Published' || isFull}
                  onClick={handleRegisterClick}
                >
                  {isFull
                    ? 'Đã đủ chỉ tiêu'
                    : opp.status !== 'Published'
                    ? 'Đã đóng đăng ký'
                    : opp.type === 'Event'
                    ? 'Đăng ký tham gia sự kiện'
                    : 'Ứng tuyển / Đăng ký ngay'}
                </Button>
                <p className="text-caption text-neutral-500 text-center">
                  Thông tin Họ tên, MSSV, Email sẽ được điền tự động từ hồ sơ của bạn.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="opportunity"
        targetId={opp.id}
        targetTitle={opp.title}
        targetAuthorName={opp.clubName}
      />
    </div>
  );
};

export default ClubOpportunityDetailPage;
