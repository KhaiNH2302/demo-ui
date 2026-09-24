import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { CheckSquare, Clock } from 'lucide-react';
import type { EventTask } from '@/types/entities';

export const ClubTasksPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const queryClient = useQueryClient();
  const { user, getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');
  const isManager = role === 'manager';

  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  const tasksQuery = useQuery({
    queryKey: ['clubs', clubId, 'tasks'],
    queryFn: () => apiClient.get<EventTask[]>(`/clubs/${clubId}/tasks`),
    enabled: !!clubId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<EventTask> }) =>
      apiClient.put<EventTask>(`/tasks/${taskId}`, updates),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái nhiệm vụ thành công!');
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'tasks'] });
    },
  });

  const allTasks = tasksQuery.data || [];
  const visibleTasks = isManager
    ? filterAssignee === 'all'
      ? allTasks
      : allTasks.filter((t) => t.assigneeId === filterAssignee)
    : allTasks.filter((t) => t.assigneeId === user?.id);

  const columns = [
    {
      id: 'Todo',
      title: 'Chờ thực hiện',
      badgeVariant: 'neutral' as const,
      items: visibleTasks.filter((t) => t.status === 'Todo'),
    },
    {
      id: 'InProgress',
      title: 'Đang làm',
      badgeVariant: 'attention' as const,
      items: visibleTasks.filter((t) => t.status === 'InProgress'),
    },
    {
      id: 'Done',
      title: 'Đã hoàn thành',
      badgeVariant: 'success' as const,
      items: visibleTasks.filter((t) => t.status === 'Done'),
    },
  ];

  const handleCardMove = (taskId: string, targetColId: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: targetColId as any },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng nhiệm vụ công việc"
        description="Theo dõi và cập nhật tiến độ các hạng mục nhiệm vụ sự kiện và hoạt động CLB"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Workspace', href: `/clubs/${clubId}/workspace/overview` },
          { label: 'Nhiệm vụ' },
        ]}
        actions={
          isManager ? (
            <div className="w-56">
              <Select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                options={[
                  { label: 'Tất cả thành viên', value: 'all' },
                  { label: 'Của tôi', value: user?.id || '' },
                ]}
              />
            </div>
          ) : null
        }
      />

      <QueryBoundary queries={[tasksQuery]}>
        <KanbanBoard
          columns={columns}
          onCardMove={handleCardMove}
          renderCard={(task: EventTask) => (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm text-[var(--text-main)]">{task.title}</span>
              </div>
              {task.note && (
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 bg-[var(--surface-muted)] p-2 rounded">
                  {task.note}
                </p>
              )}
              {isManager && (
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <UserMiniCard userId={task.assigneeId} />
                </div>
              )}
            </div>
          )}
        />
      </QueryBoundary>
    </div>
  );
};

export default ClubTasksPage;
