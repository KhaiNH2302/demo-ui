import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { FormField } from '@/components/shared/FormField';
import { FileUploader } from '@/components/shared/FileUploader';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { toast } from '@/components/ui/Toast';
import { AlertCircle, AlertTriangle, Send, FileText } from 'lucide-react';
import type { Club, Recruitment, ClubApplication } from '@/types/entities';

export const ClubApplicationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clubQuery = useQuery({
    queryKey: queryKeys.clubs.detail(id!),
    queryFn: () => apiClient.get<Club>(`/clubs/${id}`),
    enabled: !!id,
  });

  const recruitmentsQuery = useQuery({
    queryKey: queryKeys.clubs.recruitments(id!),
    queryFn: () => apiClient.get<Recruitment[]>(`/clubs/${id}/recruitments`),
    enabled: !!id,
  });

  const existingAppQuery = useQuery({
    queryKey: ['applications', applicationId],
    queryFn: () => apiClient.get<ClubApplication>(`/applications/me`).then((apps: any) => apps.find((a: any) => a.id === applicationId)),
    enabled: !!applicationId,
  });

  const recruitment = recruitmentsQuery.data?.find((r) => r.status === 'Published');
  const isSupplementMode = !!applicationId && existingAppQuery.data?.status === 'NeedsSupplement';

  useEffect(() => {
    if (existingAppQuery.data?.answers) {
      setAnswers(existingAppQuery.data.answers);
    }
  }, [existingAppQuery.data]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (isSupplementMode) {
        return apiClient.put(`/applications/${applicationId}/supplement`, { answers });
      }
      return apiClient.post(`/clubs/${id}/applications`, {
        recruitmentId: recruitment?.id,
        answers,
      });
    },
    onSuccess: () => {
      toast.success(isSupplementMode ? 'Đã cập nhật bổ sung hồ sơ thành công!' : 'Nộp đơn ứng tuyển thành công!');
      queryClient.invalidateQueries({ queryKey: ['applications', 'me'] });
      navigate('/applications');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Có lỗi xảy ra khi nộp đơn.';
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const isSubmitDisabled = !recruitment && !isSupplementMode;

  return (
    <QueryBoundary queries={[clubQuery, recruitmentsQuery]}>
      {clubQuery.data && (
        <div className="max-w-2xl mx-auto space-y-6">
          <PageHeader
            title={isSupplementMode ? `Bổ sung hồ sơ — ${clubQuery.data.name}` : `Ứng tuyển CLB: ${clubQuery.data.name}`}
            description={recruitment?.title || 'Đợt tuyển thành viên mới'}
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Câu lạc bộ', href: '/clubs' },
              { label: clubQuery.data.name, href: `/clubs/${id}` },
              { label: 'Nộp đơn ứng tuyển' },
            ]}
          />

          {/* Supplement Banner */}
          {isSupplementMode && existingAppQuery.data?.supplementNote && (
            <Alert variant="attention" title="Yêu cầu bổ sung thông tin từ Ban Chủ nhiệm:">
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="w-4 h-4 text-[var(--status-attention-fg)]" />
                <span>{existingAppQuery.data.supplementNote}</span>
              </div>
            </Alert>
          )}

          {/* Conflict / Scenario Error Alert */}
          {errorMessage && (
            <Alert variant="danger" title="Không thể nộp đơn">
              <div className="flex items-center gap-2 mt-1">
                <AlertCircle className="w-4 h-4 text-[var(--status-danger-fg)]" />
                <span>{errorMessage}</span>
              </div>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Thông tin ứng tuyển
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Dynamic Questions */}
              {recruitment?.questions && recruitment.questions.length > 0 ? (
                recruitment.questions.map((q) => (
                  <FormField
                    key={q.id}
                    label={q.label}
                    required={q.required}
                  >
                    <Textarea
                      rows={3}
                      placeholder="Nhập câu trả lời của bạn..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                  </FormField>
                ))
              ) : (
                <>
                  <FormField label="Lý do bạn muốn tham gia CLB?" required>
                    <Textarea
                      rows={3}
                      placeholder="Chia sẻ lý do và nguyện vọng của bạn khi tham gia..."
                      value={answers['default_reason'] || ''}
                      onChange={(e) => handleAnswerChange('default_reason', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Kinh nghiệm hoặc kỹ năng liên quan">
                    <Textarea
                      rows={3}
                      placeholder="Mô tả kỹ năng, dự án hoặc kinh nghiệm bạn đã tích lũy..."
                      value={answers['default_exp'] || ''}
                      onChange={(e) => handleAnswerChange('default_exp', e.target.value)}
                    />
                  </FormField>
                </>
              )}

              {/* CV File Upload */}
              <div>
                <FormField label="Hồ sơ đính kèm (CV / Portfolio nếu có)">
                  <FileUploader
                    accept=".pdf,.doc,.docx"
                    maxSizeMb={10}
                    files={files}
                    onFilesChange={setFiles}
                  />
                </FormField>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Hủy bỏ
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                loading={submitMutation.isPending}
                disabled={isSubmitDisabled || !!errorMessage}
              >
                <Send className="w-4 h-4 mr-1.5" />
                {isSupplementMode ? 'Gửi bổ sung' : 'Nộp đơn ứng tuyển'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </QueryBoundary>
  );
};

export default ClubApplicationFormPage;
