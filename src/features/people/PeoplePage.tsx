import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserSearch,
  Search,
  UserPlus,
  UserCheck,
  MessageCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/components/ui/Toast';
import type { User } from '@/types/entities';

interface PersonItem extends User {
  isFollowing?: boolean;
  sharedTags?: string[];
  mutualConnectionsCount?: number;
}

export const PeoplePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries for the 3 tabs
  const { data: suggested, isLoading: isSugLoading } = useQuery<PersonItem[]>({
    queryKey: ['users', 'suggested'],
    queryFn: () => apiClient.get('/users/suggested'),
  });

  const { data: following, isLoading: isFolLoading } = useQuery<PersonItem[]>({
    queryKey: ['users', 'following'],
    queryFn: () => apiClient.get('/users/me/following'),
    enabled: activeTab === 'following',
  });

  const { data: followers, isLoading: isFersLoading } = useQuery<PersonItem[]>({
    queryKey: ['users', 'followers'],
    queryFn: () => apiClient.get('/users/me/followers'),
    enabled: activeTab === 'followers',
  });

  const followMutation = useMutation({
    mutationFn: ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
      isFollowing ? apiClient.delete(`/users/${userId}/follow`) : apiClient.post(`/users/${userId}/follow`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: variables.isFollowing ? 'Đã hủy theo dõi' : 'Đã theo dõi thành công',
        description: variables.isFollowing
          ? 'Bạn sẽ không còn nhận thông báo bài viết mới từ bạn này.'
          : 'Bài viết và hoạt động của bạn này sẽ xuất hiện trên bảng tin của bạn.',
      });
    },
  });

  const majors = [
    { key: 'all', label: 'Tất cả chuyên ngành' },
    { key: 'SE', label: 'Kỹ thuật phần mềm (SE)' },
    { key: 'AI', label: 'Trí tuệ nhân tạo (AI)' },
    { key: 'IA', label: 'An toàn thông tin (IA)' },
    { key: 'GD', label: 'Thiết kế mỹ thuật số (GD)' },
  ];

  const renderPersonCard = (person: PersonItem) => (
    <div
      key={person.id}
      className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-xs"
    >
      <div className="flex items-start gap-3.5">
        <UserAvatar user={person} size="lg" linkToProfile />
        <div className="min-w-0 flex-1">
          <Link
            to={`/users/${person.id}`}
            className="font-bold text-base text-neutral-900 hover:text-brand-600 truncate block leading-tight"
          >
            {person.fullName}
          </Link>
          <span className="text-xs text-neutral-500 block truncate mt-0.5">
            {person.studentCode || 'Sinh viên'} • {person.school || 'Đại học FPT'}
          </span>

          {person.roles && person.roles.includes('mentor') && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
              <GraduationCap size={12} />
              <span>Mentor SCS</span>
            </span>
          )}
        </div>
      </div>

      {person.sharedTags && person.sharedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {person.sharedTags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50 text-brand-700"
            >
              <Sparkles size={11} className="text-brand-500" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
        <button
          type="button"
          onClick={() =>
            followMutation.mutate({ userId: person.id, isFollowing: !!person.isFollowing })
          }
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
            person.isFollowing
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
          }`}
        >
          {person.isFollowing ? (
            <>
              <UserCheck size={14} />
              <span>Đang theo dõi</span>
            </>
          ) : (
            <>
              <UserPlus size={14} />
              <span>Theo dõi</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/chats')}
          className="p-2 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors shadow-xs"
          title="Nhắn tin trò chuyện"
        >
          <MessageCircle size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={UserSearch}
        title="Kết nối sinh viên"
        description="Tìm kiếm bạn học cùng chuyên ngành, cùng môn học hoặc kết nối với các bạn sinh viên tài năng"
      />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          <TabsList className="bg-neutral-100 p-1 rounded-xl">
            <TabsTrigger value="suggested" className="rounded-lg text-xs font-semibold">
              Gợi ý cho bạn
            </TabsTrigger>
            <TabsTrigger value="search" className="rounded-lg text-xs font-semibold">
              Tìm kiếm & Bộ lọc
            </TabsTrigger>
            <TabsTrigger value="following" className="rounded-lg text-xs font-semibold">
              Đang theo dõi
            </TabsTrigger>
            <TabsTrigger value="followers" className="rounded-lg text-xs font-semibold">
              Người theo dõi
            </TabsTrigger>
          </TabsList>

          {/* Major Filter */}
          {activeTab === 'search' && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {majors.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMajor(m.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    selectedMajor === m.key
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB: Gợi ý cho bạn */}
        <TabsContent value="suggested" className="mt-0">
          {isSugLoading ? (
            <LoadingSkeleton count={6} />
          ) : !suggested || suggested.length === 0 ? (
            <EmptyState title="Không có gợi ý mới" description="Hãy hoàn thiện thông tin môn học và kỹ năng trong hồ sơ để nhận thêm gợi ý phù hợp." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggested.map(renderPersonCard)}
            </div>
          )}
        </TabsContent>

        {/* TAB: Tìm kiếm & Lọc */}
        <TabsContent value="search" className="mt-0 space-y-6">
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo họ tên, mã số sinh viên, môn học..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-300 bg-white text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(suggested || [])
              .filter(
                (p) =>
                  !searchQuery ||
                  p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.studentCode && p.studentCode.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map(renderPersonCard)}
          </div>
        </TabsContent>

        {/* TAB: Đang theo dõi */}
        <TabsContent value="following" className="mt-0">
          {isFolLoading ? (
            <LoadingSkeleton count={3} />
          ) : !following || following.length === 0 ? (
            <EmptyState
              title="Bạn chưa theo dõi ai"
              description="Khám phá các bạn sinh viên và Mentor để bấm Theo dõi nhé."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {following.map(renderPersonCard)}
            </div>
          )}
        </TabsContent>

        {/* TAB: Người theo dõi */}
        <TabsContent value="followers" className="mt-0">
          {isFersLoading ? (
            <LoadingSkeleton count={3} />
          ) : !followers || followers.length === 0 ? (
            <EmptyState
              title="Chưa có người theo dõi"
              description="Hãy tích cực chia sẻ bài viết trên Knowledge Sharing để thu hút người theo dõi nhé."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {followers.map(renderPersonCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PeoplePage;
