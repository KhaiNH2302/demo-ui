import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Bell,
  Palette,
  KeyRound,
  Check,
  Users,
  UserCheck,
  Lock,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import type { ProfileVisibility } from '@/types/status';

type SettingsTab = 'account' | 'privacy' | 'notifications' | 'appearance';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('privacy');

  // Privacy State (C14)
  const [privacy, setPrivacy] = useState<{
    groupMatching: boolean;
    mentoringMatching: boolean;
    profileVisibility: ProfileVisibility;
    whoCanMessage: 'everyone' | 'followers';
  }>({
    groupMatching: true,
    mentoringMatching: true,
    profileVisibility: 'members',
    whoCanMessage: 'everyone',
  });

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    group: { inApp: true, email: true },
    club: { inApp: true, email: false },
    program: { inApp: true, email: true },
    event: { inApp: true, email: false },
    mentoring: { inApp: true, email: true },
    moderation: { inApp: true, email: true },
  });

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const savePrivacyMutation = useMutation({
    mutationFn: (nextPrivacy: typeof privacy) =>
      apiClient.put('/profile/me', { privacy: nextPrivacy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ variant: 'success', title: 'Đã lưu cài đặt quyền riêng tư' });
    },
  });

  const handleTogglePrivacy = <K extends keyof typeof privacy>(
    key: K,
    value: (typeof privacy)[K]
  ) => {
    const next = { ...privacy, [key]: value };
    setPrivacy(next);
    savePrivacyMutation.mutate(next);
  };

  const handleToggleNotification = (
    module: keyof typeof notificationPrefs,
    channel: 'inApp' | 'email',
    val: boolean
  ) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [module]: { ...prev[module], [channel]: val },
    }));
    toast({ variant: 'success', title: 'Đã cập nhật kênh nhận thông báo' });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ variant: 'error', title: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'error', title: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    toast({ variant: 'success', title: 'Đổi mật khẩu thành công' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const navItems: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'privacy', label: 'Quyền riêng tư & Hồ sơ', icon: Shield },
    { id: 'account', label: 'Tài khoản & Bảo mật', icon: KeyRound },
    { id: 'notifications', label: 'Thông báo & Kênh gửi', icon: Bell },
    { id: 'appearance', label: 'Giao diện & Ngôn ngữ', icon: Palette },
  ];

  const visibilityOptions: {
    value: ProfileVisibility;
    title: string;
    desc: string;
    icon: React.ElementType;
  }[] = [
    {
      value: 'members',
      title: 'Mọi thành viên đăng nhập (Mặc định)',
      desc: 'Bất kỳ sinh viên đã đăng nhập vào SCS đều xem được đầy đủ hồ sơ, kỹ năng và bài viết của bạn. Khách chưa đăng nhập chỉ thấy thẻ giới hạn.',
      icon: Users,
    },
    {
      value: 'followers',
      title: 'Chỉ người theo dõi đã được chấp nhận',
      desc: 'Sinh viên khác phải gửi yêu cầu theo dõi và được bạn phê duyệt mới xem được bài viết, kỹ năng và hoạt động tham gia.',
      icon: UserCheck,
    },
    {
      value: 'private',
      title: 'Riêng tư',
      desc: 'Chỉ hiển thị các thông tin định danh cơ bản (Họ tên, Ảnh đại diện, Trường, Ngành, Khóa). Toàn bộ nội dung chi tiết được ẩn với người khác.',
      icon: Lock,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Tùy chỉnh quyền riêng tư hồ sơ, thuật toán gợi ý, kênh nhận thông báo và giao diện cá nhân."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Menu */}
        <aside className="space-y-1 bg-surface p-2 rounded-xl border border-neutral-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
                  isActive
                    ? 'bg-brand-50 text-brand-600 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                )}
              >
                <Icon size={16} className={isActive ? 'text-brand-600' : 'text-neutral-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* 1. Privacy Section */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ai được xem hồ sơ của tôi?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-neutral-500">
                    Chọn mức độ hiển thị trang hồ sơ cá nhân của bạn đối với các sinh viên khác và khách truy cập.
                  </p>

                  <div className="space-y-3">
                    {visibilityOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = privacy.profileVisibility === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleTogglePrivacy('profileVisibility', opt.value)}
                          className={cn(
                            'w-full p-4 rounded-xl border text-left transition-colors flex items-start gap-3.5 cursor-pointer',
                            selected
                              ? 'border-brand-500 bg-brand-50/40'
                              : 'border-neutral-200 bg-surface hover:border-neutral-300'
                          )}
                        >
                          <div
                            className={cn(
                              'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                              selected
                                ? 'bg-brand-50 text-brand-600'
                                : 'bg-neutral-100 text-neutral-600'
                            )}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-neutral-900">
                                {opt.title}
                              </span>
                              {selected && <Check size={16} className="text-brand-600" />}
                            </div>
                            <p className="text-xs text-neutral-600 leading-relaxed">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <p className="text-xs font-semibold text-neutral-800">
                      Ai có thể gửi tin nhắn trực tiếp cho tôi?
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 'everyone', label: 'Mọi sinh viên cùng trường' },
                        { value: 'followers', label: 'Chỉ người theo dõi và người cùng nhóm/CLB' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="whoCanMessage"
                            checked={privacy.whoCanMessage === opt.value}
                            onChange={() =>
                              handleTogglePrivacy('whoCanMessage', opt.value as any)
                            }
                            className="text-brand-600 focus:ring-brand-500"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quyền sử dụng dữ liệu cho Gợi ý kết nối (AI Matching)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 divide-y divide-neutral-100">
                  <div className="flex items-center justify-between pt-1">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-semibold text-neutral-800">
                        Cho phép gợi ý tham gia Nhóm kết nối (Group Matching)
                      </p>
                      <p className="text-xs text-neutral-500">
                        Hiển thị hồ sơ kỹ năng của bạn khi chủ nhóm tìm kiếm thành viên.
                      </p>
                    </div>
                    <Switch
                      checked={privacy.groupMatching}
                      onCheckedChange={(checked) => handleTogglePrivacy('groupMatching', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-semibold text-neutral-800">
                        Cho phép gợi ý Mentor phù hợp (Mentoring Matching)
                      </p>
                      <p className="text-xs text-neutral-500">
                        Gợi ý Mentor dựa trên môn học và nội dung bạn cần hỗ trợ.
                      </p>
                    </div>
                    <Switch
                      checked={privacy.mentoringMatching}
                      onCheckedChange={(checked) =>
                        handleTogglePrivacy('mentoringMatching', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. Account Section */}
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Tài khoản & Bảo mật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 max-w-md">
                  <FormField label="Email trường (Cố định, không thể thay đổi)">
                    <Input value={user?.email || ''} disabled className="bg-neutral-100" />
                  </FormField>

                  <div className="pt-2 border-t border-neutral-100 space-y-4">
                    <h4 className="text-xs font-bold text-neutral-900">Đổi mật khẩu</h4>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <FormField label="Mật khẩu hiện tại" required>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                      </FormField>

                      <FormField label="Mật khẩu mới (≥ 6 ký tự)" required>
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

                      <Button type="submit" size="sm" className="mt-1">
                        Cập nhật mật khẩu
                      </Button>
                    </form>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <h4 className="text-xs font-bold text-neutral-900">Phiên đăng nhập</h4>
                    <p className="text-xs text-neutral-500">
                      Đăng xuất khỏi tất cả các thiết bị khác đang duy trì phiên làm việc.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({ variant: 'success', title: 'Đã đăng xuất các thiết bị khác' })
                      }
                    >
                      Đăng xuất các thiết bị khác
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Notifications Section */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Tùy chọn nhận thông báo theo tính năng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-neutral-500">
                  Chọn kênh thông báo bạn muốn nhận cho từng loại hoạt động trên hệ thống.
                </p>

                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700 font-semibold">
                      <tr>
                        <th className="p-3">Loại thông báo</th>
                        <th className="p-3 text-center w-28">Trong ứng dụng</th>
                        <th className="p-3 text-center w-28">Qua Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {[
                        { key: 'group', label: 'Yêu cầu tham gia nhóm kết nối' },
                        { key: 'club', label: 'Phản hồi đơn đăng ký cơ hội Câu lạc bộ' },
                        { key: 'program', label: 'Thông báo từ kênh Tình nguyện & Workshop' },
                        { key: 'event', label: 'Nhắc lịch sự kiện sắp diễn ra' },
                        { key: 'mentoring', label: 'Yêu cầu hỗ trợ Mentoring' },
                        { key: 'moderation', label: 'Kết quả kiểm duyệt nội dung (Bắt buộc)' },
                      ].map((row) => {
                        const isMandatory = row.key === 'moderation';
                        const current =
                          notificationPrefs[row.key as keyof typeof notificationPrefs];
                        return (
                          <tr key={row.key} className="hover:bg-neutral-50/50">
                            <td className="p-3 text-neutral-800 font-medium">{row.label}</td>
                            <td className="p-3 text-center">
                              <Switch
                                checked={current.inApp}
                                disabled={isMandatory}
                                onCheckedChange={(val) =>
                                  handleToggleNotification(row.key as any, 'inApp', val)
                                }
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Switch
                                checked={current.email}
                                onCheckedChange={(val) =>
                                  handleToggleNotification(row.key as any, 'email', val)
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Appearance Section */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Giao diện & Ngôn ngữ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 max-w-lg">
                  <FormField
                    label="Chủ đề hiển thị"
                    helperText="Tùy chọn chế độ Sáng, Tối hoặc Tự động đồng bộ theo hệ thống thiết bị."
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'light', label: 'Sáng', desc: 'Nền sáng chuẩn', icon: Sun },
                        { key: 'dark', label: 'Tối', desc: 'Dịu mắt ban đêm', icon: Moon },
                        { key: 'system', label: 'Hệ thống', desc: 'Theo thiết bị', icon: Monitor },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isCurrent = theme === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setTheme(item.key as any);
                              toast({ title: `Đã chuyển sang chủ đề: ${item.label}` });
                            }}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-start gap-2 ${
                              isCurrent
                                ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-xs'
                                : 'bg-surface border-neutral-200 hover:border-neutral-300 text-neutral-700'
                            }`}
                          >
                            <Icon size={18} className={isCurrent ? 'text-brand-600' : 'text-neutral-500'} />
                            <div>
                              <span className="text-xs font-bold block">{item.label}</span>
                              <span className="text-xs text-neutral-500 block mt-0.5">{item.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                </div>

                <div className="space-y-2 max-w-sm pt-4 border-t border-neutral-100">
                  <FormField label="Ngôn ngữ giao diện">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-brand-500 bg-brand-50/40">
                        <span className="text-xs font-semibold text-neutral-900">
                          Tiếng Việt (Mặc định)
                        </span>
                        <Check size={16} className="text-brand-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-neutral-100 opacity-60">
                        <span className="text-xs text-neutral-600">English (Sắp ra mắt)</span>
                      </div>
                    </div>
                  </FormField>
                </div>

                <div className="space-y-4 max-w-lg pt-4 border-t border-neutral-100">
                  <FormField
                    label="Kích thước chữ toàn hệ thống"
                    helperText="Tùy chỉnh cỡ chữ áp dụng tức thì cho mọi màn hình và chức năng."
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'sm', label: 'Nhỏ', desc: 'Chữ thân 13px' },
                        { key: 'md', label: 'Vừa (Mặc định)', desc: 'Chữ thân 15px' },
                        { key: 'lg', label: 'Lớn', desc: 'Chữ thân 17px' },
                        { key: 'xl', label: 'Rất lớn', desc: 'Chữ thân 19px' },
                      ].map((item) => {
                        const currentScale =
                          (localStorage.getItem('scs_font_scale') as any) || 'md';
                        const isCurrent = currentScale === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              document.documentElement.setAttribute('data-font-scale', item.key);
                              localStorage.setItem('scs_font_scale', item.key);
                              toast({ title: `Đã đổi cỡ chữ: ${item.label}` });
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-xs'
                                : 'bg-surface border-neutral-200 hover:border-neutral-300 text-neutral-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">{item.label}</span>
                            <span className="text-xs text-neutral-500 block mt-0.5">
                              {item.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormField>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-700">
                    <span className="text-xs font-semibold text-neutral-900 block mb-1">
                      Xem trước trực quan:
                    </span>
                    <p className="text-sm leading-relaxed">
                      Đây là đoạn văn bản mẫu để bạn kiểm tra cỡ chữ hiển thị trên giao diện của SCS.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
