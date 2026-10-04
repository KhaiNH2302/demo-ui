import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Download,
  Edit3,
  Megaphone,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import { PROGRAM_TYPE_LABELS } from '@/components/shared/ProgramCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import type {
  ProgramAnnouncement,
  ProgramChannel,
  ProgramRegistration,
} from '@/types/entities';

interface ProgramManageData extends ProgramChannel {
  registrations?: ProgramRegistration[];
  announcements?: ProgramAnnouncement[];
}

export const ProgramManagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [annOpen, setAnnOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const { data: prog, isLoading } = useQuery<ProgramManageData>({
    queryKey: ['program', id],
    queryFn: () => apiClient.get(`/programs/${id}`),
    enabled: !!id,
  });

  const reviewRegMutation = useMutation({
    mutationFn: (payload: { regId: string; status: 'Confirmed' | 'Rejected' }) =>
      apiClient.put(`/programs/registrations/${payload.regId}`, {
        status: payload.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      toast.success('Đã cập nhật trạng thái đăng ký');
    },
  });

  const postAnnMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/programs/${id}/announcements`, {
        title: annTitle.trim(),
        body: annBody.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      setAnnOpen(false);
      setAnnTitle('');
      setAnnBody('');
      toast.success('Đã đăng thông báo chung và gửi tới người tham gia');
    },
  });

  const closeChannelMutation = useMutation({
    mutationFn: () => apiClient.put(`/programs/${id}`, { status: 'Closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      toast.success('Đã đóng nhận đăng ký cho kênh này');
    },
  });

  if (isLoading || !prog) {
    return <Card className="h-72 animate-pulse bg-neutral-100" />;
  }

  const registrations = prog.registrations || [];
  const confirmedRegs = registrations.filter((r) => r.status === 'Confirmed');
  const announcements = prog.announcements || [];

  const handleExportCsv = () => {
    const headers = ['Họ tên,MSSV,Email,Ngành,Khóa,Ca đăng ký,Trạng thái'];
    const rows = confirmedRegs.map(
      (r) =>
        `"${r.profileSnapshot.fullName}","${r.profileSnapshot.studentCode}","${r.profileSnapshot.email}","${r.profileSnapshot.major}","${r.profileSnapshot.cohort}","${r.slotName || ''}","${r.status}"`
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-${prog.id}.csv`;
    a.click();
    toast.success('Đã xuất file CSV danh sách tham gia');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/programs?tab=organizing"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Kênh tôi tổ chức</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to={`/programs/${prog.id}/edit`}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              Sửa thông tin kênh
            </Button>
          </Link>
          {prog.status === 'Published' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => closeChannelMutation.mutate()}
            >
              Đóng đăng ký
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAnnOpen(true)}
            leftIcon={<Megaphone className="h-4 w-4" />}
          >
            Đăng thông báo chung
          </Button>
        </div>
      </div>

      <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-caption font-semibold text-brand-600">
              {PROGRAM_TYPE_LABELS[prog.type]}
            </span>
            <StatusBadge group="programChannel" status={prog.status} />
          </div>
          <h1 className="text-section-title text-neutral-900">{prog.title}</h1>
          <p className="text-caption text-neutral-500">
            Đã xác nhận: <strong>{prog.confirmedCount}/{prog.quota}</strong> · Tổng lượt đăng ký:{' '}
            <strong>{registrations.length}</strong>
          </p>
        </div>
      </Card>

      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">
            Đăng ký ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="participants">
            Người tham gia đã xác nhận ({confirmedRegs.length})
          </TabsTrigger>
          <TabsTrigger value="announcements">
            Thông báo chung ({announcements.length}/5 hôm nay)
          </TabsTrigger>
          <TabsTrigger value="coorganizers">
            Đồng tổ chức ({prog.coOrganizers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-4">
          {registrations.length === 0 ? (
            <EmptyState
              title="Chưa có lượt đăng ký nào"
              description="Chia sẻ đường dẫn kênh chương trình để sinh viên đăng ký tham gia."
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-caption font-semibold text-neutral-600">
                    <tr>
                      <th className="py-3 px-4">Sinh viên</th>
                      <th className="py-3 px-4">Ca / Câu trả lời</th>
                      <th className="py-3 px-4 whitespace-nowrap">Ngày gửi</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Duyệt nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-neutral-50/70">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">
                            {reg.profileSnapshot.fullName}
                          </div>
                          <div className="text-caption text-neutral-500">
                            {reg.profileSnapshot.studentCode} · {reg.profileSnapshot.major} (
                            {reg.profileSnapshot.cohort})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {reg.slotName && (
                            <div className="text-caption font-semibold text-brand-600 mb-0.5">
                              {reg.slotName}
                            </div>
                          )}
                          <div className="text-caption text-neutral-600 line-clamp-2">
                            {reg.answers.map((a) => `${a.value}`).join(' · ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-caption text-neutral-500">
                          {new Date(reg.submittedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge group="programRegistration" status={reg.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {reg.status === 'Submitted' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  reviewRegMutation.mutate({
                                    regId: reg.id,
                                    status: 'Rejected',
                                  })
                                }
                                leftIcon={<X className="h-3.5 w-3.5" />}
                              >
                                Từ chối
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  reviewRegMutation.mutate({
                                    regId: reg.id,
                                    status: 'Confirmed',
                                  })
                                }
                                leftIcon={<Check className="h-3.5 w-3.5" />}
                              >
                                Xác nhận
                              </Button>
                            </div>
                          ) : (
                            <Link to="/chats">
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                              >
                                Nhắn tin
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-meta text-neutral-600">
              Danh sách sinh viên đã xác nhận tham gia chương trình
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={confirmedRegs.length === 0}
              onClick={handleExportCsv}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Xuất CSV điểm danh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {confirmedRegs.map((r) => (
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
                    {r.slotName ? ` · ${r.slotName}` : ''}
                  </div>
                </div>
                <Link to="/chats">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                  >
                    Nhắn tin
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-meta text-neutral-600">
              Thông báo gửi tới toàn bộ sinh viên đã xác nhận tham gia (Tối đa 5 thông báo/ngày)
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAnnOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Tạo thông báo mới
            </Button>
          </div>
          {announcements.map((ann) => (
            <Card key={ann.id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">{ann.title}</h3>
                <span className="text-caption text-neutral-500">
                  {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-sm text-neutral-700">{ann.body}</p>
              <div className="text-caption text-neutral-500">
                Đã gửi tới {ann.recipientCount} người tham gia
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="coorganizers" className="space-y-3">
          {prog.coOrganizers.length === 0 ? (
            <EmptyState
              title="Chưa có đồng tổ chức"
              description="Bạn là người điều phối chính của kênh chương trình này."
            />
          ) : (
            prog.coOrganizers.map((co) => (
              <Card
                key={co.userId}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {co.fullName} ({co.studentCode})
                  </div>
                </div>
                <StatusBadge group="coOrganizer" status={co.status} />
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* PG7 Announcement Dialog */}
      <Dialog open={annOpen} onOpenChange={setAnnOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đăng thông báo chung cho người tham gia</DialogTitle>
            <DialogDescription>
              Thông báo sẽ hiển thị trên trang chi tiết kênh và gửi thông báo tới{' '}
              {prog.confirmedCount} sinh viên đã xác nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-3">
            <div>
              <label className="block text-caption font-semibold text-neutral-700 mb-1">
                Tiêu đề thông báo *
              </label>
              <Input
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="VD: Cập nhật vị trí tập trung & tài liệu chuẩn bị"
              />
            </div>
            <div>
              <label className="block text-caption font-semibold text-neutral-700 mb-1">
                Nội dung chi tiết *
              </label>
              <Textarea
                rows={4}
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Nhập hướng dẫn cho người tham gia..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAnnOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!annTitle.trim() || !annBody.trim()}
              isLoading={postAnnMutation.isPending}
              onClick={() => postAnnMutation.mutate()}
            >
              Gửi thông báo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramManagePage;
