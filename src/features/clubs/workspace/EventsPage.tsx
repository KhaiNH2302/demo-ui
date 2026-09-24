import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { Calendar, Plus, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import type { ClubEvent } from '@/types/entities';

export const ClubEventsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');
  const isManager = role === 'manager';

  const [tab, setTab] = useState<'upcoming' | 'ongoing' | 'finished'>('upcoming');

  const eventsQuery = useQuery({
    queryKey: queryKeys.clubs.events(clubId!),
    queryFn: () => apiClient.get<ClubEvent[]>(`/clubs/${clubId}/events`),
    enabled: !!clubId,
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => apiClient.post(`/clubs/${clubId}/events/${eventId}/register`),
    onSuccess: (res: any) => {
      if (res?.registered) {
        toast.success('Đăng ký tham gia sự kiện thành công!');
      } else {
        toast.info('Đã hủy đăng ký tham gia sự kiện.');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.events(clubId!) });
    },
    onError: () => toast.error('Thao tác thất bại, vui lòng thử lại.'),
  });

  const allEvents = eventsQuery.data || [];
  const filteredEvents = allEvents.filter((e) => {
    if (tab === 'upcoming') return e.status === 'Published';
    if (tab === 'ongoing') return e.status === 'Ongoing';
    return e.status === 'Finished';
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sự kiện câu lạc bộ"
        description="Quản lý và tham gia các hoạt động, workshop, giải đấu của CLB"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Workspace', href: `/clubs/${clubId}/workspace/overview` },
          { label: 'Sự kiện' },
        ]}
        actions={
          isManager ? (
            <Button onClick={() => navigate(`/clubs/${clubId}/workspace/events/new`)}>
              <Plus className="w-4 h-4 mr-1.5" /> Tạo sự kiện mới
            </Button>
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="upcoming">Sắp diễn ra</TabsTrigger>
          <TabsTrigger value="ongoing">Đang diễn ra</TabsTrigger>
          <TabsTrigger value="finished">Đã kết thúc</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <QueryBoundary queries={[eventsQuery]}>
            {filteredEvents.length === 0 ? (
              <EmptyState
                title="Không có sự kiện nào"
                description={`Hiện tại chưa có sự kiện nào trong danh mục này.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((evt) => (
                  <Card key={evt.id} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            evt.status === 'Ongoing'
                              ? 'attention'
                              : evt.status === 'Published'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {evt.status === 'Ongoing'
                            ? 'Đang diễn ra'
                            : evt.status === 'Published'
                            ? 'Sắp diễn ra'
                            : 'Đã kết thúc'}
                        </Badge>
                        <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Sức chứa: {evt.capacity}
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2">{evt.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-[var(--text-muted)] line-clamp-3">
                        {evt.description}
                      </p>
                      <div className="pt-2 space-y-1.5 text-xs text-[var(--text-subtle)]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(evt.startAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{evt.location}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                      {evt.status !== 'Finished' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => registerMutation.mutate(evt.id)}
                          loading={registerMutation.isPending}
                        >
                          Đăng ký tham gia
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={() => navigate(`/clubs/${clubId}/workspace/events/${evt.id}`)}
                      >
                        Chi tiết <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubEventsPage;
