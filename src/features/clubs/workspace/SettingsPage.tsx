import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { Settings, ShieldAlert, Save } from 'lucide-react';
import type { Club } from '@/types/entities';

export const ClubSettingsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, getClubRole } = useAuthStore();
  const role = getClubRole(clubId || '');
  const isManager = role === 'manager';

  const [formData, setFormData] = useState<Partial<Club>>({
    name: '',
    field: '',
    description: '',
  });

  const clubQuery = useQuery({
    queryKey: queryKeys.clubs.detail(clubId!),
    queryFn: () => apiClient.get<Club>(`/clubs/${clubId}`),
    enabled: !!clubId,
  });

  useEffect(() => {
    if (clubQuery.data) {
      setFormData({
        name: clubQuery.data.name,
        field: clubQuery.data.field,
        description: clubQuery.data.description,
      });
    }
  }, [clubQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Club>) => apiClient.put(`/clubs/${clubId}/settings`, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin CLB thành công!');
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.detail(clubId!) });
    },
    onError: () => toast.error('Cập nhật thất bại.'),
  });

  if (!isManager && user?.roles.includes('student')) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-[var(--status-danger-fg)] mx-auto" />
        <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Chỉ Ban Chủ nhiệm CLB (Manager) mới có quyền truy cập cài đặt cấu hình.
        </p>
        <Button onClick={() => navigate(`/clubs/${clubId}/workspace/overview`)}>
          Quay lại Workspace
        </Button>
      </div>
    );
  }

  return (
    <QueryBoundary queries={[clubQuery]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Cài đặt thông tin CLB"
          description="Chỉnh sửa thông tin giới thiệu, lĩnh vực và hồ sơ hiển thị công khai"
          breadcrumbs={[
            { label: 'CLB', href: `/clubs/${clubId}` },
            { label: 'Workspace', href: `/clubs/${clubId}/workspace/overview` },
            { label: 'Cài đặt' },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" /> Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Tên câu lạc bộ" required>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Lĩnh vực hoạt động" required>
              <Select
                value={formData.field || 'Công nghệ'}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                options={[
                  { label: 'Công nghệ & Học thuật', value: 'Công nghệ' },
                  { label: 'Nghệ thuật & Âm nhạc', value: 'Nghệ thuật' },
                  { label: 'Thể thao & Sức khỏe', value: 'Thể thao' },
                  { label: 'Tình nguyện & Xã hội', value: 'Tình nguyện' },
                  { label: 'Kỹ năng & Khởi nghiệp', value: 'Kỹ năng' },
                ]}
              />
            </FormField>

            <FormField label="Mô tả giới thiệu" required>
              <Textarea
                rows={5}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
            <Button
              onClick={() => updateMutation.mutate(formData)}
              loading={updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" /> Lưu thay đổi
            </Button>
          </CardFooter>
        </Card>
      </div>
    </QueryBoundary>
  );
};

export default ClubSettingsPage;
