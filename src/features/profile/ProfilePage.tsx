import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import type { User, StudentProfile } from '@/types/entities';

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => apiClient.get('/profile/me') as Promise<{ user: User; profile: StudentProfile }>,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ & Tiêu chí cá nhân"
        description="Quản lý thông tin tài khoản, hồ sơ sinh viên và cài đặt quyền riêng tư matching"
      />

      <QueryBoundary query={profileQuery}>
        {({ user, profile }) => (
          <ProfileTabsView
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

function ProfileTabsView({
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

  // Tab 1: Info
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  // Tab 2: Matching
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || []);
  const [interests, setInterests] = useState<string[]>(initialProfile?.interests || []);
  const [goals, setGoals] = useState<string[]>(initialProfile?.goals || []);
  const [availability, setAvailability] = useState(initialProfile?.availability || []);

  // Tab 3: Privacy
  const [privacy, setPrivacy] = useState(
    initialProfile?.privacy || { swapMatching: true, groupMatching: true, mentoringMatching: true }
  );

  // Tab 4: Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleSavePrivacy = () => {
    updateProfileMutation.mutate({ privacy });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'error', title: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    toast({ variant: 'success', title: 'Đổi mật khẩu thành công' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Tabs defaultValue="info">
      <TabsList className="mb-6">
        <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
        <TabsTrigger value="matching">Tiêu chí Matching</TabsTrigger>
        <TabsTrigger value="privacy">Quyền riêng tư</TabsTrigger>
        <TabsTrigger value="account">Tài khoản & Bảo mật</TabsTrigger>
      </TabsList>

      {/* Tab 1: Info */}
      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 pb-2">
              <Avatar src={avatarUrl} name={fullName} size="xl" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-neutral-800">Ảnh đại diện</p>
                <Input
                  placeholder="URL hình ảnh đại diện..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="max-w-md text-xs"
                />
              </div>
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

            <FormField label="Giới thiệu bản thân (Bio)">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Giới thiệu về kỹ năng, kinh nghiệm học tập..."
              />
            </FormField>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveInfo} loading={updateProfileMutation.isPending}>
              Lưu thông tin
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Tab 2: Matching */}
      <TabsContent value="matching">
        <Card>
          <CardHeader>
            <CardTitle>Tiêu chí ghép nối (AI Matching Criteria)</CardTitle>
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

            <FormField label="Mục tiêu">
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
              Lưu tiêu chí
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Tab 3: Privacy */}
      <TabsContent value="privacy">
        <Card>
          <CardHeader>
            <CardTitle>Quyền riêng tư & Chia sẻ dữ liệu Matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 divide-y divide-neutral-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs font-semibold text-neutral-800">Sử dụng dữ liệu cho Class Swap Matching</p>
                <p className="text-meta text-neutral-500">
                  Cho phép thuật toán gợi ý lịch học của bạn cho các sinh viên tìm đối tác đổi lớp.
                </p>
              </div>
              <Switch
                checked={privacy.swapMatching}
                onCheckedChange={(checked) => setPrivacy({ ...privacy, swapMatching: checked })}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-xs font-semibold text-neutral-800">Sử dụng dữ liệu cho Group Finding Matching</p>
                <p className="text-meta text-neutral-500">
                  Cho phép hiển thị hồ sơ của bạn trong danh sách gợi ý thành viên cho chủ nhóm.
                </p>
              </div>
              <Switch
                checked={privacy.groupMatching}
                onCheckedChange={(checked) => setPrivacy({ ...privacy, groupMatching: checked })}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-xs font-semibold text-neutral-800">Sử dụng dữ liệu cho Mentoring Matching</p>
                <p className="text-meta text-neutral-500">
                  Cho phép gợi ý Mentor dựa trên các môn học và mục tiêu của bạn.
                </p>
              </div>
              <Switch
                checked={privacy.mentoringMatching}
                onCheckedChange={(checked) => setPrivacy({ ...privacy, mentoringMatching: checked })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSavePrivacy} loading={updateProfileMutation.isPending}>
              Lưu cài đặt quyền riêng tư
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Tab 4: Account */}
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu tài khoản</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <FormField label="Mật khẩu hiện tại" required>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>

              <FormField label="Mật khẩu mới" required>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>

              <FormField label="Xác nhận mật khẩu mới" required>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>

              <Button type="submit" className="mt-2">
                Cập nhật mật khẩu
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
