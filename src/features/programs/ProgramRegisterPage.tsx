import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { DynamicForm } from '@/components/shared/DynamicForm';
import { PROGRAM_TYPE_LABELS } from '@/components/shared/ProgramCard';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { ErrorState } from '@/components/shared/ErrorState';
import { programRegistrationUnavailable } from './rules';
import type { ProgramChannel, ProgramRegistration } from '@/types/entities';

export const ProgramRegisterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: prog, isLoading, isError, refetch } = useQuery<ProgramChannel & { myRegistration?: ProgramRegistration | null }>({
    queryKey: ['program', id],
    queryFn: () => apiClient.get(`/programs/${id}`),
    enabled: !!id,
  });

  const [slotId, setSlotId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [note, setNote] = useState('');
  const [acknowledgedTerms, setAcknowledgedTerms] = useState(false);
  const [visibleToCoParticipants, setVisibleToCoParticipants] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (prog?.slots && prog.slots.length > 0 && !slotId) {
      setSlotId(prog.slots.find((slot) => slot.confirmedCount < slot.quota)?.id || '');
    }
  }, [prog]);

  const registerMutation = useMutation({
    mutationFn: () => {
      const formattedAnswers = (prog?.questions || []).map((q) => ({
        questionId: q.id,
        questionLabel: q.label,
        value: answers[q.id] || (q.kind === 'multi' ? [] : ''),
      }));
      return apiClient.post(`/programs/${id}/register`, {
        slotId: slotId || undefined,
        answers: formattedAnswers,
        note: note.trim() || undefined,
        acknowledgedTerms,
        visibleToCoParticipants,
      });
    },
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['programs', 'registrations', 'me'] });
      toast.success('Đã gửi đăng ký tham gia chương trình!');
      navigate(`/programs/${id}`);
    },
  });

  if (isError || (!isLoading && !prog)) return <ErrorState title="Không thể tải chương trình" onRetry={() => refetch()} />;
  if (isLoading || !prog) {
    return <Card className="h-72 animate-pulse bg-neutral-100" />;
  }

  const unavailable = programRegistrationUnavailable(prog, prog.myRegistration, slotId) || (prog.organizer.userId === user?.id ? 'Người tổ chức không đăng ký vào chương trình của mình.' : null);
  if (unavailable) return <div className="space-y-4"><ErrorState title="Không thể đăng ký" message={unavailable} /><Link to={`/programs/${prog.id}`} className="text-brand-600">Quay lại chương trình</Link></div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    (prog.questions || []).forEach((q) => {
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
    if (!acknowledgedTerms) {
      toast.error('Vui lòng đánh dấu xác nhận cam kết tham gia và lưu ý an toàn');
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={`/programs/${prog.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại chi tiết chương trình</span>
      </Link>

      <Card className="p-5 bg-neutral-50 border-neutral-200">
        <div className="text-caption font-semibold text-brand-600">
          {PROGRAM_TYPE_LABELS[prog.type]} · Tổ chức bởi {prog.organizer.fullName}
        </div>
        <h1 className="text-section-title text-neutral-900 mt-0.5">{prog.title}</h1>
        <p className="text-caption text-neutral-500 mt-1">
          Diễn ra: {new Date(prog.startAt).toLocaleString('vi-VN')} · {prog.locationOrLink}
        </p>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-card-title text-neutral-900">
              1. Thông tin sinh viên đăng ký
            </h3>
            <span className="inline-flex items-center gap-1 text-caption text-tier-success-text font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tự động điền từ hồ sơ
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
            <div>
              <span className="text-caption text-neutral-500 block">Họ và tên</span>
              <span className="font-medium text-neutral-900">{user?.fullName}</span>
            </div>
            <div>
              <span className="text-caption text-neutral-500 block">MSSV</span>
              <span className="font-medium text-neutral-900">{user?.studentCode || 'HE180001'}</span>
            </div>
            <div>
              <span className="text-caption text-neutral-500 block">Email</span>
              <span className="font-medium text-neutral-900">{user?.email}</span>
            </div>
            <div>
              <span className="text-caption text-neutral-500 block">Ngành &amp; Khóa</span>
              <span className="font-medium text-neutral-900">
                {user?.major || 'Kỹ thuật phần mềm'} · {user?.cohort || 'K18'}
              </span>
            </div>
          </div>
        </Card>

        {prog.slots && prog.slots.length > 0 && (
          <Card className="p-5 space-y-3">
            <h3 className="text-card-title text-neutral-900">
              2. Chọn ca / nhóm công việc tham gia <span className="text-tier-danger-text">*</span>
            </h3>
            <div className="space-y-2">
              {prog.slots.map((s) => (
                <label
                  key={s.id}
                  className="flex items-start gap-3 p-3.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="prog-slot"
                    disabled={s.confirmedCount >= s.quota}
                    checked={slotId === s.id}
                    onChange={() => setSlotId(s.id)}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">{s.name}</span>
                      <span className="text-caption text-neutral-500">
                        Đã nhận {s.confirmedCount}/{s.quota}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-caption text-neutral-600 mt-0.5">{s.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5 space-y-4">
          <h3 className="text-card-title text-neutral-900">
            {prog.slots && prog.slots.length > 0 ? '3.' : '2.'} Thông tin bổ sung
          </h3>
          <DynamicForm
            questions={prog.questions || []}
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
              Ghi chú gửi tới người tổ chức (Không bắt buộc)
            </label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm nếu bạn có câu hỏi hoặc đề xuất hỗ trợ..."
            />
          </div>
        </Card>

        {/* Mandatory Commitment Box */}
        <Card className="p-5 space-y-3 bg-neutral-50 border-neutral-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <ShieldAlert className="h-4 w-4 text-brand-600" />
            <span>Cam kết tham gia &amp; Lưu ý an toàn</span>
          </div>
          <p className="text-caption text-neutral-600">
            Chi phí: <strong>{prog.costInfo === 'Free' ? 'Miễn phí 100%' : prog.costInfo}</strong>
            {prog.safetyNotes ? ` · ${prog.safetyNotes}` : ''}
          </p>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={acknowledgedTerms}
              onChange={(e) => setAcknowledgedTerms(e.target.checked)}
              className="mt-1 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Tôi đã đọc kỹ thông tin thời gian, lưu ý an toàn, chi phí minh bạch của chương trình và cam kết tham gia đúng giờ (hoặc báo hủy trước tối thiểu 24h nếu bận đột xuất). <span className="text-tier-danger-text">*</span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={visibleToCoParticipants}
              onChange={(e) => setVisibleToCoParticipants(e.target.checked)}
              className="mt-1 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Hiển thị tên tôi trong danh sách <strong>Sinh viên cùng tham gia</strong> để dễ dàng kết nối đi chung.
            </span>
          </label>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={`/programs/${prog.id}`}>
            <Button type="button" variant="secondary">
              Hủy
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={registerMutation.isPending}
          >
            Xác nhận đăng ký
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProgramRegisterPage;
