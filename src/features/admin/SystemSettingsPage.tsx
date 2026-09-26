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
import { toast } from '@/components/ui/Toast';
import { Settings, Sparkles, Bell, Sliders, Save } from 'lucide-react';
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
}

export const SystemSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSystemAdmin = user?.roles.includes('SystemAdmin') || user?.roles.includes('SchoolAdmin');

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
    privacyDefault: 'public',
    moderationThreshold: 0.85,
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
        description="Quản lý cài đặt mô-đun AI, luồng thông báo và các tham số kiểm duyệt toàn trường"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Cấu hình hệ thống' },
        ]}
      />

      <QueryBoundary queries={[settingsQuery]}>
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="ai" className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Mô-đun AI
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Thông báo
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Kiểm duyệt
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AI MODULES */}
          <TabsContent value="ai" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Bật / Tắt dịch vụ AI theo phân hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Gợi ý hoán đổi lịch học (Swap AI Match)</div>
                    <span className="text-xs text-[var(--text-muted)]">Tự động tìm kiếm và so sánh lịch rảnh lớp học phần</span>
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

                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Gợi ý thành viên & nhóm kết nối (Group AI Match)</div>
                    <span className="text-xs text-[var(--text-muted)]">Phân tích kỹ năng, đề tài và lịch rảnh biểu đồ</span>
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

                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Kết nối Mentor thông minh (Mentoring AI Match)</div>
                    <span className="text-xs text-[var(--text-muted)]">Đối chiếu nhu cầu học tập với năng lực và lịch rảnh của Mentor</span>
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
                <CardFooter className="border-t border-[var(--border-subtle)] pt-4 flex justify-end">
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

          {/* TAB 2: NOTIFICATIONS */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> Kênh phát thông báo hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Gửi Email thông báo tổng hợp (Email Digest)</div>
                    <span className="text-xs text-[var(--text-muted)]">Gửi email hàng tuần tóm tắt hoạt động nhóm và CLB</span>
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

                <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">Thông báo tức thời (In-App Push)</div>
                    <span className="text-xs text-[var(--text-muted)]">Hiện thông báo chuông cho tin nhắn và cập nhật hồ sơ</span>
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
                <CardFooter className="border-t border-[var(--border-subtle)] pt-4 flex justify-end">
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

          {/* TAB 3: MODERATION */}
          <TabsContent value="moderation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" /> Ngưỡng kiểm duyệt tự động (Auto-flag)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Độ nhạy AI gắn cờ vi phạm:</span>
                    <span className="font-bold text-primary">{Math.round((settings.moderationThreshold || 0.85) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={settings.moderationThreshold || 0.85}
                    onChange={(e) => setSettings({ ...settings, moderationThreshold: Number(e.target.value) })}
                    disabled={!isSystemAdmin}
                    className="w-full"
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    Bài viết hoặc bình luận có điểm nghi vấn vượt mức ngưỡng này sẽ tự động chuyển vào hàng đợi kiểm duyệt trước khi hiển thị.
                  </p>
                </div>
              </CardContent>
              {isSystemAdmin && (
                <CardFooter className="border-t border-[var(--border-subtle)] pt-4 flex justify-end">
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
