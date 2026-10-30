import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorState } from '@/components/shared/ErrorState';
import { apiClient } from '@/lib/apiClient';
import { useGuardedAction } from '@/lib/guestGate';
import { toast } from '@/components/ui/Toast';
import type { RecruitmentQuestion } from './engagementMocks';

export function RecruitmentQuestions({
  opportunityId,
  canAnswer,
  acceptingQuestions,
}: {
  opportunityId: string;
  canAnswer: boolean;
  acceptingQuestions: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const client = useQueryClient();
  const guard = useGuardedAction();
  const key = ['clubs', 'questions', opportunityId];
  const query = useQuery<RecruitmentQuestion[]>({
    queryKey: key,
    queryFn: () =>
      apiClient.get(`/clubs/opportunities/${opportunityId}/questions`),
  });
  const ask = useMutation({
    mutationFn: () =>
      apiClient.post(`/clubs/opportunities/${opportunityId}/questions`, {
        question,
      }),
    onSuccess: () => {
      setQuestion('');
      client.invalidateQueries({ queryKey: key });
      toast.success('Đã gửi câu hỏi công khai tới CLB');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const reply = useMutation({
    mutationFn: (id: string) =>
      apiClient.put(`/clubs/opportunities/${opportunityId}/questions/${id}`, {
        answer: answers[id],
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: key });
      toast.success('Đã cập nhật câu trả lời');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Card id="questions" className="p-5 sm:p-6 space-y-4">
      <h2 className="text-section-title flex items-center gap-2 text-neutral-900">
        <HelpCircle size={20} />
        Hỏi đáp trước khi ứng tuyển
      </h2>
      <p className="text-sm text-neutral-600">
        Hỏi về công việc, kỹ năng hoặc thời gian cam kết. Câu hỏi và phản hồi
        của đại diện CLB hiển thị công khai; không đăng thông tin cá nhân.
      </p>
      {query.isPending ? (
        <p role="status" className="text-sm text-neutral-600">
          Đang tải câu hỏi…
        </p>
      ) : query.isError ? (
        <ErrorState
          title="Chưa tải được hỏi đáp"
          onRetry={() => query.refetch()}
        />
      ) : !query.data.length ? (
        <p className="py-3 text-sm text-neutral-600">
          Chưa có câu hỏi. Bạn có thể mở đầu cuộc trao đổi với CLB.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {query.data.map((item) => (
            <li key={item.id} className="py-4 space-y-2">
              <p className="font-medium text-sm text-neutral-900 whitespace-pre-wrap break-words">
                {item.question}
              </p>
              <p className="text-xs text-neutral-600">
                {item.authorName} ·{' '}
                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
              </p>
              {item.answer ? (
                <div className="rounded-lg bg-neutral-50 p-3 text-sm">
                  <p className="font-medium text-brand-700">
                    {item.answeredBy} · Đại diện CLB
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-neutral-700">
                    {item.answer}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-600">Đang chờ CLB trả lời</p>
              )}
              {canAnswer && (
                <form
                  className="space-y-2 pt-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    reply.mutate(item.id);
                  }}
                >
                  <label
                    htmlFor={`reply-${item.id}`}
                    className="text-sm font-medium text-neutral-700"
                  >
                    {item.answer ? 'Cập nhật phản hồi' : 'Trả lời câu hỏi'}
                  </label>
                  <Textarea
                    id={`reply-${item.id}`}
                    rows={2}
                    maxLength={2000}
                    value={answers[item.id] ?? item.answer ?? ''}
                    onChange={(event) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [item.id]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    type="submit"
                    loading={reply.isPending}
                    disabled={!answers[item.id]?.trim()}
                  >
                    Đăng phản hồi
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {acceptingQuestions && (
        <form
          className="space-y-2 border-t border-neutral-200 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            guard('register_opportunity', () => ask.mutate())();
          }}
        >
          <label
            htmlFor="recruitment-question"
            className="text-sm font-medium text-neutral-800"
          >
            Câu hỏi của bạn
          </label>
          <Textarea
            id="recruitment-question"
            value={question}
            maxLength={1000}
            rows={3}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ví dụ: Ban Truyền thông có nhận bạn chưa từng dùng công cụ thiết kế không?"
          />
          <Button
            type="submit"
            size="sm"
            loading={ask.isPending}
            disabled={question.trim().length < 5}
          >
            Gửi câu hỏi
          </Button>
        </form>
      )}
    </Card>
  );
}
