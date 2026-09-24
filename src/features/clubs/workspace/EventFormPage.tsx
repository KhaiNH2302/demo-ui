import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { Calendar, Plus } from 'lucide-react';
import type { ClubEvent } from '@/types/entities';

export const ClubEventFormPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
    capacity: 50,
  });

  const createEventMutation = useMutation({
    mutationFn: () =>
      apiClient.post<ClubEvent>(`/clubs/${clubId}/events`, {
        ...formData,
        capacity: Number(formData.capacity),
      }),
    onSuccess: () => {
      toast.success('Tạo và công bố sự kiện thành công!');
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.events(clubId!) });
      navigate(`/clubs/${clubId}/workspace/events`);
    },
    onError: () => toast.error('Có lỗi xảy ra khi tạo sự kiện.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên sự kiện');
      return;
    }
    if (!formData.startAt || !formData.endAt) {
      toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }
    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      toast.error('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu');
      return;
    }
    if (formData.capacity <= 0) {
      toast.error('Sức chứa sự kiện phải lớn hơn 0');
      return;
    }
    createEventMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Tạo sự kiện câu lạc bộ"
        description="Lên kế hoạch và công bố hoạt động, workshop hoặc buổi sinh hoạt mới"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Sự kiện', href: `/clubs/${clubId}/workspace/events` },
          { label: 'Tạo mới' },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Thông tin sự kiện
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField label="Tên sự kiện" required>
              <Input
                placeholder="Ví dụ: Workshop Lập trình React Native căn bản..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Thời gian bắt đầu" required>
                <Input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Thời gian kết thúc" required>
                <Input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Địa điểm tổ chức" required>
                <Input
                  placeholder="Ví dụ: Hội trường B, Phòng 402 hoặc Google Meet..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Sức chứa (người tham gia tối đa)" required>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  required
                />
              </FormField>
            </div>

            <FormField label="Mô tả & Kế hoạch nội dung">
              <Textarea
                rows={4}
                placeholder="Mô tả chi tiết nội dung chương trình, diễn giả và quyền lợi người tham dự..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormField>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/clubs/${clubId}/workspace/events`)}
            >
              Hủy
            </Button>
            <Button type="submit" loading={createEventMutation.isPending}>
              <Plus className="w-4 h-4 mr-1.5" /> Công bố sự kiện
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ClubEventFormPage;
