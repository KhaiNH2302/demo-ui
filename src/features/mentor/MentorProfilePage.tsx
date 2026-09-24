import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from '@/components/ui/Toast';
import { Award, Save, Sparkles, UserCheck } from 'lucide-react';
import type { Mentor } from '@/types/entities';

export const MentorProfilePage: React.FC = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['mentor', 'profile'],
    queryFn: () => apiClient.get<Mentor | null>('/mentor/profile'),
  });

  const [formData, setFormData] = useState<Partial<Mentor>>({
    fields: ['Software Engineering'],
    subjects: ['CSD201', 'PRJ301'],
    experience: '',
    availability: [
      { day: 'Tue', start: '19:00', end: '21:00' },
      { day: 'Thu', start: '19:00', end: '21:00' },
    ],
    supportModes: ['online', 'chat'],
    acceptingRequests: true,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (profileQuery.data && !isInitialized) {
      setFormData(profileQuery.data);
      setIsInitialized(true);
    }
  }, [profileQuery.data, isInitialized]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<Mentor>) => apiClient.put<Mentor>('/mentor/profile', data),
    onSuccess: () => {
      toast.success('Lưu thông tin hồ sơ Mentor thành công!');
      queryClient.invalidateQueries({ queryKey: ['mentor', 'profile'] });
    },
    onError: () => toast.error('Cập nhật thất bại, vui lòng thử lại.'),
  });

  const handleModeToggle = (mode: 'online' | 'offline' | 'chat') => {
    const current = formData.supportModes || [];
    const exists = current.includes(mode);
    const updated = exists ? current.filter((m) => m !== mode) : [...current, mode];
    setFormData({ ...formData, supportModes: updated });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Hồ sơ Mentor của bạn"
        description="Thiết lập môn học phụ trách, kinh nghiệm, khung giờ rảnh và trạng thái nhận học viên"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentor Center' },
          { label: 'Hồ sơ Mentor' },
        ]}
      />

      <QueryBoundary queries={[profileQuery]}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Thông tin chuyên môn & Năng lực
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Nhận yêu cầu:</span>
                <Switch
                  checked={formData.acceptingRequests || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptingRequests: checked })}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <FormField label="Lĩnh vực chuyên môn" required>
              <TagInput
                tags={formData.fields || []}
                onChange={(tags) => setFormData({ ...formData, fields: tags })}
                placeholder="Nhập lĩnh vực rồi nhấn Enter..."
              />
            </FormField>

            <FormField label="Các môn học nhận hỗ trợ sinh viên" required>
              <TagInput
                tags={formData.subjects || []}
                onChange={(tags) => setFormData({ ...formData, subjects: tags })}
                placeholder="Nhập mã môn học (vd: CSD201, PRJ301, MAS291)..."
              />
            </FormField>

            <FormField label="Kinh nghiệm & Thành tích nổi bật" required>
              <Textarea
                rows={4}
                placeholder="Ví dụ: Điểm A+ các môn chuyên ngành, Top 5 Hackathon, Kinh nghiệm 1 năm trợ giảng..."
                value={formData.experience || ''}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </FormField>

            <FormField label="Khung giờ rảnh có thể hướng dẫn">
              <ScheduleInput
                value={formData.availability || []}
                onChange={(slots) => setFormData({ ...formData, availability: slots })}
              />
            </FormField>

            <div>
              <label className="text-sm font-semibold block mb-2">Hình thức hỗ trợ</label>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.supportModes?.includes('online')}
                    onChange={() => handleModeToggle('online')}
                    className="rounded"
                  />
                  <span>Online (Google Meet / Discord)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.supportModes?.includes('offline')}
                    onChange={() => handleModeToggle('offline')}
                    className="rounded"
                  />
                  <span>Gặp trực tiếp tại Campus</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.supportModes?.includes('chat')}
                    onChange={() => handleModeToggle('chat')}
                    className="rounded"
                  />
                  <span>Trao đổi tin nhắn (Q&A)</span>
                </label>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-[var(--border-subtle)] pt-4 flex justify-end">
            <Button
              onClick={() => updateProfileMutation.mutate(formData)}
              loading={updateProfileMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" /> Lưu hồ sơ Mentor
            </Button>
          </CardFooter>
        </Card>
      </QueryBoundary>
    </div>
  );
};

export default MentorProfilePage;
