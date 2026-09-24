import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { Building2, Send } from 'lucide-react';
import type { Club } from '@/types/entities';

export const RegisterClubPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    field: 'Công nghệ',
    description: '',
  });

  const registerMutation = useMutation({
    mutationFn: () => apiClient.post<Club>('/clubs', formData),
    onSuccess: () => {
      toast.success('Gửi hồ sơ đăng ký CLB thành công! Hồ sơ đang chờ Ban Giám hiệu / Admin phê duyệt.');
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      navigate('/clubs');
    },
    onError: () => {
      toast.error('Đăng ký thất bại, vui lòng kiểm tra lại thông tin.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên câu lạc bộ');
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Đăng ký thành lập Câu lạc bộ mới"
        description="Gửi đề xuất thành lập tổ chức hoặc CLB sinh viên trực thuộc nhà trường"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Câu lạc bộ', href: '/clubs' },
          { label: 'Đăng ký mới' },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Thông tin đăng ký CLB
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField label="Tên câu lạc bộ / Tổ chức" required>
              <Input
                placeholder="Ví dụ: FPT Software Club (F-Soft), CLB Guitar FPT..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Lĩnh vực hoạt động" required>
              <Select
                value={formData.field}
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

            <FormField label="Mục đích và Kế hoạch hoạt động ban đầu" required>
              <Textarea
                rows={5}
                placeholder="Trình bày mục đích thành lập, đối tượng hướng tới và định hướng sinh hoạt dự kiến..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </FormField>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/clubs')}>
              Hủy
            </Button>
            <Button type="submit" loading={registerMutation.isPending}>
              <Send className="w-4 h-4 mr-1.5" /> Gửi hồ sơ phê duyệt
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterClubPage;
