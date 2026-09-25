import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Progress';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import type { User, StudentProfile } from '@/types/entities';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => apiClient.get('/profile/me') as Promise<{ user: User; profile: StudentProfile }>,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin hiển thị với các sinh viên khác và hoàn thiện tiêu chí phục vụ AI Matching."
        actions={
          user?.id ? (
            <Link to={`/users/${user.id}`}>
              <Button variant="outline" size="sm" rightIcon={<ExternalLink size={14} />}>
                Xem như người khác
              </Button>
            </Link>
          ) : undefined
        }
      />

      <QueryBoundary query={profileQuery}>
        {({ user, profile }) => (
          <ProfileView
            user={user}
            initialProfile={profile}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
            }}
          />
        )}
      </QueryBoundary>
    </div>
  );
}

function ProfileView({
  user,
  initialProfile,
  onSuccess,
}: {
  user: User;
  initialProfile?: StudentProfile;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [activeTab, setActiveTab] = useState<'info' | 'criteria'>('info');

  // Tab 1: Info State
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  // Tab 2: Matching Criteria State
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || []);
  const [interests, setInterests] = useState<string[]>(initialProfile?.interests || []);
  const [goals, setGoals] = useState<string[]>(initialProfile?.goals || []);
  const [availability, setAvailability] = useState(initialProfile?.availability || []);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => apiClient.put('/profile/me', payload),
    onSuccess: (data: any) => {
      toast({ variant: 'success', title: 'Đã lưu thay đổi thành công' });
      if (data?.user) {
        updateUser(data.user);
      }
      onSuccess();
    },
    onError: () => {
      toast({ variant: 'error', title: 'Lưu thay đổi thất bại' });
    },
  });

  const handleSaveInfo = () => {
    updateProfileMutation.mutate({ fullName, bio, avatarUrl });
  };

  const handleSaveMatching = () => {
    updateProfileMutation.mutate({ skills, interests, goals, availability });
  };

  // Calculate profile completion percentage
  let completedPoints = 0;
  if (fullName) completedPoints += 20;
  if (bio) completedPoints += 20;
  if (skills.length > 0) completedPoints += 20;
  if (interests.length > 0 || goals.length > 0) completedPoints += 20;
  if (availability.length > 0) completedPoints += 20;

  return (
    <div className="space-y-6">
      {/* Profile Completion Bar (if < 100%) */}
      {completedPoints < 100 && (
        <Card className="p-4 bg-brand-50/50 border-brand-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-600" /> Hồ sơ hoàn thiện: {completedPoints}%
            </span>
            <span className="text-neutral-500">
              {availability.length === 0 ? 'Thêm lịch rảnh để tối ưu gợi ý nhóm' : 'Hoàn thiện để tăng độ chính xác AI'}
            </span>
          </div>
          <Progress value={completedPoints} className="h-2 bg-neutral-200" />
        </Card>
      )}

      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar src={avatarUrl || user.avatarUrl} name={fullName} size="xl" />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-lg font-bold text-neutral-900">{fullName}</h2>
            <p className="text-xs text-neutral-500">
              MSSV: {user.studentCode || 'N/A'} • {user.school}
            </p>
            <p className="text-xs text-neutral-600 line-clamp-2 max-w-lg pt-1">
              {bio || 'Chưa có giới thiệu bản thân.'}
            </p>
          </div>
        </div>
      </Card>

      {/* 2 Tabs SegmentedControl */}
      <div className="border-b border-neutral-200 pb-3">
        <SegmentedControl
          options={[
            { value: 'info', label: 'Thông tin cá nhân' },
            { value: 'criteria', label: 'Tiêu chí Matching AI' },
          ]}
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          size="md"
        />
      </div>

      {/* Tab 1: Info */}
      {activeTab === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <FormField label="URL hình ảnh đại diện">
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="max-w-md text-xs"
                />
              </FormField>
            </div>

            <FormField label="Họ và tên" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email trường (Cố định)">
                <Input value={user.email} disabled className="bg-neutral-100" />
              </FormField>
              <FormField label="Mã số sinh viên (MSSV)">
                <Input value={user.studentCode || 'N/A'} disabled className="bg-neutral-100" />
              </FormField>
            </div>

            <FormField label="Trường / Cơ sở">
              <Input value={user.school} disabled className="bg-neutral-100" />
            </FormField>

            <FormField
              label="Giới thiệu bản thân (Bio)"
              helperText={`${bio.length}/300 ký tự`}
            >
              <Textarea
                value={bio}
                maxLength={300}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Giới thiệu về kỹ năng, kinh nghiệm học tập hoặc định hướng cá nhân..."
              />
            </FormField>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveInfo} loading={updateProfileMutation.isPending}>
              Lưu thông tin
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Tab 2: Matching Criteria */}
      {activeTab === 'criteria' && (
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Tiêu chí ghép nối (AI Matching Criteria)</CardTitle>
              <p className="text-xs text-neutral-500">
                Dữ liệu này dùng để gợi ý nhóm học tập, Mentor và đối tác đổi lớp.{' '}
                <Link to="/settings" className="text-brand-600 font-semibold hover:underline">
                  Quản lý quyền riêng tư dữ liệu tại Cài đặt →
                </Link>
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField label="Kỹ năng chuyên môn" helperText="Nhấn Enter hoặc phẩy để thêm tag kỹ năng">
              <TagInput
                value={skills}
                onChange={setSkills}
                suggestions={['React', 'TypeScript', 'Node.js', 'Spring Boot', 'Java', 'CSD201', 'PRJ301', 'SWP391']}
              />
            </FormField>

            <FormField label="Sở thích & Lĩnh vực quan tâm">
              <TagInput
                value={interests}
                onChange={setInterests}
                suggestions={['Web Development', 'Machine Learning', 'Thuật toán', 'Game Dev', 'Tiếng Anh']}
              />
            </FormField>

            <FormField label="Mục tiêu học tập">
              <TagInput
                value={goals}
                onChange={setGoals}
                suggestions={['Đổi lớp', 'Tìm nhóm làm đồ án', 'Tìm Mentor', 'Tham gia CLB IT']}
              />
            </FormField>

            <div className="pt-2">
              <FormField label="Lịch rảnh tự khai" helperText="Dùng để đối chiếu lịch học và thời gian rảnh">
                <ScheduleInput value={availability} onChange={setAvailability} />
              </FormField>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveMatching} loading={updateProfileMutation.isPending}>
              Lưu tiêu chí matching
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
