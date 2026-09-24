import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { BookOpen, Plus, Users, Edit3 } from 'lucide-react';
import type { MentoringPost } from '@/types/entities';

export const MentorPostsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MentoringPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    field: 'Software Engineering',
    mode: 'Online',
    slots: 5,
  });

  const postsQuery = useQuery({
    queryKey: ['mentor', 'posts'],
    queryFn: () => apiClient.get<MentoringPost[]>('/mentor/posts'),
  });

  const savePostMutation = useMutation({
    mutationFn: () => {
      if (editingPost) {
        return apiClient.put(`/mentor/posts/${editingPost.id}`, formData);
      }
      return apiClient.post('/mentor/posts', formData);
    },
    onSuccess: () => {
      toast.success(editingPost ? 'Cập nhật bài đăng thành công!' : 'Tạo bài chia sẻ lớp học mới thành công!');
      setIsDialogOpen(false);
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ['mentor', 'posts'] });
    },
    onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại.'),
  });

  const toggleOpenMutation = useMutation({
    mutationFn: ({ id, open }: { id: string; open: boolean }) =>
      apiClient.put(`/mentor/posts/${id}`, { open }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái mở đăng ký!');
      queryClient.invalidateQueries({ queryKey: ['mentor', 'posts'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      field: 'Software Engineering',
      mode: 'Online',
      slots: 5,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (p: MentoringPost) => {
    setEditingPost(p);
    setFormData({
      title: p.title,
      content: p.content,
      field: p.field,
      mode: p.mode,
      slots: p.slots,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý lớp học & Bài đăng"
        description="Đăng tin mở lớp chia sẻ kinh nghiệm ôn thi, hướng dẫn đồ án hoặc workshop nhỏ"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentor Center' },
          { label: 'Bài đăng' },
        ]}
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> Tạo bài đăng mới
          </Button>
        }
      />

      <QueryBoundary queries={[postsQuery]}>
        {postsQuery.data && postsQuery.data.length === 0 ? (
          <EmptyState
            title="Chưa có bài đăng nào"
            description="Hãy tạo bài đăng đầu tiên để chiêu mộ học viên hoặc chia sẻ kỹ năng!"
            action={
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-1.5" /> Tạo bài đăng mới
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsQuery.data?.map((p) => (
              <Card key={p.id} className="flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{p.field}</Badge>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--text-muted)]">
                        {p.open ? 'Đang mở' : 'Đã đóng'}
                      </span>
                      <Switch
                        checked={p.open}
                        onCheckedChange={(checked) => toggleOpenMutation.mutate({ id: p.id, open: checked })}
                      />
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-[var(--text-muted)] line-clamp-3">
                    {p.content}
                  </p>
                  <div className="pt-2 text-xs text-[var(--text-subtle)] flex items-center justify-between">
                    <span>Hình thức: {p.mode}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {p.slots} slot
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(p)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Chỉnh sửa
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng lớp học mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Tiêu đề bài đăng" required>
              <Input
                placeholder="Ví dụ: Lớp cấp tốc ôn tập cấu trúc dữ liệu CSD201..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Chuyên ngành / Lĩnh vực" required>
                <Select
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  options={[
                    { label: 'Kỹ thuật phần mềm', value: 'Software Engineering' },
                    { label: 'An toàn thông tin', value: 'Information Assurance' },
                    { label: 'Trí tuệ nhân tạo', value: 'Artificial Intelligence' },
                  ]}
                />
              </FormField>

              <FormField label="Số lượng slot tối đa" required>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.slots}
                  onChange={(e) => setFormData({ ...formData, slots: Number(e.target.value) })}
                  required
                />
              </FormField>
            </div>

            <FormField label="Hình thức học">
              <Select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                options={[
                  { label: 'Online qua Google Meet', value: 'Online' },
                  { label: 'Offline tại Campus', value: 'Offline' },
                  { label: 'Hỗ trợ linh hoạt', value: 'Hybrid' },
                ]}
              />
            </FormField>

            <FormField label="Nội dung chi tiết & Lịch trình" required>
              <Textarea
                rows={4}
                placeholder="Mô tả các nội dung bài học, tài liệu cung cấp và thời gian tổ chức..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => savePostMutation.mutate()} loading={savePostMutation.isPending}>
              Lưu bài đăng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorPostsPage;
