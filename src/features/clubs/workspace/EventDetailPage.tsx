import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField } from '@/components/shared/FormField';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  Plus,
  CheckSquare,
  Award,
  AlertCircle,
} from 'lucide-react';
import type { ClubEvent, EventRegistration, EventTask, ClubMembership } from '@/types/entities';

interface EventDetailData extends ClubEvent {
  registrations: EventRegistration[];
  tasks: EventTask[];
}

export const ClubEventDetailPage: React.FC = () => {
  const { clubId, eventId } = useParams<{ clubId: string; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');
  const isManager = role === 'manager';

  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ assigneeId: '', title: '', note: '' });
  const [isFinishEventOpen, setIsFinishEventOpen] = useState(false);
  const [evaluationNote, setEvaluationNote] = useState('');

  const eventQuery = useQuery({
    queryKey: ['clubs', clubId, 'events', eventId],
    queryFn: () => apiClient.get<EventDetailData>(`/clubs/${clubId}/events/${eventId}`),
    enabled: !!clubId && !!eventId,
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.clubs.members(clubId!),
    queryFn: () => apiClient.get<ClubMembership[]>(`/clubs/${clubId}/members`),
    enabled: !!clubId && isManager,
  });

  const checkinMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      apiClient.post(`/clubs/${clubId}/events/${eventId}/checkin/${targetUserId}`),
    onSuccess: () => {
      toast.success('Điểm danh thành công!');
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'events', eventId] });
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/clubs/${clubId}/events/${eventId}/tasks`, taskForm),
    onSuccess: () => {
      toast.success('Đã giao nhiệm vụ thành công!');
      setIsAssignTaskOpen(false);
      setTaskForm({ assigneeId: '', title: '', note: '' });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'events', eventId] });
    },
  });

  const finishEventMutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/clubs/${clubId}/events/${eventId}`, {
        status: 'Finished',
        description: `${eventQuery.data?.description || ''}\n\n[Tổng kết]: ${evaluationNote}`,
      }),
    onSuccess: () => {
      toast.success('Đã kết thúc và lưu đánh giá sự kiện!');
      setIsFinishEventOpen(false);
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'events', eventId] });
    },
  });

  const event = eventQuery.data;
  const isUserRegistered = event?.registrations.some((r) => r.userId === user?.id);
  const userRegistration = event?.registrations.find((r) => r.userId === user?.id);
  const isCheckedIn = userRegistration?.checkedIn;
  const myTasks = event?.tasks.filter((t) => t.assigneeId === user?.id) || [];

  return (
    <QueryBoundary queries={[eventQuery]}>
      {event && (
        <div className="space-y-6">
          <PageHeader
            title={event.title}
            description={`Địa điểm: ${event.location}`}
            breadcrumbs={[
              { label: 'CLB', href: `/clubs/${clubId}` },
              { label: 'Sự kiện', href: `/clubs/${clubId}/workspace/events` },
              { label: event.title },
            ]}
            actions={
              isManager && event.status !== 'Finished' ? (
                <Button variant="danger" size="sm" onClick={() => setIsFinishEventOpen(true)}>
                  Kết thúc & Tổng kết sự kiện
                </Button>
              ) : null
            }
          />

          {/* Event Overview Hero */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      event.status === 'Ongoing'
                        ? 'attention'
                        : event.status === 'Published'
                        ? 'success'
                        : 'neutral'
                    }
                  >
                    {event.status === 'Ongoing'
                      ? 'Đang diễn ra'
                      : event.status === 'Published'
                      ? 'Sắp diễn ra'
                      : 'Đã kết thúc'}
                  </Badge>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {event.registrations.length}/{event.capacity} người đăng ký
                  </span>
                </div>

                {/* Member Checkin CTA */}
                {event.status === 'Ongoing' && isUserRegistered && !isCheckedIn && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => user && checkinMutation.mutate(user.id)}
                    loading={checkinMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Điểm danh ngay
                  </Button>
                )}
                {isCheckedIn && (
                  <Badge variant="success" className="text-xs py-1">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã điểm danh
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>
                    Bắt đầu: {new Date(event.startAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>
                    Kết thúc: {new Date(event.endAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Địa điểm: {event.location}</span>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-semibold text-sm mb-1">Mô tả sự kiện:</h4>
                <p className="text-sm text-[var(--text-muted)] whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Manager Sub-tabs or Member View */}
          {isManager ? (
            <Tabs defaultValue="attendees" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="attendees">
                  Người tham dự ({event.registrations.length})
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  Nhiệm vụ ({event.tasks.length})
                </TabsTrigger>
                <TabsTrigger value="plan">Kế hoạch chi tiết</TabsTrigger>
              </TabsList>

              {/* Attendees */}
              <TabsContent value="attendees" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.registrations.map((reg) => (
                    <Card key={reg.userId}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <UserMiniCard userId={reg.userId} showMajor />
                        {reg.checkedIn ? (
                          <Badge variant="success">Đã điểm danh</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => checkinMutation.mutate(reg.userId)}
                          >
                            Điểm danh hộ
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Tasks */}
              <TabsContent value="tasks" className="mt-6 space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setIsAssignTaskOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" /> Giao nhiệm vụ
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.tasks.map((task) => (
                    <Card key={task.id}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{task.title}</CardTitle>
                          <Badge variant="neutral">{task.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {task.note && <p className="text-xs text-[var(--text-muted)]">{task.note}</p>}
                        <div className="pt-2 border-t border-[var(--border-subtle)]">
                          <span className="text-xs text-[var(--text-subtle)] block mb-1">Người phụ trách:</span>
                          <UserMiniCard userId={task.assigneeId} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Plan */}
              <TabsContent value="plan" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-[var(--text-muted)]">
                      Kế hoạch chuẩn bị và phân công hậu cần cho sự kiện {event.title}.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            /* Member Task View */
            myTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" /> Nhiệm vụ của bạn trong sự kiện này
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myTasks.map((t) => (
                    <div key={t.id} className="p-3 border border-[var(--border-subtle)] rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{t.title}</div>
                        {t.note && <p className="text-xs text-[var(--text-muted)]">{t.note}</p>}
                      </div>
                      <Badge variant="secondary">{t.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          )}

          {/* Assign Task Dialog */}
          <Dialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Giao nhiệm vụ cho thành viên</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <FormField label="Chọn thành viên" required>
                  <Select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    options={(membersQuery.data || []).map((m) => ({
                      label: `Thành viên ID: ${m.userId}`,
                      value: m.userId,
                    }))}
                  />
                </FormField>
                <FormField label="Tiêu đề nhiệm vụ" required>
                  <Input
                    placeholder="Ví dụ: Chuẩn bị âm thanh, Chụp ảnh sự kiện..."
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                </FormField>
                <FormField label="Ghi chú chi tiết">
                  <Textarea
                    rows={3}
                    placeholder="Mô tả cụ thể yêu cầu và hạn chót..."
                    value={taskForm.note}
                    onChange={(e) => setTaskForm({ ...taskForm, note: e.target.value })}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignTaskOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={() => assignTaskMutation.mutate()} loading={assignTaskMutation.isPending}>
                  Giao việc
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Finish Event Dialog */}
          <Dialog open={isFinishEventOpen} onOpenChange={setIsFinishEventOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kết thúc & Đánh giá sự kiện</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-[var(--text-muted)]">
                  Xác nhận chuyển trạng thái sự kiện thành <strong>Đã kết thúc</strong>. Hãy nhập nội dung tổng kết và đánh giá hiệu quả tổ chức:
                </p>
                <Textarea
                  rows={4}
                  placeholder="Ghi chú kết quả đạt được, số lượng tham gia thực tế, ưu khuyết điểm..."
                  value={evaluationNote}
                  onChange={(e) => setEvaluationNote(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFinishEventOpen(false)}>
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  onClick={() => finishEventMutation.mutate()}
                  loading={finishEventMutation.isPending}
                >
                  Xác nhận kết thúc
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </QueryBoundary>
  );
};

export default ClubEventDetailPage;
