import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserSearch,
  Users,
  UserCheck,
  Clock,
  Check,
  X,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { FollowButton } from '@/components/shared/FollowButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/format';
import type { User, Follow } from '@/types/entities';

interface SuggestedUser extends User {
  isFollowing?: boolean;
  sharedTags?: string[];
  mutualConnectionsCount?: number;
}

export const PeoplePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'suggested';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [q, setQ] = useState('');
  const [major, setMajor] = useState('all');
  const [cohort, setCohort] = useState('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  const suggestedQuery = useQuery<SuggestedUser[]>({
    queryKey: ['people', 'suggested', q, major, cohort],
    queryFn: () =>
      apiClient.get('/users/suggested', {
        params: { q, major, cohort },
      }),
  });

  const followingQuery = useQuery<SuggestedUser[]>({
    queryKey: ['people', 'following'],
    queryFn: () => apiClient.get('/users/me/following'),
  });

  const followersQuery = useQuery<SuggestedUser[]>({
    queryKey: ['people', 'followers'],
    queryFn: () => apiClient.get('/users/me/followers'),
  });

  const requestsQuery = useQuery<{ incoming: Follow[]; outgoing: Follow[] }>({
    queryKey: ['people', 'requests'],
    queryFn: () => apiClient.get('/follow-requests'),
  });

  const respondFollowMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) =>
      apiClient.put(`/follow-requests/${id}/respond`, { action }),
    onSuccess: (_, variables) => {
      toast({
        variant: 'success',
        title:
          variables.action === 'accept'
            ? 'Đã chấp nhận yêu cầu theo dõi'
            : 'Đã từ chối yêu cầu theo dõi',
      });
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });

  const incomingRequests = requestsQuery.data?.incoming || [];
  const outgoingRequests = requestsQuery.data?.outgoing || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kết nối sinh viên"
        description="Tìm bạn học cùng ngành, cùng môn học hoặc cùng hoạt động ngoại khóa và quản lý danh sách theo dõi."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="suggested">Gợi ý kết nối</TabsTrigger>
          <TabsTrigger value="following">
            Đang theo dõi ({followingQuery.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Người theo dõi ({followersQuery.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Yêu cầu theo dõi
            {incomingRequests.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {incomingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Gợi ý kết nối */}
        <TabsContent value="suggested" className="space-y-5 pt-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <SearchInput
                  value={q}
                  onChange={setQ}
                  placeholder="Tìm theo họ tên, MSSV hoặc chuyên ngành..."
                />
              </div>
              <Select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                options={[
                  { value: 'all', label: 'Tất cả chuyên ngành' },
                  { value: 'Kỹ thuật phần mềm', label: 'Kỹ thuật phần mềm' },
                  { value: 'Trí tuệ nhân tạo', label: 'Trí tuệ nhân tạo' },
                  { value: 'An toàn thông tin', label: 'An toàn thông tin' },
                  { value: 'Thiết kế mỹ thuật số', label: 'Thiết kế mỹ thuật số' },
                  { value: 'Quản trị kinh doanh', label: 'Quản trị kinh doanh' },
                ]}
              />
              <Select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                options={[
                  { value: 'all', label: 'Tất cả khóa' },
                  { value: 'K17', label: 'Khóa K17' },
                  { value: 'K18', label: 'Khóa K18' },
                  { value: 'K19', label: 'Khóa K19' },
                  { value: 'K20', label: 'Khóa K20' },
                ]}
              />
            </div>
          </Card>

          {suggestedQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-5 h-44 animate-pulse bg-neutral-100" />
              ))}
            </div>
          ) : (suggestedQuery.data || []).length === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="Không tìm thấy sinh viên phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc chuyên ngành."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(suggestedQuery.data || []).map((student) => (
                <Card
                  key={student.id}
                  className="p-5 flex flex-col justify-between gap-4 hover:border-neutral-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Link to={`/users/${student.id}`} className="shrink-0">
                        <Avatar src={student.avatarUrl} name={student.fullName} size="lg" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/users/${student.id}`}
                          className="text-sm font-semibold text-neutral-900 hover:text-brand-600 transition-colors line-clamp-1"
                        >
                          {student.fullName}
                        </Link>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {student.studentCode || 'HE180000'} · {student.major || 'Kỹ thuật phần mềm'}{' '}
                          {student.cohort ? `(${student.cohort})` : ''}
                        </p>
                        {student.roles.includes('mentor') && (
                          <div className="mt-1">
                            <Badge tier="brand" size="sm">
                              Mentor học thuật
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {student.sharedTags && student.sharedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {student.sharedTags.map((tag) => (
                          <Badge key={tag} tier="neutral" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/users/${student.id}`}
                      className="text-xs font-medium text-neutral-600 hover:text-brand-600"
                    >
                      Xem hồ sơ
                    </Link>
                    <FollowButton
                      userId={student.id}
                      initialState={student.isFollowing ? 'following' : 'none'}
                      size="sm"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Đang theo dõi */}
        <TabsContent value="following" className="pt-4">
          {(followingQuery.data || []).length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Bạn chưa theo dõi sinh viên nào"
              description="Khám phá tab Gợi ý kết nối để theo dõi bạn học cùng trường."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(followingQuery.data || []).map((student) => (
                <Card key={student.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to={`/users/${student.id}`}>
                      <Avatar src={student.avatarUrl} name={student.fullName} size="md" />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to={`/users/${student.id}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-brand-600 truncate block"
                      >
                        {student.fullName}
                      </Link>
                      <p className="text-xs text-neutral-500 truncate">
                        {student.studentCode} · {student.major || 'Kỹ thuật phần mềm'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to="/chats">
                      <Button variant="outline" size="sm" leftIcon={<MessageSquare size={14} />}>
                        Nhắn tin
                      </Button>
                    </Link>
                    <FollowButton userId={student.id} initialState="following" size="sm" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Người theo dõi */}
        <TabsContent value="followers" className="pt-4">
          {(followersQuery.data || []).length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có người theo dõi"
              description="Khi các sinh viên khác theo dõi hồ sơ của bạn, danh sách sẽ hiển thị tại đây."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(followersQuery.data || []).map((student) => (
                <Card key={student.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to={`/users/${student.id}`}>
                      <Avatar src={student.avatarUrl} name={student.fullName} size="md" />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to={`/users/${student.id}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-brand-600 truncate block"
                      >
                        {student.fullName}
                      </Link>
                      <p className="text-xs text-neutral-500 truncate">
                        {student.studentCode} · {student.major || 'Kỹ thuật phần mềm'}
                      </p>
                    </div>
                  </div>
                  <FollowButton
                    userId={student.id}
                    initialState={student.isFollowing ? 'following' : 'follows_you'}
                    size="sm"
                  />
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Yêu cầu theo dõi */}
        <TabsContent value="requests" className="space-y-6 pt-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Yêu cầu theo dõi gửi đến bạn ({incomingRequests.length})
            </h3>
            {incomingRequests.length === 0 ? (
              <Card className="p-6 text-center text-xs text-neutral-500">
                Hiện không có yêu cầu theo dõi nào đang chờ bạn phê duyệt.
              </Card>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <Card
                    key={req.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Link to={`/users/${req.followerId}`}>
                        <Avatar src={req.followerAvatar} name={req.followerName} size="md" />
                      </Link>
                      <div>
                        <Link
                          to={`/users/${req.followerId}`}
                          className="text-sm font-semibold text-neutral-900 hover:text-brand-600"
                        >
                          {req.followerName}
                        </Link>
                        <p className="text-xs text-neutral-500">
                          {req.followerMeta || 'Sinh viên ĐH FPT'} · Gửi{' '}
                          {formatRelativeTime(req.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Check size={14} />}
                        loading={respondFollowMutation.isPending}
                        onClick={() =>
                          respondFollowMutation.mutate({ id: req.id, action: 'accept' })
                        }
                      >
                        Chấp nhận
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<X size={14} />}
                        loading={respondFollowMutation.isPending}
                        onClick={() =>
                          respondFollowMutation.mutate({ id: req.id, action: 'decline' })
                        }
                      >
                        Từ chối
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              Yêu cầu bạn đã gửi ({outgoingRequests.length})
            </h3>
            {outgoingRequests.length === 0 ? (
              <Card className="p-6 text-center text-xs text-neutral-500">
                Bạn không có yêu cầu theo dõi nào đang chờ phản hồi.
              </Card>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <Card
                    key={req.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Link to={`/users/${req.followeeId}`}>
                        <Avatar src={req.followeeAvatar} name={req.followeeName} size="md" />
                      </Link>
                      <div>
                        <Link
                          to={`/users/${req.followeeId}`}
                          className="text-sm font-semibold text-neutral-900 hover:text-brand-600"
                        >
                          {req.followeeName}
                        </Link>
                        <p className="text-xs text-neutral-500">
                          {req.followeeMeta || 'Sinh viên ĐH FPT'} · Đã gửi{' '}
                          {formatRelativeTime(req.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge tier="pending" size="sm">
                      <Clock size={12} className="mr-1" /> Đang chờ chấp nhận
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PeoplePage;
