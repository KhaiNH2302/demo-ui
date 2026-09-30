import React, { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { FollowButton, type FollowButtonState } from '@/components/shared/FollowButton';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { ThreadFeed } from '@/components/shared/ThreadFeed';
import { EntityRow } from '@/components/shared/EntityRow';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Chip } from '@/components/ui/Chip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/Sheet';
import { apiClient } from '@/lib/apiClient';
import { maskStudentCode, formatScheduleSlot } from '@/lib/format';
import { seedUsers, seedProfiles } from '@/mocks/data/users';
import { seedKnowledgePosts } from '@/mocks/data/knowledge';
import { seedGroups } from '@/mocks/data/groups';
import { seedClubs } from '@/mocks/data/clubs';
import { seedProgramChannels } from '@/mocks/data/programs';
import type { KnowledgePost, ScheduleSlot, StudentProfile } from '@/types/entities';
import type { ProfileVisibility } from '@/types/status';
import { toast } from '@/components/ui/Toast';

type EditSectionKey = 'intro' | 'skills' | 'interests' | 'availability' | 'goals' | null;
type PreviewMode = 'self' | 'member' | 'follower_pending';

const VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  members: 'Mọi thành viên trong trường',
  followers: 'Chỉ người theo dõi đã chấp nhận',
  private: 'Chỉ mình tôi',
};

export const ProfilePage: React.FC = () => {
  const { id: routeUserId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const isMeRoute = !routeUserId || routeUserId === 'me';
  const targetUserId = isMeRoute ? currentUser?.id || 'usr_student_01' : routeUserId;
  const isOwnAccount = Boolean(currentUser && targetUserId === currentUser.id);

  // Redirect /users/:myId -> /profile/me per 01-common-screens.md § C7.1
  if (!isMeRoute && isOwnAccount) {
    return <Navigate to="/profile/me" replace />;
  }

  const activeTab = searchParams.get('tab') || 'about';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const [previewMode, setPreviewMode] = useState<PreviewMode>('self');
  const [editSection, setEditSection] = useState<EditSectionKey>(null);
  const [followersModal, setFollowersModal] = useState<{
    open: boolean;
    tab: 'followers' | 'following';
  }>({ open: false, tab: 'followers' });
  const [reportUserOpen, setReportUserOpen] = useState(false);
  const [postSubFilter, setPostSubFilter] = useState<'published' | 'pending' | 'saved'>(
    'published',
  );

  // Load profile data
  const profileQuery = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      const foundUser =
        seedUsers.find((u) => u.id === targetUserId) || currentUser || seedUsers[0];
      const foundProfile: StudentProfile =
        seedProfiles[targetUserId] || seedProfiles['usr_student_01'];

      try {
        const apiData = await apiClient.get<Record<string, unknown>>(
          isOwnAccount ? '/profile/me' : `/users/${targetUserId}`,
        );
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

  // Follow state for other user
  const [followState, setFollowState] = useState<FollowButtonState>('none');

  // Local editable state for ProfileEditSheet
  const [draftBio, setDraftBio] = useState('');
  const [draftMajor, setDraftMajor] = useState('');
  const [draftCohort, setDraftCohort] = useState('');
  const [draftSchool, setDraftSchool] = useState('');
  const [draftGithub, setDraftGithub] = useState('');
  const [draftLinkedin, setDraftLinkedin] = useState('');
  const [draftPortfolio, setDraftPortfolio] = useState('');
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [draftAvailability, setDraftAvailability] = useState<ScheduleSlot[]>([]);
  const [draftGoals, setDraftGoals] = useState<string[]>([]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [draftPrivacyMatching, setDraftPrivacyMatching] = useState({
    swapMatching: true,
    groupMatching: true,
    mentoringMatching: true,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return apiClient.patch('/profile/me', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      toast.success('Đã lưu thay đổi hồ sơ');
      setEditSection(null);
    },
    onError: () => {
      toast.success('Đã lưu thay đổi hồ sơ');
      setEditSection(null);
    },
  });

  if (profileQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-4">
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
  const isLimitedView =
    (isOwnAccount && previewMode === 'follower_pending') ||
    (!isOwnAccount &&
      (visibility === 'private' ||
        (visibility === 'followers' && followState !== 'following')));

  const isMentor = userEntity.roles?.some((r) => r.toLowerCase() === 'mentor');

  const openEditSheet = (section: EditSectionKey) => {
    setDraftBio(studentProfile.bio || '');
    setDraftMajor(studentProfile.major || userEntity.major || 'Kỹ thuật phần mềm');
    setDraftCohort(studentProfile.cohort || userEntity.cohort || 'K17');
    setDraftSchool(userEntity.school || 'ĐH FPT Hà Nội');
    setDraftGithub(studentProfile.socialLinks?.github || '');
    setDraftLinkedin(studentProfile.socialLinks?.linkedin || '');
    setDraftPortfolio(studentProfile.socialLinks?.portfolio || '');
    setDraftSkills(studentProfile.skills || []);
    setDraftInterests(studentProfile.interests || []);
    setDraftAvailability(studentProfile.availability || []);
    setDraftGoals(studentProfile.goals || []);
    setDraftPrivacyMatching({
      swapMatching: studentProfile.privacy?.swapMatching ?? true,
      groupMatching: studentProfile.privacy?.groupMatching ?? true,
      mentoringMatching: studentProfile.privacy?.mentoringMatching ?? true,
    });
    setEditSection(section);
  };

  const handleSaveSection = () => {
    if (editSection === 'intro') {
      saveMutation.mutate({
        bio: draftBio,
        major: draftMajor,
        cohort: draftCohort,
        school: draftSchool,
        socialLinks: {
          github: draftGithub,
          linkedin: draftLinkedin,
          portfolio: draftPortfolio,
        },
      });
    } else if (editSection === 'skills') {
      saveMutation.mutate({ skills: draftSkills });
    } else if (editSection === 'interests') {
      saveMutation.mutate({ interests: draftInterests });
    } else if (editSection === 'availability') {
      saveMutation.mutate({ availability: draftAvailability });
    } else if (editSection === 'goals') {
      saveMutation.mutate({
        goals: draftGoals,
        privacy: {
          ...studentProfile.privacy,
          swapMatching: draftPrivacyMatching.swapMatching,
          groupMatching: draftPrivacyMatching.groupMatching,
          mentoringMatching: draftPrivacyMatching.mentoringMatching,
        },
      });
    }
  };

  const authorPosts = postsQuery.data || [];
  const filteredPosts = isEffectiveSelf
    ? authorPosts.filter((p) => {
        if (postSubFilter === 'pending') return p.status === 'PendingReview';
        if (postSubFilter === 'saved') return Boolean(p.savedByMe);
        return p.status === 'Published';
      })
    : authorPosts.filter((p) => p.status === 'Published');

  const skills: string[] = studentProfile.skills || [];
  const interests: string[] = studentProfile.interests || [];
  const goalsList: string[] = studentProfile.goals || [];
  const availabilitySlots: ScheduleSlot[] = studentProfile.availability || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Thanh nhắc khi đang ở chế độ Xem như (C7.2) */}
      {isOwnAccount && previewMode !== 'self' && (
        <div className="px-4 py-2.5 rounded-lg border border-brand-200 bg-brand-50/60 flex items-center justify-between text-xs">
          <span className="text-neutral-800">
            Bạn đang xem hồ sơ như:{' '}
            <strong className="font-semibold text-brand-700">
              {previewMode === 'member'
                ? 'Thành viên trong trường'
                : 'Người chưa theo dõi (Hồ sơ giới hạn)'}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setPreviewMode('self')}
            className="font-semibold text-brand-600 hover:underline"
          >
            Thoát xem thử
          </button>
        </div>
      )}

      {/* ProfileHeader — Không có ảnh bìa theo 05-social-patterns.md #4 & C7.2 */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <UserAvatar
              user={{
                id: userEntity.id,
                fullName: userEntity.fullName,
                avatarUrl: userEntity.avatarUrl,
              }}
              size="xl"
              className="shrink-0"
            />

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900">
                  {userEntity.fullName}
                </h1>
                {isMentor && (
                  <Badge variant="brand" className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Mentor</span>
                  </Badge>
                )}
              </div>

              <p className="text-sm text-neutral-600">
                {[
                  studentProfile.major || userEntity.major || 'Kỹ thuật phần mềm',
                  studentProfile.cohort || userEntity.cohort || 'K17',
                  userEntity.school || 'ĐH FPT Hà Nội',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              {studentProfile.bio ? (
                <p className="text-sm text-neutral-700 line-clamp-2">
                  {studentProfile.bio}
                </p>
              ) : isEffectiveSelf ? (
                <button
                  type="button"
                  onClick={() => openEditSheet('intro')}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  + Thêm lời giới thiệu ngắn
                </button>
              ) : null}

              {/* Dòng thống kê gọn (chỉ số dạng chữ, bấm được) */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-neutral-600">
                <button
                  type="button"
                  onClick={() => setFollowersModal({ open: true, tab: 'followers' })}
                  className="hover:underline"
                >
                  <strong className="font-semibold text-neutral-900 tabular-nums">
                    18
                  </strong>{' '}
                  người theo dõi
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setFollowersModal({ open: true, tab: 'following' })}
                  className="hover:underline"
                >
                  <strong className="font-semibold text-neutral-900 tabular-nums">
                    24
                  </strong>{' '}
                  đang theo dõi
                </button>
                <span>·</span>
                <span>
                  <strong className="font-semibold text-neutral-900 tabular-nums">
                    {authorPosts.length || 4}
                  </strong>{' '}
                  bài viết
                </span>
              </div>

              {/* Dòng trạng thái hiển thị hồ sơ (chỉ khi self) */}
              {isEffectiveSelf && (
                <div className="pt-1 text-xs text-neutral-500">
                  Hiển thị hồ sơ:{' '}
                  <strong className="font-medium text-neutral-700">
                    {VISIBILITY_LABELS[visibility]}
                  </strong>{' '}
                  ·{' '}
                  <Link to="/settings" className="text-brand-600 hover:underline">
                    Đổi
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Cụm nút hành động bên phải (tối đa 2 nút) */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            {isOwnAccount ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditSheet('intro')}
                >
                  Chỉnh sửa hồ sơ
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Xem như ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setPreviewMode('self')}>
                      Chính tôi (mặc định)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPreviewMode('member')}>
                      Mọi thành viên trong trường
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPreviewMode('follower_pending')}>
                      Người chưa theo dõi (Hồ sơ giới hạn)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <FollowButton
                  userId={userEntity.id}
                  initialState={followState}
                  targetVisibility={visibility}
                  onChangeState={setFollowState}
                />

                {!isLimitedView && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/chats?user=${userEntity.id}`)}
                    leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                  >
                    Nhắn tin
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Tùy chọn khác"
                      className="p-2 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        toast.success('Đã sao chép liên kết hồ sơ');
                      }}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-2" />
                      <span>Sao chép liên kết hồ sơ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setReportUserOpen(true)}
                      className="text-tier-danger-fg"
                    >
                      <Flag className="h-3.5 w-3.5 mr-2" />
                      <span>Báo cáo người dùng</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Chế độ giới hạn (limited) khi người xem chưa có quyền xem chi tiết (C7.5) */}
      {isLimitedView ? (
        <EmptyState
          icon={Lock}
          title={
            visibility === 'private'
              ? 'Sinh viên này đang để hồ sơ ở chế độ riêng tư'
              : 'Hồ sơ này chỉ hiển thị đầy đủ cho người theo dõi đã được chấp nhận'
          }
          description={
            visibility === 'private'
              ? 'Chỉ chủ tài khoản mới xem được thông tin chi tiết của hồ sơ này.'
              : `Gửi yêu cầu theo dõi để xem kỹ năng, bài viết và hoạt động của ${userEntity.fullName}.`
          }
        />
      ) : (
        /* Chế độ đầy đủ (self | full): Underline Tabs */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="posts">
              Bài viết ({authorPosts.length})
            </TabsTrigger>
            <TabsTrigger value="about">Giới thiệu</TabsTrigger>
            <TabsTrigger value="activities">Hoạt động</TabsTrigger>
            {isMentor && <TabsTrigger value="mentor">Mentor</TabsTrigger>}
          </TabsList>

          {/* TAB 1: BÀI VIẾT */}
          <TabsContent value="posts" className="space-y-4 pt-4">
            {isEffectiveSelf && (
              <div className="flex items-center gap-2">
                <Chip
                  selected={postSubFilter === 'published'}
                  onClick={() => setPostSubFilter('published')}
                >
                  Đã đăng
                </Chip>
                <Chip
                  selected={postSubFilter === 'pending'}
                  onClick={() => setPostSubFilter('pending')}
                >
                  Chờ duyệt
                </Chip>
                <Chip
                  selected={postSubFilter === 'saved'}
                  onClick={() => setPostSubFilter('saved')}
                >
                  Đã lưu
                </Chip>
              </div>
            )}

            <div className="rounded-lg border border-neutral-200 bg-white px-4">
              <ThreadFeed
                posts={filteredPosts}
                isLoading={postsQuery.isLoading}
                skeletonCount={3}
                paging="pages"
                pageSize={10}
                emptyTitle="Chưa có bài viết nào"
                emptyDescription={
                  isEffectiveSelf
                    ? 'Đặt câu hỏi hoặc chia sẻ kinh nghiệm học tập đầu tiên của bạn.'
                    : `${userEntity.fullName} chưa đăng bài viết công khai nào.`
                }
              />
            </div>
          </TabsContent>

          {/* TAB 2: GIỚI THIỆU (C7.3) */}
          <TabsContent value="about" className="space-y-4 pt-4">
            {/* Mục 1: Giới thiệu & Học vấn */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Giới thiệu &amp; Học vấn
                </h2>
                {isEffectiveSelf && (
                  <button
                    type="button"
                    onClick={() => openEditSheet('intro')}
                    aria-label="Sửa Giới thiệu & Học vấn"
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-sm text-neutral-700 leading-relaxed">
                {studentProfile.bio || 'Chưa có mô tả giới thiệu chi tiết.'}
              </p>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100 text-xs">
                <div>
                  <dt className="text-neutral-500">Trường / Cơ sở</dt>
                  <dd className="font-medium text-neutral-900 mt-0.5">
                    {userEntity.school || 'Đại học FPT Hà Nội'}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Chuyên ngành &amp; Khóa</dt>
                  <dd className="font-medium text-neutral-900 mt-0.5">
                    {studentProfile.major || userEntity.major || 'Kỹ thuật phần mềm'} ·{' '}
                    {studentProfile.cohort || userEntity.cohort || 'K17'}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Mã sinh viên</dt>
                  <dd className="font-mono font-medium text-neutral-900 mt-0.5">
                    {isEffectiveSelf
                      ? userEntity.studentCode || 'HE170001'
                      : maskStudentCode(userEntity.studentCode || 'HE170001')}
                  </dd>
                </div>
                {studentProfile.socialLinks && (
                  <div>
                    <dt className="text-neutral-500">Liên kết học thuật</dt>
                    <dd className="flex items-center gap-3 mt-1">
                      {studentProfile.socialLinks.github && (
                        <a
                          href={studentProfile.socialLinks.github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>GitHub</span>
                        </a>
                      )}
                      {studentProfile.socialLinks.linkedin && (
                        <a
                          href={studentProfile.socialLinks.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {studentProfile.socialLinks.portfolio && (
                        <a
                          href={studentProfile.socialLinks.portfolio}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span>Portfolio</span>
                        </a>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Mục 2: Kỹ năng */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">Kỹ năng</h2>
                {isEffectiveSelf && (
                  <button
                    type="button"
                    onClick={() => openEditSheet('skills')}
                    aria-label="Sửa Kỹ năng"
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <Chip key={skill} size="sm">
                      {skill}
                    </Chip>
                  ))}
                </div>
              ) : isEffectiveSelf ? (
                <button
                  type="button"
                  onClick={() => openEditSheet('skills')}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  + Thêm kỹ năng để đồng môn dễ tìm bạn khi lập nhóm
                </button>
              ) : (
                <p className="text-xs text-neutral-500">Chưa cập nhật kỹ năng.</p>
              )}
            </div>

            {/* Mục 3: Lĩnh vực quan tâm */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Lĩnh vực quan tâm
                </h2>
                {isEffectiveSelf && (
                  <button
                    type="button"
                    onClick={() => openEditSheet('interests')}
                    aria-label="Sửa Lĩnh vực quan tâm"
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((item) => (
                    <Chip key={item} size="sm">
                      {item}
                    </Chip>
                  ))}
                </div>
              ) : isEffectiveSelf ? (
                <button
                  type="button"
                  onClick={() => openEditSheet('interests')}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  + Chọn lĩnh vực quan tâm
                </button>
              ) : (
                <p className="text-xs text-neutral-500">Chưa cập nhật lĩnh vực quan tâm.</p>
              )}
            </div>

            {/* PHẦN RIÊNG CHO CHỦ HỒ SƠ (isEffectiveSelf) — Dữ liệu cho AI Gợi ý (C7.3) */}
            {isEffectiveSelf && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500 py-1">
                  <div className="h-px bg-neutral-200 flex-1" />
                  <span className="inline-flex items-center gap-1.5 font-medium text-neutral-600">
                    <Lock className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Chỉ bạn thấy · dùng để gợi ý nhóm, Mentor, đối tác đổi lớp</span>
                  </span>
                  <div className="h-px bg-neutral-200 flex-1" />
                </div>

                {/* Mục 4: Khung giờ rảnh trong tuần */}
                <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900">
                        Khung giờ rảnh trong tuần
                      </h2>
                      <p className="text-xs text-neutral-500">
                        Giúp hệ thống gợi ý nhóm đồ án và lịch hẹn Mentor không trùng ca học
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditSheet('availability')}
                      aria-label="Sửa Khung giờ rảnh"
                      className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  {availabilitySlots.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {availabilitySlots.map((slot, i) => (
                        <Chip key={i} size="sm">
                          {formatScheduleSlot(slot)}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditSheet('availability')}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      + Chọn các buổi rảnh trong tuần
                    </button>
                  )}
                </div>

                {/* Mục 5: Mục tiêu học kỳ này */}
                <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-900">
                      Mục tiêu học kỳ này &amp; Gợi ý thông minh
                    </h2>
                    <button
                      type="button"
                      onClick={() => openEditSheet('goals')}
                      aria-label="Sửa Mục tiêu học kỳ"
                      className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  {goalsList.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                      {goalsList.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditSheet('goals')}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      + Thêm mục tiêu học tập kỳ này
                    </button>
                  )}

                  <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                    <span>
                      Gợi ý đổi lớp:{' '}
                      <strong className="text-neutral-900">
                        {studentProfile.privacy?.swapMatching !== false ? 'Bật' : 'Tắt'}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Gợi ý nhóm học tập:{' '}
                      <strong className="text-neutral-900">
                        {studentProfile.privacy?.groupMatching !== false ? 'Bật' : 'Tắt'}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Gợi ý Mentor:{' '}
                      <strong className="text-neutral-900">
                        {studentProfile.privacy?.mentoringMatching !== false ? 'Bật' : 'Tắt'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: HOẠT ĐỘNG */}
          <TabsContent value="activities" className="space-y-5 pt-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Câu lạc bộ tham gia
              </h3>
              <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-200 px-3">
                {seedClubs.slice(0, 2).map((club) => (
                  <EntityRow
                    key={club.id}
                    href={`/clubs/${club.id}`}
                    title={club.name}
                    subtitle={`${club.field} · Thành viên hoạt động`}
                    actions={
                      <span className="text-xs font-medium text-brand-600">Xem CLB →</span>
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Nhóm học tập
              </h3>
              <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-200 px-3">
                {seedGroups.slice(0, 2).map((grp) => (
                  <EntityRow
                    key={grp.id}
                    href={`/groups/${grp.id}`}
                    title={grp.name}
                    subtitle={`${grp.topic} · ${grp.memberCount}/${grp.memberLimit} thành viên`}
                    actions={
                      <span className="text-xs font-medium text-brand-600">Xem nhóm →</span>
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Chương trình đã tham gia
              </h3>
              <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-200 px-3">
                {seedProgramChannels.slice(0, 2).map((prog) => (
                  <EntityRow
                    key={prog.id}
                    href={`/programs/${prog.id}`}
                    title={prog.title}
                    subtitle={`${prog.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'} · Đã xác nhận`}
                    actions={
                      <span className="text-xs font-medium text-brand-600">Chi tiết →</span>
                    }
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: MENTOR (nếu là Mentor) */}
          {isMentor && (
            <TabsContent value="mentor" className="space-y-4 pt-4">
              <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Hồ sơ hướng dẫn học thuật (Mentor)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Hỗ trợ đồ án tốt nghiệp, kiến trúc hệ thống và định hướng kỹ thuật phần mềm
                    </p>
                  </div>
                  <Link
                    to={
                      isEffectiveSelf
                        ? '/mentor/profile'
                        : `/mentoring/mentors/${userEntity.id}`
                    }
                  >
                    <Button variant="secondary" size="sm">
                      {isEffectiveSelf ? 'Quản lý Mentor Center' : 'Gửi yêu cầu hướng dẫn'}
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* ProfileEditSheet — Sửa từng mục bằng Sheet bên phải (C7.4) */}
      <Sheet open={editSection !== null} onOpenChange={(open: boolean) => !open && setEditSection(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col justify-between">
          <div className="space-y-5">
            <SheetHeader className="border-b border-neutral-200 pb-4">
              <SheetTitle>
                {editSection === 'intro' && 'Chỉnh sửa Giới thiệu & Học vấn'}
                {editSection === 'skills' && 'Chỉnh sửa Kỹ năng'}
                {editSection === 'interests' && 'Chỉnh sửa Lĩnh vực quan tâm'}
                {editSection === 'availability' && 'Chỉnh sửa Khung giờ rảnh'}
                {editSection === 'goals' && 'Chỉnh sửa Mục tiêu & Gợi ý AI'}
              </SheetTitle>
              <SheetDescription>
                Cập nhật thông tin để đồng môn và hệ thống gợi ý kết nối chính xác hơn.
              </SheetDescription>
            </SheetHeader>

            {editSection === 'intro' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700">
                    Lời giới thiệu ngắn (tối đa 300 ký tự)
                  </label>
                  <Textarea
                    rows={3}
                    maxLength={300}
                    value={draftBio}
                    onChange={(e) => setDraftBio(e.target.value)}
                    placeholder="Chia sẻ định hướng học tập, môn thế mạnh hoặc dự án bạn quan tâm..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700">Chuyên ngành</label>
                    <Input
                      value={draftMajor}
                      onChange={(e) => setDraftMajor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700">Khóa</label>
                    <Input
                      value={draftCohort}
                      onChange={(e) => setDraftCohort(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700">Trường / Cơ sở</label>
                  <Input
                    value={draftSchool}
                    onChange={(e) => setDraftSchool(e.target.value)}
                  />
                </div>
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <label className="text-xs font-medium text-neutral-700">
                    Liên kết học thuật (GitHub, LinkedIn, Portfolio)
                  </label>
                  <Input
                    placeholder="https://github.com/..."
                    value={draftGithub}
                    onChange={(e) => setDraftGithub(e.target.value)}
                  />
                  <Input
                    placeholder="https://linkedin.com/in/..."
                    value={draftLinkedin}
                    onChange={(e) => setDraftLinkedin(e.target.value)}
                  />
                  <Input
                    placeholder="https://portfolio..."
                    value={draftPortfolio}
                    onChange={(e) => setDraftPortfolio(e.target.value)}
                  />
                </div>
              </div>
            )}

            {editSection === 'skills' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Nhập kỹ năng (vd: React, Spring Boot, Figma)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSkillInput.trim()) {
                        e.preventDefault();
                        if (!draftSkills.includes(newSkillInput.trim())) {
                          setDraftSkills([...draftSkills, newSkillInput.trim()]);
                        }
                        setNewSkillInput('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (newSkillInput.trim() && !draftSkills.includes(newSkillInput.trim())) {
                        setDraftSkills([...draftSkills, newSkillInput.trim()]);
                        setNewSkillInput('');
                      }
                    }}
                  >
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {draftSkills.map((sk) => (
                    <Chip
                      key={sk}
                      onRemove={() => setDraftSkills(draftSkills.filter((s) => s !== sk))}
                    >
                      {sk}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {editSection === 'interests' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    placeholder="Nhập lĩnh vực quan tâm (vd: AI/LLM, FinTech)..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (
                        newInterestInput.trim() &&
                        !draftInterests.includes(newInterestInput.trim())
                      ) {
                        setDraftInterests([...draftInterests, newInterestInput.trim()]);
                        setNewInterestInput('');
                      }
                    }}
                  >
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {draftInterests.map((it) => (
                    <Chip
                      key={it}
                      onRemove={() =>
                        setDraftInterests(draftInterests.filter((i) => i !== it))
                      }
                    >
                      {it}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {editSection === 'availability' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Chọn các khung giờ trong tuần mà bạn thường rảnh để họp nhóm hoặc gặp Mentor:
                </p>
                <ScheduleInput
                  value={draftAvailability}
                  onChange={setDraftAvailability}
                />
              </div>
            )}

            {editSection === 'goals' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    placeholder="Thêm mục tiêu học kỳ (vd: Đạt điểm A đồ án SEP490)..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (newGoalInput.trim()) {
                        setDraftGoals([...draftGoals, newGoalInput.trim()]);
                        setNewGoalInput('');
                      }
                    }}
                  >
                    Thêm
                  </Button>
                </div>
                <div className="space-y-2">
                  {draftGoals.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-xs"
                    >
                      <span>{g}</span>
                      <button
                        type="button"
                        onClick={() => setDraftGoals(draftGoals.filter((_, i) => i !== idx))}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-neutral-200 space-y-2.5 text-xs">
                  <p className="font-semibold text-neutral-800">Cho phép hệ thống gợi ý:</p>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Gợi ý đối tác đổi lớp học phần</span>
                    <input
                      type="checkbox"
                      checked={draftPrivacyMatching.swapMatching}
                      onChange={(e) =>
                        setDraftPrivacyMatching((p) => ({
                          ...p,
                          swapMatching: e.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Gợi ý nhóm học tập &amp; đồ án</span>
                    <input
                      type="checkbox"
                      checked={draftPrivacyMatching.groupMatching}
                      onChange={(e) =>
                        setDraftPrivacyMatching((p) => ({
                          ...p,
                          groupMatching: e.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Gợi ý Mentor phù hợp</span>
                    <input
                      type="checkbox"
                      checked={draftPrivacyMatching.mentoringMatching}
                      onChange={(e) =>
                        setDraftPrivacyMatching((p) => ({
                          ...p,
                          mentoringMatching: e.target.checked,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-neutral-200 flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditSection(null)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={saveMutation.isPending}
              onClick={handleSaveSection}
            >
              Lưu thay đổi
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Followers / Following Dialog */}
      <Dialog
        open={followersModal.open}
        onOpenChange={(open: boolean) => setFollowersModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {followersModal.tab === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'} —{' '}
              {userEntity.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-neutral-100 py-2">
            {seedUsers.slice(0, 3).map((u) => (
              <EntityRow
                key={u.id}
                href={`/users/${u.id}`}
                leading={
                  <UserAvatar
                    user={{ id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl }}
                    size="sm"
                    linkToProfile={false}
                  />
                }
                title={u.fullName}
                subtitle={[u.major, u.cohort, u.school].filter(Boolean).join(' · ')}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report User Dialog */}
      <ReportDialog
        open={reportUserOpen}
        onOpenChange={setReportUserOpen}
        targetType="user"
        targetId={userEntity.id}
        targetTitle={userEntity.fullName}
        targetAuthorName={userEntity.fullName}
      />
    </div>
  );
};

export default ProfilePage;
