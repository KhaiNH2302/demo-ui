import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  Eye,
  HeartHandshake,
  Calendar,
  MapPin,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import type { ProgramChannel } from '@/types/entities';

export const AdminProgramsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'PendingReview' | 'Published' | 'Rejected' | 'all'>('PendingReview');
  const [selectedProgram, setSelectedProgram] = useState<ProgramChannel | null>(null);
  const [reasonTarget, setReasonTarget] = useState<{
    id: string;
    status: 'Rejected' | 'Cancelled';
    title: string;
  } | null>(null);

  const programsQuery = useQuery<ProgramChannel[]>({
    queryKey: ['admin', 'programs', tab],
    queryFn: () => apiClient.get('/admin/programs', { params: { status: tab } }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'Published' | 'Rejected' | 'Cancelled';
      reason?: string;
    }) => apiClient.put(`/admin/programs/${id}/review`, { status, reason }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === 'Published'
          ? 'Đã phê duyệt kênh chương trình xuất bản!'
          : vars.status === 'Rejected'
          ? 'Đã gửi yêu cầu chỉnh sửa cho người tổ chức.'
          : 'Đã hủy / gỡ kênh chương trình.'
      );
      setSelectedProgram(null);
      setReasonTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duyệt Kênh Chương trình (Tình nguyện & Workshop)"
        description="Kiểm duyệt tính hợp lệ, thông tin an toàn và mục tiêu cộng đồng trước khi mở kênh đăng ký công khai"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Duyệt kênh chương trình' },
        ]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full space-y-6">
        <TabsList>
          <TabsTrigger value="PendingReview">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="Published">Đang mở công khai</TabsTrigger>
          <TabsTrigger value="Rejected">Yêu cầu chỉnh sửa</TabsTrigger>
          <TabsTrigger value="all">Tất cả kênh</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <QueryBoundary queries={[programsQuery]}>
            {programsQuery.data && programsQuery.data.length === 0 ? (
              <EmptyState
                icon={HeartHandshake}
                title="Không có kênh chương trình nào"
                description="Hiện tại không có kênh nào ở trạng thái được chọn."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {programsQuery.data?.map((prog) => (
                  <Card key={prog.id} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge tier={prog.type === 'Volunteer' ? 'success' : 'brand'} size="sm">
                          {prog.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'}
                        </Badge>
                        <StatusBadge status={prog.status} group="programChannel" />
                      </div>
                      <CardTitle className="text-base leading-snug">{prog.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 text-xs">
                      <p className="text-neutral-600 line-clamp-2">{prog.summary}</p>

                      <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={prog.organizer.avatarUrl}
                            name={prog.organizer.fullName}
                            size="sm"
                          />
                          <div>
                            <div className="font-semibold text-neutral-900">
                              {prog.organizer.fullName} ({prog.organizer.studentCode})
                            </div>
                            <div className="text-neutral-500">
                              {prog.organizer.major} · {prog.organizer.cohort} ·{' '}
                              {prog.organizer.roleNote}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate">
                            {new Date(prog.startAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate">
                            {prog.mode} · {prog.locationOrLink}
                          </span>
                        </div>
                      </div>

                      {prog.safetyNotes && (
                        <div className="flex items-start gap-2 rounded-lg bg-brand-50/50 border border-brand-100 p-2.5 text-neutral-700">
                          <ShieldCheck size={14} className="text-brand-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            <strong>Lưu ý an toàn:</strong> {prog.safetyNotes}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="border-t border-neutral-100 pt-3 flex items-center justify-between gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => setSelectedProgram(prog)}
                      >
                        Xem hồ sơ kênh
                      </Button>

                      <div className="flex items-center gap-2">
                        {prog.status === 'PendingReview' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<X size={14} />}
                              onClick={() =>
                                setReasonTarget({
                                  id: prog.id,
                                  status: 'Rejected',
                                  title: prog.title,
                                })
                              }
                            >
                              Yêu cầu sửa
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Check size={14} />}
                              loading={reviewMutation.isPending}
                              onClick={() =>
                                reviewMutation.mutate({ id: prog.id, status: 'Published' })
                              }
                            >
                              Phê duyệt
                            </Button>
                          </>
                        )}

                        {prog.status === 'Published' && (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Ban size={14} />}
                            onClick={() =>
                              setReasonTarget({
                                id: prog.id,
                                status: 'Cancelled',
                                title: prog.title,
                              })
                            }
                          >
                            Gỡ / Hủy kênh
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {/* Detail Review Dialog */}
      <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết kênh chương trình đăng ký kiểm duyệt</DialogTitle>
          </DialogHeader>
          {selectedProgram && (
            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center justify-between">
                <Badge tier={selectedProgram.type === 'Volunteer' ? 'success' : 'brand'}>
                  {selectedProgram.type === 'Volunteer'
                    ? 'Chiến dịch Tình nguyện'
                    : 'Workshop Học thuật'}
                </Badge>
                <StatusBadge status={selectedProgram.status} group="programChannel" />
              </div>

              <h3 className="text-base font-bold text-neutral-900">{selectedProgram.title}</h3>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1">
                <div className="font-semibold text-neutral-900">
                  Người đứng tên tổ chức: {selectedProgram.organizer.fullName} (
                  {selectedProgram.organizer.studentCode})
                </div>
                <div className="text-neutral-600">
                  Ngành {selectedProgram.organizer.major} · {selectedProgram.organizer.cohort} · Vai
                  trò: {selectedProgram.organizer.roleNote}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-neutral-900 block">Nội dung chi tiết:</span>
                <div className="rounded-lg border border-neutral-200 bg-surface p-3 whitespace-pre-line text-neutral-700 leading-relaxed">
                  {selectedProgram.description}
                </div>
              </div>

              {selectedProgram.beneficiaryAndGoal && (
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-900 block">
                    Đối tượng thụ hưởng & Mục tiêu:
                  </span>
                  <p className="text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    {selectedProgram.beneficiaryAndGoal}
                  </p>
                </div>
              )}

              {selectedProgram.speakerInfo && (
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-900 block">
                    Diễn giả / Người hướng dẫn:
                  </span>
                  <div className="text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-0.5">
                    <div className="font-semibold text-neutral-900">
                      {selectedProgram.speakerInfo.name}
                    </div>
                    <div>{selectedProgram.speakerInfo.bio}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-semibold text-neutral-900 block">
                  Cam kết an toàn & Nội quy:
                </span>
                <p className="text-neutral-700 bg-brand-50/50 p-2.5 rounded-lg border border-brand-100">
                  {selectedProgram.safetyNotes}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <div>
                  <span className="text-neutral-500 block">Chỉ tiêu & Chế độ xác nhận:</span>
                  <strong className="text-neutral-900">
                    {selectedProgram.quota} người ·{' '}
                    {selectedProgram.confirmMode === 'Instant'
                      ? 'Xác nhận ngay'
                      : 'Xét duyệt trước'}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Chi phí tham gia:</span>
                  <strong className="text-neutral-900">
                    {selectedProgram.costInfo === 'Free'
                      ? 'Miễn phí'
                      : selectedProgram.costDetails || 'Tự túc'}
                  </strong>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-neutral-200">
                {selectedProgram.status === 'PendingReview' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReasonTarget({
                          id: selectedProgram.id,
                          status: 'Rejected',
                          title: selectedProgram.title,
                        });
                        setSelectedProgram(null);
                      }}
                    >
                      Yêu cầu chỉnh sửa
                    </Button>
                    <Button
                      variant="primary"
                      loading={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({ id: selectedProgram.id, status: 'Published' })
                      }
                    >
                      Phê duyệt xuất bản
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reason Dialog for Reject / Cancel */}
      <ReasonDialog
        open={!!reasonTarget}
        onOpenChange={() => setReasonTarget(null)}
        title={
          reasonTarget?.status === 'Rejected'
            ? 'Yêu cầu chỉnh sửa kênh chương trình'
            : 'Xác nhận gỡ / hủy kênh chương trình'
        }
        description={
          reasonTarget?.status === 'Rejected'
            ? 'Nêu rõ thông tin cần người tổ chức bổ sung hoặc chỉnh sửa (địa điểm, lưu ý an toàn, mô tả...)'
            : 'Kênh sẽ bị đóng và thông báo đến toàn bộ người tham gia.'
        }
        label="Lý do / Ghi chú kiểm duyệt"
        placeholder="Nhập lý do gửi tới sinh viên tổ chức..."
        onConfirm={(reason) => {
          if (!reasonTarget) return;
          reviewMutation.mutate({
            id: reasonTarget.id,
            status: reasonTarget.status,
            reason,
          });
        }}
      />
    </div>
  );
};

export default AdminProgramsPage;
