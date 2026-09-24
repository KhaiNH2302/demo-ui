import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { Users, Plus, Calendar, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import type { Recruitment } from '@/types/entities';

export const ClubRecruitmentsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState('');
  const [deadline, setDeadline] = useState('');
  const [quota, setQuota] = useState(10);
  const [questions, setQuestions] = useState<{ id: string; label: string; required: boolean }[]>([
    { id: 'q1', label: 'Tại sao bạn muốn tham gia CLB này?', required: true },
    { id: 'q2', label: 'Bạn có kinh nghiệm gì trong lĩnh vực liên quan?', required: false },
  ]);

  const recruitmentsQuery = useQuery({
    queryKey: queryKeys.clubs.recruitments(clubId!),
    queryFn: () => apiClient.get<Recruitment[]>(`/clubs/${clubId}/recruitments`),
    enabled: !!clubId,
  });

  const createRecruitmentMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/clubs/${clubId}/recruitments`, {
        title,
        criteria,
        deadline,
        quota: Number(quota),
        status: 'Published',
        questions,
      }),
    onSuccess: () => {
      toast.success('Công bố đợt tuyển thành viên thành công!');
      setIsCreateOpen(false);
      setTitle('');
      setCriteria('');
      setDeadline('');
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.recruitments(clubId!) });
    },
    onError: () => toast.error('Có lỗi xảy ra khi tạo đợt tuyển.'),
  });

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: `q_${Date.now()}`, label: '', required: false }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: 'label' | 'required', val: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline || quota <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin hợp lệ');
      return;
    }
    createRecruitmentMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đợt tuyển thành viên"
        description="Mở các đợt chiêu mộ thành viên mới, tạo bảng câu hỏi ứng tuyển và duyệt hồ sơ"
        breadcrumbs={[
          { label: 'CLB', href: `/clubs/${clubId}` },
          { label: 'Workspace', href: `/clubs/${clubId}/workspace/overview` },
          { label: 'Tuyển thành viên' },
        ]}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Tạo đợt tuyển mới
          </Button>
        }
      />

      <QueryBoundary queries={[recruitmentsQuery]}>
        {recruitmentsQuery.data && recruitmentsQuery.data.length === 0 ? (
          <EmptyState
            title="Chưa có đợt tuyển nào"
            description="Hãy tạo đợt tuyển thành viên đầu tiên để đón nhận các sinh viên tài năng vào CLB!"
            action={
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Tạo đợt tuyển mới
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruitmentsQuery.data?.map((rec) => (
              <Card key={rec.id} className="flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={rec.status} domain="clubs" />
                    <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Chỉ tiêu: {rec.acceptedCount}/{rec.quota}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{rec.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-[var(--text-muted)] line-clamp-3">
                    {rec.criteria}
                  </p>
                  <div className="pt-2 text-xs text-[var(--text-subtle)] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hạn nộp: {new Date(rec.deadline).toLocaleDateString('vi-VN')}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                  <span className="text-xs text-[var(--text-muted)]">
                    {rec.questions.length} câu hỏi form
                  </span>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/clubs/${clubId}/workspace/recruitments/${rec.id}/applications`)}
                  >
                    Xem & Xét duyệt đơn <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>

      {/* Create Recruitment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo đợt tuyển thành viên mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <FormField label="Tiêu đề đợt tuyển" required>
              <Input
                placeholder="Ví dụ: Tuyển thành viên Gen 8 - Khối Chuyên môn & Truyền thông"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Tiêu chí tuyển chọn & Quyền lợi" required>
              <Textarea
                rows={3}
                placeholder="Mô tả các yêu cầu cơ bản, tiêu chuẩn đánh giá và quyền lợi thành viên..."
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Hạn chót nộp đơn" required>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Chỉ tiêu tiếp nhận" required>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={quota}
                  onChange={(e) => setQuota(Number(e.target.value))}
                  required
                />
              </FormField>
            </div>

            {/* Questions Builder */}
            <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Bảng câu hỏi nộp đơn ({questions.length})</span>
                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm câu hỏi
                </Button>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="flex items-center gap-3 p-3 bg-[var(--surface-muted)] rounded-lg">
                  <span className="text-xs font-bold text-primary">#{idx + 1}</span>
                  <Input
                    className="flex-1 bg-[var(--surface-card)]"
                    placeholder="Nội dung câu hỏi..."
                    value={q.label}
                    onChange={(e) => handleQuestionChange(idx, 'label', e.target.value)}
                    required
                  />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => handleQuestionChange(idx, 'required', e.target.checked)}
                      className="rounded"
                    />
                    <span>Bắt buộc</span>
                  </label>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[var(--status-danger-fg)]"
                      onClick={() => handleRemoveQuestion(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" loading={createRecruitmentMutation.isPending}>
                <Sparkles className="w-4 h-4 mr-1.5" /> Công bố đợt tuyển
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubRecruitmentsPage;
