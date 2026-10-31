import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Download,
  Edit3,
  Eye,
  HelpCircle,
  MessageSquare,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OPPORTUNITY_TYPE_LABELS } from '@/components/shared/OpportunityCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { ErrorState } from '@/components/shared/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatClubDate, isResultOverdue } from './recruitment';
import type { ClubOpportunity, OpportunityResponse } from '@/types/entities';
import type { OpportunityResponseStatus } from '@/types/status';

export const ClubOpportunityManageDetailPage: React.FC = () => {
  const { oppId } = useParams<{ oppId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isRepresentativeOf } = useAuthStore();

  const [selectedResponse, setSelectedResponse] = useState<OpportunityResponse | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [closeReasonOpen, setCloseReasonOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: opp, isLoading, isError, refetch } = useQuery<ClubOpportunity>({
    queryKey: ['club-opportunity', oppId, user?.id],
    queryFn: () => apiClient.get(`/clubs/opportunities/${oppId}`),
    enabled: !!oppId,
  });

  const { data: responses = [], isPending: responsesLoading, isError: responsesError, refetch: refetchResponses } = useQuery<OpportunityResponse[]>({
    queryKey: ['club-opportunity-responses', oppId, user?.id],
    queryFn: () => apiClient.get(`/clubs/opportunities/${oppId}/responses`),
    enabled: !!oppId && !!opp && isRepresentativeOf(opp.clubId),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      responseId: string;
      status: OpportunityResponseStatus;
      feedbackNote?: string;
    }) =>
      apiClient.put(`/clubs/responses/${payload.responseId}/review`, {
        status: payload.status,
        feedbackNote: payload.feedbackNote,
      }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-opportunity-responses', oppId] });
      queryClient.invalidateQueries({ queryKey: ['club-opportunity', oppId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club-registration'] });
      setSelectedResponse(null);
      setFeedbackNote('');
      toast.success('Đã cập nhật kết quả phản hồi cho sinh viên');
    },
  });

  const updateOppStatusMutation = useMutation({
    mutationFn: (payload: { status: 'Closed' | 'Cancelled'; cancelReason?: string }) =>
      apiClient.put(`/clubs/opportunities/${oppId}`, payload),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-opportunity', oppId] });
      setCloseReasonOpen(false);
      toast.success('Đã cập nhật trạng thái bài đăng');
    },
  });

  const openConversation = useMutation({
    mutationFn: (responseId: string) => apiClient.post<{ id: string }>(`/clubs/registrations/${responseId}/conversation`),
    onSuccess: data => { queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] }); navigate(`/chats/${data.id}`); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError || (!isLoading && !opp)) return <ErrorState title="Không thể tải cơ hội CLB" onRetry={() => refetch()} />;
  if (isLoading || !opp) {
    return <Card className="h-72 animate-pulse bg-neutral-100" />;
  }

  if (!isRepresentativeOf(opp.clubId)) return <ErrorState title="Cần quyền đại diện CLB" message="Bạn không có quyền quản lý cơ hội của CLB này." />;
  if (responsesError) return <ErrorState title="Không thể tải đăng ký" onRetry={() => refetchResponses()} />;
  if (responsesLoading) return <p role="status">Đang tải hồ sơ ứng tuyển…</p>;

  const filteredResponses = responses.filter(response => (statusFilter === 'all' || response.status === statusFilter) && `${response.profileSnapshot.fullName} ${response.profileSnapshot.studentCode} ${response.positionName || ''}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  const overdueCount = responses.filter(response => isResultOverdue(response, opp)).length;

  const confirmedList = filteredResponses.filter(
    (r) => r.status === 'Confirmed' || r.status === 'Accepted'
  );

  const handleExportCsv = () => {
    const headers = ['Họ tên,MSSV,Email,Ngành,Khóa,Vị trí,Trạng thái'];
    const cell = (value: string) => '"' + (/^[=+@-]/.test(value) ? "'" : '') + value.replace(/"/g, '""') + '"';
    const rows = confirmedList.map(r => [r.profileSnapshot.fullName, r.profileSnapshot.studentCode, r.profileSnapshot.email, r.profileSnapshot.major, r.profileSnapshot.cohort, r.positionName || '', r.status].map(cell).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-${opp.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file CSV danh sách tham gia');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/clubs?tab=manage"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Bài đăng của tôi</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to={`/clubs/manage/${opp.id}/edit`}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              Sửa bài đăng
            </Button>
          </Link>
          {opp.status === 'Published' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateOppStatusMutation.mutate({ status: 'Closed' })}
              >
                Đóng nhận đơn
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCloseReasonOpen(true)}
              >
                Hủy bài đăng
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Header */}
      <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-caption font-semibold text-brand-600">
              {opp.clubName} · {OPPORTUNITY_TYPE_LABELS[opp.type]}
            </span>
            <StatusBadge group="opportunity" status={opp.status} />
          </div>
          <h1 className="text-section-title text-neutral-900">{opp.title}</h1>
          <p className="text-caption text-neutral-500">
            Chỉ tiêu đã xác nhận: <strong>{opp.used}/{opp.quota}</strong> · Tổng phản hồi:{' '}
            <strong>{responses.length}</strong>
          </p>
        </div>
      </Card>

      {overdueCount > 0 && <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Có {overdueCount} hồ sơ chưa nhận kết quả đúng hẹn ({formatClubDate(opp.resultDeadline)}). Bạn vẫn có thể xử lý đơn; sinh viên sẽ nhận thông báo khi có quyết định.</div>}
      <div className="flex flex-col gap-3 sm:flex-row"><Input aria-label="Tìm hồ sơ ứng tuyển" placeholder="Tìm tên, MSSV, vị trí…" value={search} onChange={event => setSearch(event.target.value)}/><Select aria-label="Lọc trạng thái hồ sơ" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="Submitted">Mới nộp</option><option value="UnderReview">Đang xem xét</option><option value="NeedsMoreInfo">Cần bổ sung</option><option value="Accepted">Được nhận</option><option value="Rejected">Từ chối</option><option value="Withdrawn">Đã rút</option></Select></div>
      <Tabs defaultValue="responses">
        <TabsList>
          <TabsTrigger value="responses">
            Phản hồi đăng ký ({responses.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Danh sách đã xác nhận ({confirmedList.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ALL RESPONSES */}
        <TabsContent value="responses" className="space-y-4">
          {filteredResponses.length === 0 ? (
            <EmptyState
              title="Không có hồ sơ phù hợp"
              description="Khi sinh viên gửi đơn, danh sách sẽ hiển thị tại đây để bạn xem xét."
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-caption font-semibold text-neutral-600">
                    <tr>
                      <th className="py-3 px-4">Sinh viên</th>
                      <th className="py-3 px-4">Ngành / Khóa</th>
                      {Boolean(opp.positions?.length) && (
                        <th className="py-3 px-4">Vị trí / Ban</th>
                      )}
                      <th className="py-3 px-4">Ngày gửi</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredResponses.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-50/70">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">
                            {r.profileSnapshot.fullName}
                          </div>
                          <div className="text-caption text-neutral-500">
                            {r.profileSnapshot.studentCode} · {r.profileSnapshot.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {r.profileSnapshot.major} · {r.profileSnapshot.cohort}
                        </td>
                        {Boolean(opp.positions?.length) && (
                          <td className="py-3 px-4 text-neutral-700 font-medium">
                            {r.positionName || '—'}
                          </td>
                        )}
                        <td className="py-3 px-4 text-caption text-neutral-500">
                          {r.submittedAt
                            ? new Date(r.submittedAt).toLocaleDateString('vi-VN')
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge group="opportunityResponse" status={r.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedResponse(r);
                              setFeedbackNote(r.feedbackNote || '');
                            }}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                          >
                            Xem &amp; Duyệt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: CONFIRMED / ACCEPTED */}
        <TabsContent value="confirmed" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-meta text-neutral-600">
              Danh sách sinh viên đã xác nhận tham gia hoặc được chấp nhận
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={confirmedList.length === 0}
              onClick={handleExportCsv}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Xuất CSV
            </Button>
          </div>

          {confirmedList.length === 0 ? (
            <EmptyState
              title="Chưa có sinh viên nào trong danh sách xác nhận"
              description="Duyệt các đơn ở tab Phản hồi đăng ký để thêm vào danh sách."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {confirmedList.map((r) => (
                <Card
                  key={r.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {r.profileSnapshot.fullName} ({r.profileSnapshot.studentCode})
                    </div>
                    <div className="text-caption text-neutral-500">
                      {r.profileSnapshot.major} · {r.profileSnapshot.cohort}
                      {r.positionName ? ` · ${r.positionName}` : ''}
                    </div>
                  </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                      loading={openConversation.isPending && openConversation.variables === r.id}
                      onClick={() => openConversation.mutate(r.id)}
                    >
                      Nhắn tin
                    </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* CL10 Review Modal */}
      <Dialog
        open={!!selectedResponse}
        onOpenChange={(v) => !v && setSelectedResponse(null)}
      >
        <DialogContent className="max-w-xl">
          {selectedResponse && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle>
                    Đơn đăng ký của {selectedResponse.profileSnapshot.fullName}
                  </DialogTitle>
                  <StatusBadge
                    group="opportunityResponse"
                    status={selectedResponse.status}
                  />
                </div>
                <DialogDescription>
                  {selectedResponse.profileSnapshot.studentCode} ·{' '}
                  {selectedResponse.profileSnapshot.major} ·{' '}
                  {selectedResponse.profileSnapshot.cohort}
                  {selectedResponse.positionName
                    ? ` · Ứng tuyển: ${selectedResponse.positionName}`
                    : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="my-3 space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {selectedResponse.answers.map((a, idx) => (
                  <div key={a.questionId} className="space-y-1">
                    <div className="text-caption font-semibold text-neutral-700">
                      {idx + 1}. {a.questionLabel}
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-800">
                      {Array.isArray(a.value) ? a.value.join(', ') : a.value || '—'}
                    </div>
                  </div>
                ))}

                {selectedResponse.note && (
                  <div className="space-y-1">
                    <div className="text-caption font-semibold text-neutral-700">
                      Ghi chú đính kèm
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-800">
                      {selectedResponse.note}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-1.5">
                  <label className="block text-caption font-semibold text-neutral-700">
                    Ghi chú phản hồi gửi tới sinh viên (Bắt buộc khi Yêu cầu bổ sung hoặc Từ chối)
                  </label>
                  <Textarea
                    rows={3}
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Nhập hướng dẫn bổ sung thông tin, lịch hẹn gặp hoặc lời nhắn xác nhận..."
                  />
                </div>
              </div>

              <DialogFooter className="flex-wrap gap-2">
                {selectedResponse.status === 'Submitted' && <Button variant="outline" size="sm" loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ responseId: selectedResponse.id, status: 'UnderReview' })}>Bắt đầu xem xét</Button>}
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={reviewMutation.isPending}
                  disabled={!['Submitted','UnderReview','NeedsMoreInfo'].includes(selectedResponse.status) || !['Published','Closed'].includes(opp.status)}
                  onClick={() => {
                    if (!feedbackNote.trim()) {
                      toast.error('Vui lòng nhập nội dung cần sinh viên bổ sung');
                      return;
                    }
                    reviewMutation.mutate({
                      responseId: selectedResponse.id,
                      status: 'NeedsMoreInfo',
                      feedbackNote: feedbackNote.trim(),
                    });
                  }}
                  leftIcon={<HelpCircle className="h-4 w-4" />}
                >
                  Yêu cầu bổ sung
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={reviewMutation.isPending}
                  onClick={() => {
                    if (!feedbackNote.trim()) {
                      toast.error('Vui lòng nhập lý do từ chối ngắn gọn');
                      return;
                    }
                    reviewMutation.mutate({
                      responseId: selectedResponse.id,
                      status: 'Rejected',
                      feedbackNote: feedbackNote.trim(),
                    });
                  }}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Từ chối
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      responseId: selectedResponse.id,
                      status: opp.type === 'Event' ? 'Confirmed' : 'Accepted',
                      feedbackNote:
                        feedbackNote.trim() || 'Chào mừng bạn tham gia cùng CLB!',
                    })
                  }
                  leftIcon={<Check className="h-4 w-4" />}
                  disabled={reviewMutation.isPending || !['Submitted','UnderReview','NeedsMoreInfo'].includes(selectedResponse.status) || !['Published','Closed'].includes(opp.status) || opp.used >= opp.quota || !!opp.positions?.some((position) => position.id === selectedResponse.positionId && position.registeredCount >= position.quota)}
                >
                  {opp.type === 'Event' ? 'Xác nhận tham gia' : 'Chấp nhận đơn'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Opportunity Dialog */}
      <Dialog open={closeReasonOpen} onOpenChange={setCloseReasonOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hủy bài đăng cơ hội?</DialogTitle>
            <DialogDescription>
              Tất cả sinh viên đã đăng ký sẽ nhận được thông báo hủy kèm lý do của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="my-3">
            <Textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy bài đăng..."
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCloseReasonOpen(false)}>
              Đóng
            </Button>
            <Button
              variant="danger"
              disabled={!cancelReason.trim()}
              onClick={() =>
                updateOppStatusMutation.mutate({
                  status: 'Cancelled',
                  cancelReason: cancelReason.trim(),
                })
              }
            >
              Xác nhận hủy bài đăng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubOpportunityManageDetailPage;
