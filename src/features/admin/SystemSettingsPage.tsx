import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { Sparkles, Bell, Sliders, Save } from 'lucide-react';
import type { SystemSettings } from '@/types/entities';

interface LocalSettings {
  aiFeatures: {
    swapMatching: boolean;
    groupMatching: boolean;
    mentoringMatching: boolean;
  };
  notifications: {
    emailDigest: boolean;
    realtimePush: boolean;
  };
  privacyDefault: string;
  moderationThreshold: number;
  autoHideReportThreshold: number;
  maxActiveProgramChannelsPerStudent: number;
}

export const SystemSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSystemAdmin =
    user?.roles.includes('system_admin') || user?.roles.includes('SystemAdmin');

  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => apiClient.get<SystemSettings>('/admin/settings'),
  });

  const [settings, setSettings] = useState<LocalSettings>({
    aiFeatures: {
      swapMatching: true,
      groupMatching: true,
      mentoringMatching: true,
    },
    notifications: {
      emailDigest: true,
      realtimePush: true,
    },
    privacyDefault: 'members',
    moderationThreshold: 0.85,
    autoHideReportThreshold: 5,
    maxActiveProgramChannelsPerStudent: 2,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (settingsQuery.data && !isInitialized) {
      setSettings((prev) => ({
        ...prev,
        ...(settingsQuery.data as any),
      }));
      setIsInitialized(true);
    }
  }, [settingsQuery.data, isInitialized]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: LocalSettings) =>
      apiClient.put<SystemSettings>('/admin/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Đã lưu cấu hình hệ thống thành công!');
    },
    onError: () => {
      toast.error('Lưu cấu hình thất bại, vui lòng thử lại');
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quản lý cài đặt mô-đun AI, luồng thông báo, ngưỡng tự động tạm ẩn báo cáo và giới hạn mở kênh chương trình"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Cấu hình hệ thống' },
        ]}
      />

      <QueryBoundary queries={[settingsQuery]}>
        <Tabs defaultValue="moderation" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="moderation" className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Kiểm duyệt & Kênh
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Mô-đun AI
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Thông báo
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MODERATION & CHANNEL LIMITS */}
          <TabsContent value="moderation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-600" /> Ngưỡng kiểm duyệt & Giới hạn mở kênh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-800 block">
                      Ngưỡng tự động tạm ẩn khi bị báo cáo (Auto-hide)
                    </label>
                    <Input
                      type="number"
                      min={2}
                      max={20}
                      value={settings.autoHideReportThreshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoHideReportThreshold: Number(e.target.value) || 5,
                        })
                      }
                      disabled={!isSystemAdmin}
                    />
                    <p className="text-xs text-neutral-500">
                      Nội dung nhận đủ số lượt báo cáo này sẽ chuyển sang trạng thái{' '}
                      <code>TemporarilyHidden</code> chờ quản trị viên xét duyệt.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-800 block">
                      Giới hạn số kênh Tình nguyện & Workshop mở đồng thời / sinh viên
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={settings.maxActiveProgramChannelsPerStudent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxActiveProgramChannelsPerStudent: Number(e.target.value) || 2,
                        })
                      }
                      disabled={!isSystemAdmin}
                    />
                    <p className="text-xs text-neutral-500">
                      Số kênh tối đa ở trạng thái Chờ duyệt hoặc Đang mở mà một sinh viên được phép đứng tên cùng lúc.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 max-w-md pt-2 border-t border-neutral-100">
                  <label className="text-xs font-semibold text-neutral-800 block">
                    Quyền hiển thị hồ sơ mặc định cho tài khoản mới
                  </label>
                  <Select
                    value={settings.privacyDefault}
                    onChange={(e) =>
                      setSettings({ ...settings, privacyDefault: e.target.value })
                    }
                    options={[
                      { value: 'members', label: 'Mọi thành viên đăng nhập (members)' },
                      { value: 'followers', label: 'Chỉ người theo dõi đã chấp nhận (followers)' },
                      { value: 'private', label: 'Riêng tư (private)' },
                    ]}
                  />
                </div>
              </CardContent>
              {isSystemAdmin && (
                <CardFooter className="border-t border-neutral-100 pt-4 flex justify-end">
                  <Button
                    onClick={() => updateSettingsMutation.mutate(settings)}
                    loading={updateSettingsMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1.5" /> Lưu thay đổi
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* TAB 2: AI MODULES */}
          <TabsContent value="ai" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" /> Bật / Tắt dịch vụ AI theo phân hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div>
                    <div className="font-semibold text-sm text-neutral-900">
                      Gợi ý hoán đổi lịch học (Swap AI Match)
                    </div>
                    <span className="text-xs text-neutral-500">
                      Tự động tìm kiếm và so sánh lịch rảnh lớp học phần
                    </span>
                  </div>
                  <Switch
                    checked={settings.aiFeatures.swapMatching}
                    onCheckedChange={(c) =>
                      setSettings({
                        ...settings,
                        aiFeatures: { ...settings.aiFeatures, swapMatching: c },
                      })
                    }
                    disabled={!isSystemAdmin}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div>
                    <div className="font-semibold text-sm text-neutral-900">
                      Gợi ý thành viên & nhóm kết nối (Group AI Match)
                    </div>
                    <span className="text-xs text-neutral-500">
                      Phân tích kỹ năng, đề tài và lịch rảnh
                    </span>
                  </div>
                  <Switch
                    checked={settings.aiFeatures.groupMatching}
                    onCheckedChange={(c) =>
                      setSettings({
                        ...settings,
                        aiFeatures: { ...settings.aiFeatures, groupMatching: c },
                      })
                    }
                    disabled={!isSystemAdmin}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div>
                    <div className="font-semibold text-sm text-neutral-900">
                      Kết nối Mentor thông minh (Mentoring AI Match)
                    </div>
                    <span className="text-xs text-neutral-500">
                      Đối chiếu nhu cầu học tập với năng lực của Mentor
                    </span>
                  </div>
                  <Switch
                    checked={settings.aiFeatures.mentoringMatching}
                    onCheckedChange={(c) =>
                      setSettings({
                        ...settings,
                        aiFeatures: { ...settings.aiFeatures, mentoringMatching: c },
                      })
                    }
                    disabled={!isSystemAdmin}
                  />
                </div>
              </CardContent>
              {isSystemAdmin && (
                <CardFooter className="border-t border-neutral-100 pt-4 flex justify-end">
                  <Button
                    onClick={() => updateSettingsMutation.mutate(settings)}
                    loading={updateSettingsMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1.5" /> Lưu thay đổi
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* TAB 3: NOTIFICATIONS */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-600" /> Kênh phát thông báo hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div>
                    <div className="font-semibold text-sm text-neutral-900">
                      Gửi Email thông báo tổng hợp (Email Digest)
                    </div>
                    <span className="text-xs text-neutral-500">
                      Gửi email hàng tuần tóm tắt hoạt động nhóm, CLB và chương trình
                    </span>
                  </div>
                  <Switch
                    checked={settings.notifications.emailDigest}
                    onCheckedChange={(c) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailDigest: c },
                      })
                    }
                    disabled={!isSystemAdmin}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div>
                    <div className="font-semibold text-sm text-neutral-900">
                      Thông báo tức thời (In-App Push)
                    </div>
                    <span className="text-xs text-neutral-500">
                      Hiện thông báo chuông cho tin nhắn và cập nhật trạng thái đơn đăng ký
                    </span>
                  </div>
                  <Switch
                    checked={settings.notifications.realtimePush}
                    onCheckedChange={(c) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, realtimePush: c },
                      })
                    }
                    disabled={!isSystemAdmin}
                  />
                </div>
              </CardContent>
              {isSystemAdmin && (
                <CardFooter className="border-t border-neutral-100 pt-4 flex justify-end">
                  <Button
                    onClick={() => updateSettingsMutation.mutate(settings)}
                    loading={updateSettingsMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1.5" /> Lưu thay đổi
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </QueryBoundary>
    </div>
  );
};

export default SystemSettingsPage;
