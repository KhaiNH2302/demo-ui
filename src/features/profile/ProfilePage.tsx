import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Lock,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Link2,
  Flag,
  Globe,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Layers,
  Heart,
  Share2,
  Bookmark,
  Plus,
  Camera,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { FollowButton, type FollowButtonState } from '@/components/shared/FollowButton';
import { ThreadFeed } from '@/components/shared/ThreadFeed';
import { EntityRow } from '@/components/shared/EntityRow';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Chip } from '@/components/ui/Chip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { apiClient } from '@/lib/apiClient';
import { maskStudentCode } from '@/lib/format';
import { cn } from '@/lib/cn';
import { seedUsers, seedProfiles } from '@/mocks/data/users';
import { seedKnowledgePosts } from '@/mocks/data/knowledge';
import { seedGroups } from '@/mocks/data/groups';
import { seedClubs } from '@/mocks/data/clubs';
import { seedProgramChannels } from '@/mocks/data/programs';
import {
  seedMentors,
  seedMentorCourses,
  seedMentorProfileSections,
  seedMentoringPosts,
} from '@/mocks/data/mentoring';
import { SendMentoringRequestDialog } from '@/features/mentoring/SendMentoringRequestDialog';
import { MentorCourseCard } from '@/components/shared/MentorCourseCard';
import { MentorProfileSectionSheet } from '@/components/shared/MentorProfileSectionSheet';
import type {
  KnowledgePost,
  StudentProfile,
  Mentor,
  MentorCourse,
  MentorPost,
  MentorProfileSection,
  Audience,
} from '@/types/entities';
import type { ProfileVisibility } from '@/types/status';
import { toast } from '@/components/ui/Toast';

import { ProfileIntroCard } from './ProfileIntroCard';
import { ProfileAboutTab, type AboutSubTabKey } from './ProfileAboutTab';
import { ProfileCompleteness } from './ProfileCompleteness';

type PreviewMode = 'self' | 'member' | 'follower_pending';

const VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  members: 'Mọi thành viên trong trường',
  followers: 'Chỉ người theo dõi đã chấp nhận',
  private: 'Chỉ mình tôi',
};

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const ProfilePage: React.FC = () => {
  const { id: routeUserId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const isMeRoute = !routeUserId || routeUserId === 'me';
  const targetUserId = isMeRoute ? currentUser?.id || 'usr_student_01' : routeUserId;
  const isOwnAccount = Boolean(currentUser && targetUserId === currentUser.id);

  // Redirect /users/:myId -> /profile/me
  useEffect(() => {
    if (!isMeRoute && isOwnAccount) {
      navigate('/profile/me', { replace: true });
    }
  }, [isMeRoute, isOwnAccount, navigate]);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'posts');
  const [aboutSubTab, setAboutSubTab] = useState<AboutSubTabKey>('overview');

  // Preview Mode ("Xem như")
  const [previewMode, setPreviewMode] = useState<PreviewMode>('self');

  // Modals state
  const [followersModal, setFollowersModal] = useState<{
    open: boolean;
    tab: 'followers' | 'following';
  }>({ open: false, tab: 'followers' });
  const [reportUserOpen, setReportUserOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Follow state for other user
  const [followState, setFollowState] = useState<FollowButtonState>('none');

  // Mentor modals and interactive states
  const [sendRequestOpen, setSendRequestOpen] = useState(false);
  const [mentorSectionsSheetOpen, setMentorSectionsSheetOpen] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>(['mpost_01']);
  const [savedPostIds, setSavedPostIds] = useState<string[]>(['mpost_02']);
  const [postSubFilter, setPostSubFilter] = useState<'published' | 'pending' | 'saved'>('published');

  // Load Profile Query
  const profileQuery = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      const endpoint = isOwnAccount ? '/profile/me' : `/users/${targetUserId}`;
      const foundUser = seedUsers.find((u) => u.id === targetUserId) || seedUsers[0];
      const foundProfile = seedProfiles[targetUserId] || seedProfiles['usr_student_01'];

      try {
        const res = await apiClient.get<any>(endpoint);
        const apiData = res && res.data ? res.data : res;
        if (apiData.user && apiData.profile) {
          return {
            user: { ...foundUser, ...apiData.user },
            profile: { ...foundProfile, ...apiData.profile } as StudentProfile,
          };
        }
        return {
          user: foundUser,
          profile: {
            ...foundProfile,
            ...(apiData.profile && typeof apiData.profile === 'object'
              ? (apiData.profile as Partial<StudentProfile>)
              : apiData),
          } as StudentProfile,
        };
      } catch {
        return {
          user: foundUser,
          profile: foundProfile,
        };
      }
    },
  });

  // Load posts
  const postsQuery = useQuery<KnowledgePost[]>({
    queryKey: ['profile-posts', targetUserId],
    queryFn: async () => {
      try {
        const all = await apiClient.get<KnowledgePost[]>('/posts');
        return all.filter((p) => p.authorId === targetUserId);
      } catch {
        return seedKnowledgePosts.filter((p) => p.authorId === targetUserId);
      }
    },
  });

  // Mentor Queries
  const mentorQuery = useQuery({
    queryKey: ['mentor-detail', targetUserId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(`/mentoring/mentors/${targetUserId}`);
        return (res && res.mentor) || seedMentors.find((m) => m.userId === targetUserId) || seedMentors[0];
      } catch {
        return seedMentors.find((m) => m.userId === targetUserId) || seedMentors[0];
      }
    },
  });

  const mentorCoursesQuery = useQuery<MentorCourse[]>({
    queryKey: ['mentor-courses', targetUserId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<MentorCourse[]>(`/mentors/${targetUserId}/courses`);
        return res;
      } catch {
        return seedMentorCourses.filter((c) => c.mentorId === targetUserId);
      }
    },
  });

  const mentorPostsQuery = useQuery<MentorPost[]>({
    queryKey: ['mentor-posts', targetUserId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<MentorPost[]>(`/mentors/${targetUserId}/posts`);
        return res;
      } catch {
        return seedMentoringPosts.filter((p) => p.mentorId === targetUserId);
      }
    },
  });

  const mentorSectionsQuery = useQuery<MentorProfileSection[]>({
    queryKey: ['mentor-profile-sections', targetUserId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<MentorProfileSection[]>(`/mentors/${targetUserId}/profile-sections`);
        return res;
      } catch {
        return seedMentorProfileSections;
      }
    },
  });

  // Enroll course mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return apiClient.post(`/mentor-courses/${courseId}/enroll`);
    },
    onSuccess: (_, courseId) => {
      setEnrolledCourseIds((prev) => [...prev, courseId]);
      queryClient.invalidateQueries({ queryKey: ['mentor-courses', targetUserId] });
      toast.success('Đã đăng ký tham gia khóa học thành công!');
    },
    onError: () => {
      toast.error('Đăng ký không thành công, vui lòng thử lại.');
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Partial<StudentProfile>) => {
      return apiClient.patch('/profile/me', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      toast.success('Đã cập nhật hồ sơ thành công');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật hồ sơ');
    },
  });

  const handleUpdateProfile = async (updates: Partial<StudentProfile>) => {
    await updateProfileMutation.mutateAsync(updates);
  };

  const handleSaveCover = async (url: string) => {
    await handleUpdateProfile({ coverUrl: url });
    updateUser({ coverUrl: url });
    setCoverModalOpen(false);
  };

  const handleSaveAvatar = async (url: string) => {
    await handleUpdateProfile({ avatarUrl: url } as any);
    updateUser({ avatarUrl: url });
    setAvatarModalOpen(false);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <LoadingSkeleton variant="detail-page" />
      </div>
    );
  }

  const userEntity = profileQuery.data?.user || seedUsers[0];
  const studentProfile: StudentProfile =
    profileQuery.data?.profile || seedProfiles['usr_student_01'];

  const visibility: ProfileVisibility =
    studentProfile?.privacy?.profileVisibility || 'members';

  const isEffectiveSelf = isOwnAccount && previewMode === 'self';

  // Permission evaluation based on view mode / follower state
  const canViewAudience = (aud: Audience = 'public'): boolean => {
    if (isOwnAccount && previewMode === 'self') return true;
    if (isOwnAccount) {
      if (previewMode === 'follower_pending') {
        return aud === 'public';
      }
      if (previewMode === 'member') {
        return aud === 'public' || aud === 'followers';
      }
    }
    if (followState === 'following') {
      return aud === 'public' || aud === 'followers';
    }
    return aud === 'public';
  };

  const isLimitedView =
    (isOwnAccount && previewMode === 'follower_pending' && visibility === 'private') ||
    (!isOwnAccount &&
      (visibility === 'private' ||
        (visibility === 'followers' && followState !== 'following')));

  const isMentor = Boolean(
    userEntity.roles?.some((r: string) => r.toLowerCase() === 'mentor') ||
      (studentProfile as any)?.isMentor ||
      targetUserId === 'usr_mentor_02'
  );
  const mentorData: Mentor | undefined = mentorQuery.data;
  const mentorCourses: MentorCourse[] = mentorCoursesQuery.data || [];
  const mentorPosts: MentorPost[] = mentorPostsQuery.data || [];
  const mentorSections: MentorProfileSection[] = mentorSectionsQuery.data || [];

  const authorPosts = postsQuery.data || [];
  const filteredPosts = isEffectiveSelf
    ? authorPosts.filter((p) => {
        if (postSubFilter === 'pending') return p.status === 'PendingReview';
        if (postSubFilter === 'saved') return Boolean(p.savedByMe);
        return p.status === 'Published';
      })
    : authorPosts.filter((p) => p.status === 'Published');

  const displayCover =
    userEntity.coverUrl ||
    studentProfile.coverUrl ||
    PRESET_COVERS[0];

  const primaryEdu =
    studentProfile.education?.find((e) => e.isCurrent) || studentProfile.education?.[0];

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* 1. Thanh thông báo chế độ Xem như (View As Banner) */}
      {isOwnAccount && previewMode !== 'self' && (
        <div className="px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary shrink-0" />
            <span className="text-neutral-800 dark:text-neutral-200">
              Bạn đang xem hồ sơ như:{' '}
              <strong className="font-semibold text-primary">
                {previewMode === 'member'
                  ? 'Người theo dõi (Xem các mục Công khai & Người theo dõi)'
                  : 'Khách / Mọi người (Chỉ xem các mục Công khai)'}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPreviewMode('self')}
            className="font-semibold text-primary hover:underline ml-2 shrink-0"
          >
            Thoát chế độ xem thử
          </button>
        </div>
      )}

      {/* 2. FACEBOOK-STYLE PROFILE HEADER */}
      <section className="bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="relative isolate aspect-[3/1] min-h-[180px] w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 sm:aspect-[3.6/1] sm:min-h-[240px] md:aspect-[4/1] md:min-h-[280px]">
          <img
            src={displayCover}
            alt="Cover"
            className="absolute inset-0 block h-full w-full object-cover object-center"
          />
          {isEffectiveSelf && (
            <button
              type="button"
              onClick={() => setCoverModalOpen(true)}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xs transition-colors hover:bg-black/75 sm:bottom-4 sm:right-4"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chỉnh sửa ảnh bìa</span>
            </button>
          )}
        </div>

        {/* Header Main Bar (Avatar + Details + Actions) */}
        <div className="px-5 sm:px-8 pb-5 pt-0">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between items-center sm:items-start lg:items-end gap-4 -mt-16 sm:-mt-20">
            {/* Left: Avatar + Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left min-w-0 flex-1">
              {/* Avatar with Camera Button */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-surface overflow-hidden shadow-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                  <UserAvatar
                    user={{
                      id: userEntity.id,
                      fullName: userEntity.fullName,
                      avatarUrl: userEntity.avatarUrl,
                    }}
                    size="xl"
                    className="w-full h-full rounded-full"
                  />
                </div>
                {isEffectiveSelf && (
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 shadow-md border-2 border-surface transition-colors cursor-pointer"
                    title="Cập nhật ảnh đại diện"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Name & Short Intro */}
              <div className="space-y-1 mb-1 min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-full">
                    {userEntity.fullName}
                  </h1>
                  {isMentor && (
                    <Badge variant="brand" className="inline-flex items-center gap-1 py-0.5 px-2">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Mentor</span>
                    </Badge>
                  )}
                </div>

                {/* Short Bio (intro <= 101 chars) */}
                {studentProfile.intro ? (
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 italic max-w-lg">
                    "{studentProfile.intro}"
                  </p>
                ) : isEffectiveSelf ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('about');
                      setAboutSubTab('overview');
                    }}
                    className="text-xs text-primary hover:underline italic"
                  >
                    + Thêm tiểu sử ngắn để giới thiệu bản thân...
                  </button>
                ) : null}

                {/* Counters: Followers / Following */}
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <button
                    type="button"
                    onClick={() => setFollowersModal({ open: true, tab: 'followers' })}
                    className="hover:underline"
                  >
                    <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {userEntity.roles?.includes('mentor') ? '126' : '42'}
                    </strong>{' '}
                    người theo dõi
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setFollowersModal({ open: true, tab: 'following' })}
                    className="hover:underline"
                  >
                    <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {userEntity.roles?.includes('mentor') ? '35' : '28'}
                    </strong>{' '}
                    đang theo dõi
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Actions Cluster */}
            <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0 pb-1 flex-wrap">
              {isOwnAccount ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveTab('about');
                      setAboutSubTab('overview');
                    }}
                    leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  >
                    Chỉnh sửa hồ sơ
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Xem như ▾
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewMode('self')}>
                        Chính tôi (Đầy đủ & Sửa)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPreviewMode('member')}>
                        Người theo dõi (Followers)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPreviewMode('follower_pending')}>
                        Khách / Mọi người (Chỉ công khai)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Tùy chọn khác"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href);
                          toast.success('Đã sao chép liên kết hồ sơ');
                        }}
                      >
                        <Link2 className="w-3.5 h-3.5 mr-2" />
                        <span>Sao chép liên kết hồ sơ</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {isMentor && (
                    <Button
                      size="sm"
                      onClick={() => setSendRequestOpen(true)}
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Kết nối Mentor
                    </Button>
                  )}

                  <FollowButton
                    userId={userEntity.id}
                    initialState={followState}
                    onChangeState={setFollowState}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/chats?targetUser=${userEntity.id}`)}
                    leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  >
                    Nhắn tin
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href);
                          toast.success('Đã sao chép liên kết hồ sơ');
                        }}
                      >
                        <Link2 className="w-3.5 h-3.5 mr-2" />
                        <span>Sao chép liên kết</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setReportUserOpen(true)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Flag className="w-3.5 h-3.5 mr-2" />
                        <span>Báo cáo người dùng</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROFILE COMPLETENESS (Chỉ hiển thị cho chủ sở hữu khi ở chế độ self) */}
      {isEffectiveSelf && (
        <ProfileCompleteness
          profile={studentProfile}
          user={userEntity}
          onNavigateSection={(sec) => {
            setActiveTab('about');
            setAboutSubTab(sec as AboutSubTabKey);
          }}
        />
      )}

      {/* 4. MAIN TABS (Bài viết | Giới thiệu | Khóa học (mentor) | Hoạt động) */}
      {isLimitedView ? (
        <EmptyState
          icon={Lock}
          title={
            visibility === 'private'
              ? 'Hồ sơ này đang ở chế độ riêng tư'
              : 'Hồ sơ chỉ hiển thị đầy đủ cho người theo dõi'
          }
          description={
            visibility === 'private'
              ? 'Chỉ chủ tài khoản mới xem được thông tin chi tiết.'
              : `Theo dõi ${userEntity.fullName} để mở khóa toàn bộ bài viết và thông tin học vụ.`
          }
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-surface border border-neutral-200 dark:border-neutral-700/80 p-1 rounded-2xl w-full sm:w-auto inline-flex overflow-x-auto max-w-full scrollbar-none">
            <TabsTrigger value="posts" className="rounded-xl px-4 py-2 text-xs font-semibold shrink-0">
              Bài viết ({isMentor ? mentorPosts.length : authorPosts.length})
            </TabsTrigger>
            <TabsTrigger value="about" className="rounded-xl px-4 py-2 text-xs font-semibold shrink-0">
              Giới thiệu
            </TabsTrigger>
            {isMentor && (
              <TabsTrigger value="courses" className="rounded-xl px-4 py-2 text-xs font-semibold shrink-0">
                Khóa học ({mentorCourses.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="activities" className="rounded-xl px-4 py-2 text-xs font-semibold shrink-0">
              Hoạt động
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BÀI VIẾT (2 cột kiểu Facebook) */}
          <TabsContent value="posts" className="pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* CỘT TRÁI (4 cols): Thẻ Giới thiệu Facebook (ProfileIntroCard) */}
              <div className="lg:col-span-5 space-y-4">
                <ProfileIntroCard
                  profile={studentProfile}
                  user={userEntity}
                  isOwner={isEffectiveSelf}
                  canViewAudience={canViewAudience}
                  onUpdateProfile={handleUpdateProfile}
                  onNavigateToAboutTab={(sec) => {
                    setActiveTab('about');
                    setAboutSubTab(sec as AboutSubTabKey);
                  }}
                />
              </div>

              {/* CỘT PHẢI (7 cols): Feed bài viết */}
              <div className="lg:col-span-7 space-y-4">
                {isEffectiveSelf && (
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-surface shadow-sm">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {isMentor
                        ? 'Chia sẻ bài viết kiến thức, mẹo làm đồ án hoặc kinh nghiệm thực tập.'
                        : 'Chia sẻ thắc mắc học tập, tìm đối tác đổi lớp hoặc thảo luận đồ án.'}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(isMentor ? '/mentor/posts' : '/knowledge')}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Đăng bài
                    </Button>
                  </div>
                )}

                {/* Subfilter tabs if owner */}
                {isEffectiveSelf && !isMentor && (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs w-fit">
                    <button
                      type="button"
                      onClick={() => setPostSubFilter('published')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        postSubFilter === 'published' ? 'bg-surface shadow-xs text-primary font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      Đã xuất bản ({authorPosts.filter((p) => p.status === 'Published').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostSubFilter('pending')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        postSubFilter === 'pending' ? 'bg-surface shadow-xs text-primary font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      Chờ duyệt ({authorPosts.filter((p) => p.status === 'PendingReview').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostSubFilter('saved')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        postSubFilter === 'saved' ? 'bg-surface shadow-xs text-primary font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      Đã lưu ({authorPosts.filter((p) => p.savedByMe).length})
                    </button>
                  </div>
                )}

                {/* Feed content */}
                {isMentor ? (
                  mentorPosts.length === 0 ? (
                    <EmptyState
                      title="Chưa có bài chia sẻ nào"
                      description={
                        isEffectiveSelf
                          ? 'Hãy viết bài chia sẻ đầu tiên để các bạn sinh viên cùng học hỏi!'
                          : `${userEntity.fullName} chưa đăng bài chia sẻ nào.`
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      {mentorPosts.map((post) => {
                        const isLiked = likedPostIds.includes(post.id);
                        const isSaved = savedPostIds.includes(post.id);
                        return (
                          <div
                            key={post.id}
                            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-surface shadow-sm space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <UserAvatar
                                  user={{
                                    id: userEntity.id,
                                    fullName: userEntity.fullName,
                                    avatarUrl: userEntity.avatarUrl,
                                  }}
                                  size="md"
                                  className="ring-1 ring-primary"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                      {userEntity.fullName}
                                    </span>
                                    <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                                      Mentor
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <span>{post.field || 'Kỹ thuật phần mềm'}</span>
                                    <span>·</span>
                                    <span>2 ngày trước</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Bài chia sẻ
                              </Badge>
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                                {post.title}
                              </h3>
                              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                                {post.contentMd}
                              </p>
                            </div>

                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {post.tags.map((t) => (
                                  <Chip key={t} size="sm">
                                    #{t}
                                  </Chip>
                                ))}
                              </div>
                            )}

                            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLikedPostIds((prev) =>
                                      isLiked ? prev.filter((id) => id !== post.id) : [...prev, post.id]
                                    )
                                  }
                                  className={`flex items-center gap-1.5 transition-colors ${
                                    isLiked ? 'text-red-500 font-semibold' : 'hover:text-neutral-800'
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                  <span>{((post as any).likeCount ?? 0) + (isLiked ? 1 : 0)} Thích</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSavedPostIds((prev) =>
                                      isSaved ? prev.filter((id) => id !== post.id) : [...prev, post.id]
                                    )
                                  }
                                  className={`flex items-center gap-1.5 transition-colors ${
                                    isSaved ? 'text-primary font-semibold' : 'hover:text-neutral-800'
                                  }`}
                                >
                                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                  <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(window.location.href);
                                  toast.success('Đã sao chép liên kết bài viết');
                                }}
                                className="flex items-center gap-1.5 hover:text-neutral-800 transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                                <span>Chia sẻ</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : filteredPosts.length === 0 ? (
                  <EmptyState
                    title="Chưa có bài viết nào"
                    description={
                      isEffectiveSelf
                        ? 'Bạn chưa xuất bản bài viết nào. Hãy chia sẻ kiến thức đầu tiên của bạn!'
                        : `${userEntity.fullName} chưa xuất bản bài viết nào.`
                    }
                  />
                ) : (
                  <ThreadFeed posts={filteredPosts} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: GIỚI THIỆU (Facebook submenu & inline edit) */}
          <TabsContent value="about" className="pt-2">
            <ProfileAboutTab
              profile={studentProfile}
              user={userEntity}
              isOwner={isEffectiveSelf}
              canViewAudience={canViewAudience}
              onUpdateProfile={handleUpdateProfile}
              activeSubTab={aboutSubTab}
              onSubTabChange={setAboutSubTab}
              isMentor={isMentor}
              mentorSections={mentorSections}
              onOpenAddMentorSection={() => setMentorSectionsSheetOpen(true)}
              onOpenEditMentorSection={() => setMentorSectionsSheetOpen(true)}
            />
          </TabsContent>

          {/* TAB 3: KHÓA HỌC (MENTOR) */}
          {isMentor && (
            <TabsContent value="courses" className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Khóa học & Lớp hướng dẫn
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Các khóa học do {userEntity.fullName} trực tiếp tổ chức và đồng hành cùng sinh viên.
                  </p>
                </div>
                {isEffectiveSelf && (
                  <Button size="sm" onClick={() => navigate('/mentor/courses')} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Tạo khóa mới
                  </Button>
                )}
              </div>

              {mentorCourses.length === 0 ? (
                <EmptyState
                  title="Chưa có khóa học nào"
                  description={
                    isEffectiveSelf
                      ? 'Tạo khóa học để bắt đầu đồng hành cùng sinh viên!'
                      : 'Mentor chưa mở khóa học nào.'
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorCourses.map((course) => (
                    <MentorCourseCard
                      key={course.id}
                      course={course}
                      hasEnrolled={enrolledCourseIds.includes(course.id)}
                      onEnroll={(id) => enrollMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* TAB 4: HOẠT ĐỘNG */}
          <TabsContent value="activities" className="space-y-5 pt-2">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Câu lạc bộ tham gia
              </h3>
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-surface divide-y divide-neutral-200 dark:divide-neutral-700/80 px-3 shadow-sm">
                {seedClubs.slice(0, 2).map((club) => (
                  <EntityRow
                    key={club.id}
                    href={`/clubs/${club.id}`}
                    title={club.name}
                    subtitle={`${club.field} · Thành viên hoạt động`}
                    actions={<span className="text-xs font-medium text-primary">Xem CLB →</span>}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Nhóm học tập & Đồ án
              </h3>
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-surface divide-y divide-neutral-200 dark:divide-neutral-700/80 px-3 shadow-sm">
                {seedGroups.slice(0, 2).map((grp) => (
                  <EntityRow
                    key={grp.id}
                    href={`/groups/${grp.id}`}
                    title={grp.name}
                    subtitle={`${grp.topic} · ${grp.memberCount}/${grp.memberLimit} thành viên`}
                    actions={<span className="text-xs font-medium text-primary">Xem nhóm →</span>}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Chương trình tình nguyện & Sự kiện
              </h3>
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-surface divide-y divide-neutral-200 dark:divide-neutral-700/80 px-3 shadow-sm">
                {seedProgramChannels.slice(0, 2).map((prog) => (
                  <EntityRow
                    key={prog.id}
                    href={`/programs/${prog.id}`}
                    title={prog.title}
                    subtitle={`${prog.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'} · Đã tham gia`}
                    actions={<span className="text-xs font-medium text-primary">Chi tiết →</span>}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* MODAL: Đổi ảnh bìa */}
      <Dialog open={coverModalOpen} onOpenChange={setCoverModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Cập nhật ảnh bìa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-neutral-500 block mb-2">
                Chọn từ bộ sưu tập ảnh bìa mẫu:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_COVERS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSaveCover(url)}
                    className="h-20 rounded-xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary transition-all relative group"
                  >
                    <img src={url} alt="Preset cover" className="w-full h-full object-cover" />
                    {displayCover === url && (
                      <div className="absolute top-1.5 right-1.5 bg-primary text-white p-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
                Hoặc nhập liên kết ảnh bìa trực tiếp:
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => customCoverUrl.trim() && handleSaveCover(customCoverUrl.trim())}
                  disabled={!customCoverUrl.trim()}
                >
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: Đổi ảnh đại diện */}
      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Cập nhật ảnh đại diện</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-neutral-500 block mb-2">
                Chọn nhanh ảnh mẫu:
              </label>
              <div className="flex justify-center gap-3">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSaveAvatar(url)}
                    className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary transition-all relative group"
                  >
                    <img src={url} alt="Preset avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
                Hoặc nhập URL ảnh đại diện:
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => customAvatarUrl.trim() && handleSaveAvatar(customAvatarUrl.trim())}
                  disabled={!customAvatarUrl.trim()}
                >
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers / Following Modal */}
      <Dialog
        open={followersModal.open}
        onOpenChange={(open) => setFollowersModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {followersModal.tab === 'followers' ? 'Danh sách người theo dõi' : 'Đang theo dõi'}
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-80 overflow-y-auto">
            {seedUsers.slice(0, 4).map((u) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserAvatar user={u} size="sm" />
                  <div>
                    <h5 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {u.fullName}
                    </h5>
                    <p className="text-[11px] text-neutral-400">{u.major || 'Kỹ thuật phần mềm'}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => {
                    setFollowersModal((prev) => ({ ...prev, open: false }));
                    navigate(`/users/${u.id}`);
                  }}
                >
                  Xem hồ sơ
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <ReportDialog
        open={reportUserOpen}
        onOpenChange={setReportUserOpen}
        targetType="user"
        targetId={userEntity.id}
        targetTitle={userEntity.fullName}
      />

      {/* Mentor Send Request Dialog */}
      <SendMentoringRequestDialog
        open={sendRequestOpen}
        onOpenChange={setSendRequestOpen}
        mentorId={userEntity.id}
      />

      {/* Mentor Profile Custom Sections Sheet */}
      <MentorProfileSectionSheet
        open={mentorSectionsSheetOpen}
        onOpenChange={setMentorSectionsSheetOpen}
        mentorId={userEntity.id}
        initialSections={mentorSections}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['mentor-profile-sections', targetUserId] });
          toast.success('Đã lưu cấu hình hồ sơ Mentor');
          setMentorSectionsSheetOpen(false);
        }}
      />
    </div>
  );
};

export default ProfilePage;
