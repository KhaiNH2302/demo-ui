import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { DynamicForm } from '@/components/shared/DynamicForm';
import { OPPORTUNITY_TYPE_LABELS } from '@/components/shared/OpportunityCard';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { ErrorState } from '@/components/shared/ErrorState';
import { clubRegistrationUnavailable } from '@/features/programs/rules';
import type { ClubOpportunity, OpportunityResponse } from '@/types/entities';

interface OpportunityWithMyResponse extends ClubOpportunity {
  myResponse?: OpportunityResponse | null;
}

export const ClubOpportunityRegisterPage: React.FC = () => {
  const { oppId } = useParams<{ oppId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isRepresentativeOf } = useAuthStore();

  const { data: opp, isLoading, isError, refetch } = useQuery<OpportunityWithMyResponse>({
    queryKey: ['club-opportunity', oppId, user?.id],
    queryFn: () => apiClient.get(`/clubs/opportunities/${oppId}`),
    enabled: !!oppId,
  });

  const [positionId, setPositionId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [note, setNote] = useState('');
  const [visibleToCoParticipants, setVisibleToCoParticipants] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hydrated = useRef('');

  useEffect(() => {
    if (opp && hydrated.current !== `${opp.id}:${user?.id}`) {
      hydrated.current = `${opp.id}:${user?.id}`;
      if (opp.myResponse) {
        setPositionId(opp.myResponse.positionId || '');
        const map: Record<string, string | string[]> = {};
        opp.myResponse.answers.forEach((a) => {
          map[a.questionId] = a.value;
        });
        setAnswers(map);
        setNote(opp.myResponse.note || '');
        setVisibleToCoParticipants(opp.myResponse.visibleToCoParticipants);
      } else if (opp.positions && opp.positions.length > 0) {
        setPositionId(opp.positions.find((position) => position.registeredCount < position.quota)?.id || '');
      }
    }
  }, [opp, user?.id]);

  const submitMutation = useMutation({
    mutationFn: (isDraft: boolean) => {
      const formattedAnswers = (opp?.questions || []).map((q) => ({
        questionId: q.id,
        questionLabel: q.label,
        value: answers[q.id] || (q.kind === 'multi' ? [] : ''),
      }));
      return apiClient.post(`/clubs/opportunities/${oppId}/register`, {
        positionId: positionId || undefined,
        answers: formattedAnswers,
        note: note.trim() || undefined,
        visibleToCoParticipants,
        isDraft,
      });
    },
    onError: (error: Error) => toast.error(error.message),
    onSuccess: (res: any, isDraft) => {
      queryClient.invalidateQueries({ queryKey: ['club-opportunity', oppId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'registrations', 'me'] });
      if (isDraft) {
        toast.success('Đã lưu bản nháp đăng ký');
      } else {
        toast.success('Đã gửi đăng ký thành công!');
        navigate(`/clubs/registrations/${res.id}`);
      }
    },
  });

  if (isError || (!isLoading && !opp)) return <ErrorState title="Không thể tải cơ hội CLB" onRetry={() => refetch()} />;
  if (isLoading || !opp) {
    return <Card className="h-72 animate-pulse bg-neutral-100" />;
  }

  const unavailable = clubRegistrationUnavailable(opp, opp.myResponse) || (isRepresentativeOf(opp.clubId) ? 'Đại diện CLB không đăng ký cơ hội của chính CLB mình.' : null);
  if (unavailable) return <div className="space-y-4"><ErrorState title="Không thể đăng ký" message={unavailable} /><Link to={`/clubs/opportunities/${opp.id}`} className="text-brand-600">Quay lại cơ hội</Link></div>;

  const isSupplementMode = opp.myResponse?.status === 'NeedsMoreInfo';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (opp.positions?.length) {
      const selected = opp.positions.find(position => position.id === positionId);
      if (!selected || selected.registeredCount >= selected.quota) nextErrors.position = 'Chọn một vị trí còn chỉ tiêu.';
    }
    (opp.questions || []).forEach((q) => {
      if (q.required) {
        const val = answers[q.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
          nextErrors[q.id] = 'Vui lòng trả lời câu hỏi bắt buộc này.';
        }
      }
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    submitMutation.mutate(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={`/clubs/opportunities/${opp.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại chi tiết cơ hội</span>
      </Link>

      {/* Context Header */}
      <Card className="p-5 bg-neutral-50 border-neutral-200">
        <div className="text-caption font-semibold text-brand-600">
          {opp.clubName} · {OPPORTUNITY_TYPE_LABELS[opp.type]}
        </div>
        <h1 className="text-section-title text-neutral-900 mt-0.5">{opp.title}</h1>
        <p className="text-caption text-neutral-500 mt-1">
          Hạn nhận đơn: {new Date(opp.registrationDeadline).toLocaleDateString('vi-VN')}
        </p>
      </Card>

      {isSupplementMode && opp.myResponse?.feedbackNote && (
        <div className="p-4 rounded-lg bg-tier-attention-bg border border-tier-attention-border text-tier-attention-text flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Đại diện CLB yêu cầu bổ sung thông tin:</div>
            <p className="mt-1">{opp.myResponse.feedbackNote}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Readonly Profile Snapshot */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-card-title text-neutral-900">
              1. Thông tin sinh viên (Tự động đính kèm)
            </h3>
            <span className="inline-flex items-center gap-1 text-caption text-tier-success-text font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã xác thực từ hồ sơ
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
            <div>
              <span className="text-caption text-neutral-500 block">Họ và tên</span>
              <span className="font-medium text-neutral-900">{user?.fullName}</span>
            </div>
            <div>
              <span className="text-caption text-neutral-500 block">Mã số sinh viên</span>
              <span className="font-medium text-neutral-900">{user?.studentCode || 'HE180001'}</span>
            </div>
            <div>
              <span className="text-caption text-neutral-500 block">Email trường</span>
              <span className="font-medium text-neutral-900">{user?.email}</span>
            </div>
            <div>
              <span className="text-caption text-neutral-500 block">Chuyên ngành &amp; Khóa</span>
              <span className="font-medium text-neutral-900">
                {user?.major || 'Kỹ thuật phần mềm'} · {user?.cohort || 'K18'}
              </span>
            </div>
          </div>
        </Card>

        {/* Position Selector for CollaboratorRecruitment */}
        {opp.type !== 'Event' &&
          opp.positions &&
          opp.positions.length > 0 && (
            <Card className="p-5 space-y-3">
              <h3 className="text-card-title text-neutral-900">
                Chọn vị trí / ban mong muốn <span className="text-tier-danger-text">*</span>
              </h3>
              <div className="space-y-2">
                {opp.positions.map((pos) => (
                  <label
                    key={pos.id}
                    className="flex items-start gap-3 p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="opp-position"
                      disabled={pos.registeredCount >= pos.quota}
                      checked={positionId === pos.id}
                      onChange={() => setPositionId(pos.id)}
                      className="mt-1 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-900">{pos.name}</span>
                        <span className="text-caption text-neutral-500">
                          Đã nhận {pos.registeredCount}/{pos.quota}
                        </span>
                      </div>
                      <p className="text-caption text-neutral-600 mt-0.5">{pos.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.position && <p role="alert" className="text-sm text-tier-danger-text">{errors.position}</p>}
            </Card>
          )}

        {/* Dynamic Form Questions */}
        <Card className="p-5 space-y-4">
          <h3 className="text-card-title text-neutral-900">
            {opp.type === 'CollaboratorRecruitment' ? '3.' : '2.'} Câu hỏi từ Câu lạc bộ
          </h3>
          <DynamicForm
            questions={opp.questions || []}
            values={answers}
            errors={errors}
            onChange={(qId, val) => {
              setAnswers((prev) => ({ ...prev, [qId]: val }));
              if (errors[qId]) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next[qId];
                  return next;
                });
              }
            }}
          />

          <div className="pt-2 space-y-1.5">
            <label className="block text-sm font-medium text-neutral-800">
              Ghi chú hoặc đường dẫn đính kèm thêm (Không bắt buộc)
            </label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Liên kết CV, Portfolio, hoặc lời nhắn gửi tới Đại diện CLB..."
            />
          </div>

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={visibleToCoParticipants}
              onChange={(e) => setVisibleToCoParticipants(e.target.checked)}
              className="mt-1 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Cho phép hiển thị tên của tôi trong danh sách <strong>Sinh viên cùng tham gia</strong> sau khi được xác nhận để kết nối bạn đồng hành.
            </span>
          </label>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {!isSupplementMode && (
            <Button
              type="button"
              variant="secondary"
              isLoading={submitMutation.isPending}
              onClick={() => submitMutation.mutate(true)}
            >
              Lưu bản nháp
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={submitMutation.isPending}
          >
            {isSupplementMode ? 'Gửi thông tin bổ sung' : 'Gửi đăng ký'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClubOpportunityRegisterPage;
