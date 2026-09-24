import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import {
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  Clock,
  Video,
  MapPin,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { ClubApplication, ApplicationStatus } from '@/types/entities';

export const ClubRecruitmentApplicationsPage: React.FC = () => {
  const { clubId, rid } = useParams<{ clubId: string; rid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedApp, setSelectedApp] = useState<ClubApplication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSupplementOpen, setIsSupplementOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: '',
    type: 'Online' as 'Online' | 'Offline',
    locationOrLink: '',
  });

  const applicationsQuery = useQuery({
    queryKey: ['clubs', clubId, 'recruitments', rid, 'applications'],
    queryFn: () => apiClient.get<ClubApplication[]>(`/clubs/${clubId}/recruitments/${rid}/applications`),
    enabled: !!clubId && !!rid,
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ appId, updates }: { appId: string; updates: Partial<ClubApplication> }) =>
      apiClient.put(`/clubs/${clubId}/applications/${appId}`, updates),
    onSuccess: (res: any, vars) => {
      if (vars.updates.status === 'Accepted') {
        toast.success('Đã chấp nhận đơn và tự động thêm thành viên vào CLB!');
      } else {
        toast.success('Cập nhật trạng thái đơn thành công!');
      }
      setIsDetailOpen(false);
      setIsSupplementOpen(false);
      setIsRejectOpen(false);
      setIsInterviewOpen(false);
      setSelectedApp(null);
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'recruitments', rid, 'applications'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.members(clubId!) });
    },
    onError: () => toast.error('Có lỗi xảy ra khi cập nhật đơn.'),
  });

  const allApps = applicationsQuery.data || [];
  const acceptedCount = allApps.filter((a) => a.status === 'Accepted').length;

  const columns = [
    {
      id: 'Submitted',
      title: 'Mới nộp',
      badgeVariant: 'neutral' as const,
      items: allApps.filter((a) => a.status === 'Submitted'),
    },
    {
      id: 'NeedsSupplement',
      title: 'Cần bổ sung',
      badgeVariant: 'attention' as const,
      items: allApps.filter((a) => a.status === 'NeedsSupplement'),
    },
    {
      id: 'Screening',
      title: 'Duyệt hồ sơ',
      badgeVariant: 'pending' as const,
      items: allApps.filter((a) => a.status === 'Screening'),
    },
    {
      id: 'Interview',
      title: 'Phỏng vấn',
      badgeVariant: 'attention' as const,
      items: allApps.filter((a) => a.status === 'Interview'),
    },
    {
      id: 'Accepted',
      title: 'Trúng tuyển',
      badgeVariant: 'success' as const,
      items: allApps.filter((a) => a.status === 'Accepted'),
    },
    {
      id: 'Rejected',
      title: 'Từ chối',
      badgeVariant: 'danger' as const,
      items: allApps.filter((a) => a.status === 'Rejected'),
    },
  ];

  const handleCardClick = (app: ClubApplication) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
  };

  const handleCardMove = (appId: string, targetColId: string) => {
    updateAppMutation.mutate({
      appId,
      updates: { status: targetColId as ApplicationStatus },
    });
  };

  const handleScheduleInterview = () => {
    if (!selectedApp || !interviewForm.scheduledAt || !interviewForm.locationOrLink) {
      toast.error('Vui lòng nhập đầy đủ thời gian và địa điểm phỏng vấn');
      return;
    }
    updateAppMutation.mutate({
      appId: selectedApp.id,
      updates: {
        status: 'Interview',
        interview: {
          scheduledAt: interviewForm.scheduledAt,
          mode: interviewForm.type.toLowerCase() === 'online' ? 'online' : 'offline',
          type: interviewForm.type.toLowerCase() === 'online' ? 'online' : 'offline',
          location: interviewForm.locationOrLink,
          locationOrLink: interviewForm.locationOrLink,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xét duyệt đơn ứng tuyển"
        description="Quy trình sàng lọc hồ sơ, phỏng vấn và tiếp nhận thành viên mới"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Tuyển thành viên', href: `/clubs/${clubId}/workspace/recruitments` },
          { label: 'Xét duyệt hồ sơ' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-sm py-1 px-3">
              <Users className="w-4 h-4 mr-1.5" /> Đã tiếp nhận: {acceptedCount} ứng viên
            </Badge>
          </div>
        }
      />

      <QueryBoundary queries={[applicationsQuery]}>
        <KanbanBoard
          columns={columns}
          onCardMove={handleCardMove}
          renderCard={(app: ClubApplication) => (
            <div
              className="space-y-2 cursor-pointer"
              onClick={() => handleCardClick(app)}
            >
              <UserMiniCard userId={app.applicantId} showMajor />
              <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)] pt-1">
                <span>Nộp: {new Date(app.createdAt).toLocaleDateString('vi-VN')}</span>
                {app.interview && (
                  <Badge variant="outline" className="text-[10px]">
                    <Video className="w-3 h-3 mr-0.5" /> PV
                  </Badge>
                )}
              </div>
            </div>
          )}
        />
      </QueryBoundary>

      {/* Application Detail Drawer / Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết hồ sơ ứng viên</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 py-2">
              <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-lg">
                <UserMiniCard userId={selectedApp.applicantId} showMajor />
                <span className="text-xs text-[var(--text-muted)]">
                  Mã đơn: {selectedApp.id}
                </span>
              </div>

              {/* Answers */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Câu trả lời ứng tuyển:
                </h4>
                {Object.entries(selectedApp.answers || {}).map(([key, val]) => (
                  <div key={key} className="p-3 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border-subtle)]">
                    <span className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                      Câu hỏi ID / Trường ({key}):
                    </span>
                    <p className="text-sm text-[var(--text-main)] whitespace-pre-line">{val}</p>
                  </div>
                ))}
              </div>

              {/* Interview info if any */}
              {selectedApp.interview && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-1">
                  <div className="text-xs font-bold text-primary">Lịch phỏng vấn đã xếp:</div>
                  <div className="text-sm text-[var(--text-main)]">
                    {new Date(selectedApp.interview.scheduledAt).toLocaleString('vi-VN')} •{' '}
                    {selectedApp.interview.type} ({selectedApp.interview.locationOrLink})
                  </div>
                </div>
              )}

              {/* Action Buttons based on status */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                {['Submitted', 'Screening'].includes(selectedApp.status) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSupplementOpen(true)}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[var(--status-attention-fg)]" /> Yêu cầu bổ sung
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsInterviewOpen(true)}
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Lên lịch phỏng vấn
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsRejectOpen(true)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                    </Button>
                  </>
                )}

                {selectedApp.status === 'Interview' && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsRejectOpen(true)}
                    >
                      Không đạt
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        updateAppMutation.mutate({
                          appId: selectedApp.id,
                          updates: { status: 'Accepted' },
                        })
                      }
                      loading={updateAppMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Trúng tuyển & Nhận vào CLB
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={isInterviewOpen} onOpenChange={setIsInterviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lên lịch phỏng vấn ứng viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Thời gian phỏng vấn" required>
              <Input
                type="datetime-local"
                value={interviewForm.scheduledAt}
                onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Hình thức phỏng vấn" required>
              <RadioGroup
                name="type"
                value={interviewForm.type}
                onChange={(v) => setInterviewForm({ ...interviewForm, type: v as any })}
                options={[
                  { label: 'Phỏng vấn Online (Google Meet / MS Teams)', value: 'Online' },
                  { label: 'Phỏng vấn Trực tiếp (Phòng họp)', value: 'Offline' },
                ]}
              />
            </FormField>

            <FormField label="Địa điểm hoặc Link phòng họp" required>
              <Input
                placeholder="Ví dụ: https://meet.google.com/abc-xyz hoặc Phòng 301 Tòa Alpha"
                value={interviewForm.locationOrLink}
                onChange={(e) => setInterviewForm({ ...interviewForm, locationOrLink: e.target.value })}
                required
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInterviewOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleScheduleInterview} loading={updateAppMutation.isPending}>
              Xác nhận lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Dialog for Supplement Request */}
      <ReasonDialog
        open={isSupplementOpen}
        onOpenChange={setIsSupplementOpen}
        title="Yêu cầu bổ sung hồ sơ"
        description="Thông báo yêu cầu ứng viên cập nhật thêm câu trả lời hoặc tài liệu."
        label="Nội dung cần bổ sung"
        placeholder="Ví dụ: Vui lòng đính kèm thêm CV định dạng PDF..."
        onConfirm={(note) => {
          if (!selectedApp) return;
          updateAppMutation.mutate({
            appId: selectedApp.id,
            updates: { status: 'NeedsSupplement', supplementNote: note },
          });
        }}
      />

      {/* Reason Dialog for Reject */}
      <ReasonDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        title="Từ chối đơn ứng tuyển"
        description="Ứng viên sẽ nhận được thông báo kết quả xét duyệt."
        label="Lý do từ chối (tùy chọn)"
        placeholder="Nhập lý do phản hồi..."
        onConfirm={(reason) => {
          if (!selectedApp) return;
          updateAppMutation.mutate({
            appId: selectedApp.id,
            updates: { status: 'Rejected' },
          });
        }}
      />
    </div>
  );
};

export default ClubRecruitmentApplicationsPage;
