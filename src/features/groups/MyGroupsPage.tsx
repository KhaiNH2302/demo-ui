import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users, Plus, Settings, ArrowRight, Clock } from 'lucide-react';
import type { Group, GroupJoinRequest } from '@/types/entities';

export const MyGroupsPage: React.FC = () => {
  const navigate = useNavigate();

  const ownedGroupsQuery = useQuery({
    queryKey: queryKeys.groups.mine('owner'),
    queryFn: () => apiClient.get<Group[]>('/groups/mine?role=owner'),
  });

  const memberGroupsQuery = useQuery({
    queryKey: queryKeys.groups.mine('member'),
    queryFn: () => apiClient.get<Group[]>('/groups/mine?role=member'),
  });

  const myRequestsQuery = useQuery({
    queryKey: ['join-requests', 'mine'],
    queryFn: () => apiClient.get<GroupJoinRequest[]>('/join-requests/mine'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhóm của tôi"
        description="Quản lý các nhóm bạn sở hữu, nhóm đang tham gia và theo dõi trạng thái yêu cầu gia nhập"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Tìm nhóm', href: '/groups' },
          { label: 'Nhóm của tôi' },
        ]}
        actions={
          <Button onClick={() => navigate('/groups/new')}>
            <Plus className="w-4 h-4 mr-1.5" /> Tạo nhóm mới
          </Button>
        }
      />

      <Tabs defaultValue="owner" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="owner">
            Tôi quản lý ({ownedGroupsQuery.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="member">
            Đã tham gia ({memberGroupsQuery.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Yêu cầu đã gửi ({myRequestsQuery.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Groups Owned */}
        <TabsContent value="owner" className="mt-6">
          <QueryBoundary queries={[ownedGroupsQuery]}>
            {ownedGroupsQuery.data && ownedGroupsQuery.data.length === 0 ? (
              <EmptyState
                title="Chưa quản lý nhóm nào"
                description="Bạn chưa tạo nhóm kết nối hay làm đồ án nào. Hãy bắt đầu ngay!"
                action={
                  <Button onClick={() => navigate('/groups/new')}>
                    <Plus className="w-4 h-4 mr-1.5" /> Tạo nhóm mới
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedGroupsQuery.data?.map((g) => (
                  <Card key={g.id} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="attention">Trưởng nhóm</Badge>
                        <Badge variant="neutral" className="text-xs">
                          <Users className="w-3 h-3 mr-1" /> {g.memberCount}/{g.memberLimit}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-1">{g.name}</CardTitle>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                        Chủ đề: {g.topic || 'Chung'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {g.skills.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/groups/${g.id}`)}>
                        Xem chi tiết
                      </Button>
                      <Button size="sm" onClick={() => navigate(`/groups/${g.id}/manage`)}>
                        <Settings className="w-3.5 h-3.5 mr-1" /> Quản lý
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* Tab 2: Groups Joined */}
        <TabsContent value="member" className="mt-6">
          <QueryBoundary queries={[memberGroupsQuery]}>
            {memberGroupsQuery.data && memberGroupsQuery.data.length === 0 ? (
              <EmptyState
                title="Chưa tham gia nhóm nào"
                description="Khám phá các nhóm kết nối và dự án phù hợp với kỹ năng của bạn"
                action={
                  <Button onClick={() => navigate('/groups')}>
                    Tìm nhóm phù hợp
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberGroupsQuery.data?.map((g) => (
                  <Card key={g.id} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Thành viên</Badge>
                        <Badge variant="neutral" className="text-xs">
                          <Users className="w-3 h-3 mr-1" /> {g.memberCount}/{g.memberLimit}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-1">{g.name}</CardTitle>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                        Chủ đề: {g.topic || 'Chung'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {g.skills.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
                      <Button size="sm" onClick={() => navigate(`/groups/${g.id}`)}>
                        Vào nhóm <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* Tab 3: My Join Requests */}
        <TabsContent value="requests" className="mt-6">
          <QueryBoundary queries={[myRequestsQuery]}>
            {myRequestsQuery.data && myRequestsQuery.data.length === 0 ? (
              <EmptyState
                title="Không có yêu cầu nào"
                description="Bạn chưa gửi yêu cầu tham gia vào nhóm nào."
              />
            ) : (
              <div className="space-y-4">
                {myRequestsQuery.data?.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Mã nhóm: {req.groupId}</span>
                          <StatusBadge status={req.status} domain="groups" />
                        </div>
                        {req.message && (
                          <p className="text-sm text-[var(--text-muted)]">
                            Lời nhắn: "{req.message}"
                          </p>
                        )}
                        <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Gửi lúc: {new Date(req.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/groups/${req.groupId}`)}>
                        Xem nhóm
                      </Button>
                    </CardContent>
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

export default MyGroupsPage;
