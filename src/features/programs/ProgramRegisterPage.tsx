import { ActivityNavigation } from './ActivityNavigation';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ShieldAlert, User, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Stepper } from '@/components/ui/Stepper';
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

  const [currentStep, setCurrentStep] = useState(0);
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
    onError: (error: Error) => {
      // Giữ nguyên dữ liệu trên form khi lỗi mạng/backend và hiển thị thông báo
      toast.error(`Đăng ký không thành công: ${error.message}. Thông tin bạn đã điền vẫn được giữ nguyên.`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['programs', 'registrations', 'me'] });
      toast.success('Đã gửi đăng ký tham gia chương trình thành công!');
      navigate(`/programs/${id}`);
    },
  });

  if (isError || (!isLoading && !prog)) return <ErrorState title="Không thể tải chương trình" onRetry={() => refetch()} />;
  if (isLoading || !prog) {
    return <Card className="h-72 animate-pulse bg-neutral-100" />;
  }

  const unavailable = programRegistrationUnavailable(prog, prog.myRegistration, slotId) || (prog.organizer.userId === user?.id ? 'Người tổ chức không đăng ký vào chương trình của mình.' : null);
  if (unavailable) return <div className="space-y-4"><ErrorState title="Không thể đăng ký" message={unavailable} /><Link to={`/programs/${prog.id}`} className="text-brand-600">Quay lại chương trình</Link></div>;

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    (prog.questions || []).forEach((q) => {
      if (q.required) {
        const val = answers[q.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
          nextErrors[q.id] = 'Vui lòng trả lời câu hỏi bắt buộc này.';
        }
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextFromStep1 = () => {
    if (prog.slots && prog.slots.length > 0 && !slotId) {
      toast.error('Vui lòng chọn 1 ca tham gia trước khi tiếp tục.');
      return;
    }
    setCurrentStep(1);
  };

  const handleNextFromStep2 = () => {
    if (!validateStep2()) {
      toast.error('Vui lòng hoàn thành các câu hỏi bắt buộc trước khi tiếp tục.');
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) {
      setCurrentStep(1);
      toast.error('Vui lòng hoàn thành các câu hỏi bắt buộc');
      return;
    }
    if (!acknowledgedTerms) {
      toast.error('Vui lòng đánh dấu xác nhận cam kết tham gia và lưu ý an toàn');
      return;
    }
    registerMutation.mutate();
  };

  const selectedSlot = prog.slots?.find((s) => s.id === slotId);

  const stepsList = [
    { label: '1. Chọn ca' },
    { label: '2. Thông tin' },
    { label: '3. Kiểm tra' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ActivityNavigation />
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

      {/* Stepper bar 3 bước: [Chọn ca] -> [Thông tin] -> [Kiểm tra] */}
      <Card className="p-4">
        <Stepper steps={stepsList} current={currentStep} />
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* BƯỚC 1: CHỌN CA */}
        {currentStep === 0 && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-card-title text-neutral-900">
                Bước 1: Chọn hình thức / Ca tham gia <span className="text-tier-danger-text">*</span>
              </h3>
              <span className="text-caption text-neutral-500">
                Chọn một hình thức hoặc ca phù hợp. Mỗi nhóm có chỉ tiêu riêng.
              </span>
            </div>

            {prog.slots && prog.slots.length > 0 ? (
              <div className="space-y-2.5">
                {prog.slots.map((s) => {
                  const isFull = s.confirmedCount >= s.quota;
                  const isSelected = slotId === s.id;
                  return (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20'
                          : isFull
                          ? 'border-neutral-200 bg-neutral-100 opacity-60 cursor-not-allowed'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="prog-slot"
                        disabled={isFull}
                        checked={isSelected}
                        onChange={() => setSlotId(s.id)}
                        className="mt-1 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-neutral-900">{s.name}</span>
                          <span className={`text-caption font-medium ${isFull ? 'text-tier-danger-text' : 'text-emerald-700'}`}>
                            {isFull ? 'Đã hết chỗ' : `Còn ${s.quota - s.confirmedCount}/${s.quota} chỗ`}
                          </span>
                        </div>
                        {s.timeRange && (
                          <div className="flex items-center gap-1.5 text-caption text-neutral-600 mt-1">
                            <Clock className="h-3.5 w-3.5 text-neutral-400" />
                            <span>Khung giờ: {s.timeRange}</span>
                          </div>
                        )}
                        {s.description && (
                          <p className="text-caption text-neutral-600 mt-1">{s.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                <p className="text-sm text-neutral-800">
                  Chương trình này diễn ra toàn thời gian theo lịch chung, không chia ca riêng.
                </p>
                <div className="text-caption text-neutral-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-600" />
                  <span>Thời gian: {new Date(prog.startAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-neutral-150">
              <Button type="button" variant="primary" onClick={handleNextFromStep1} rightIcon={<ChevronRight className="h-4 w-4" />}>
                Tiếp tục: Điền thông tin
              </Button>
            </div>
          </Card>
        )}

        {/* BƯỚC 2: THÔNG TIN (Auto-fill + Dynamic questions) */}
        {currentStep === 1 && (
          <div className="space-y-5">
            {/* 1. Tự động điền dữ liệu tài khoản sinh viên */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-card-title text-neutral-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-brand-600" />
                  Thông tin sinh viên đăng ký
                </h3>
                <span className="inline-flex items-center gap-1 text-caption text-tier-success-text font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tự động điền (Auto-fill)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
                <div>
                  <span className="text-caption text-neutral-500 block">Họ và tên</span>
                  <span className="font-semibold text-neutral-900">{user?.fullName}</span>
                </div>
                <div>
                  <span className="text-caption text-neutral-500 block">Mã số sinh viên (MSSV)</span>
                  <span className="font-semibold text-neutral-900">{user?.studentCode || 'HE180001'}</span>
                </div>
                <div>
                  <span className="text-caption text-neutral-500 block">Email trường</span>
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

            {/* 2. Câu hỏi bổ sung từ Ban tổ chức (đánh dấu rõ bắt buộc) */}
            <Card className="p-5 space-y-4">
              <div>
                <h3 className="text-card-title text-neutral-900">
                  Câu hỏi dành riêng cho đợt tuyển này
                </h3>
                <p className="text-caption text-neutral-500">
                  Các câu hỏi có dấu sao đỏ (<span className="text-tier-danger-text">*</span>) là bắt buộc.
                </p>
              </div>

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
                  placeholder="Ghi chú thêm nếu bạn có kỹ năng đặc thù hoặc câu hỏi..."
                />
              </div>
            </Card>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(0)} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Quay lại: Chọn ca
              </Button>
              <Button type="button" variant="primary" onClick={handleNextFromStep2} rightIcon={<ChevronRight className="h-4 w-4" />}>
                Tiếp tục: Kiểm tra hồ sơ
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: KIỂM TRA (Review & Submit) */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <Card className="p-5 space-y-4">
              <h3 className="text-card-title text-neutral-900">
                Bước 3: Kiểm tra lại toàn bộ thông tin đăng ký
              </h3>
              <p className="text-caption text-neutral-500">
                Vui lòng kiểm tra kỹ trước khi bấm xác nhận nộp hồ sơ.
              </p>

              <div className="space-y-3 divide-y divide-neutral-150">
                {/* Ca đã chọn */}
                <div className="pt-2">
                  <span className="text-caption font-semibold text-neutral-500 block">Ca tham gia</span>
                  <div className="font-semibold text-brand-700 text-sm mt-0.5">
                    {selectedSlot ? selectedSlot.name : 'Tham gia theo lịch chung của chương trình'}
                  </div>
                  {selectedSlot?.description && (
                    <div className="text-caption text-neutral-600">{selectedSlot.description}</div>
                  )}
                </div>

                {/* Thông tin sinh viên */}
                <div className="pt-3">
                  <span className="text-caption font-semibold text-neutral-500 block">Sinh viên ứng tuyển</span>
                  <div className="text-sm font-medium text-neutral-900 mt-0.5">
                    {user?.fullName} ({user?.studentCode || 'HE180001'}) · {user?.email}
                  </div>
                </div>

                {/* Câu trả lời bổ sung */}
                {prog.questions && prog.questions.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <span className="text-caption font-semibold text-neutral-500 block">Câu trả lời của bạn</span>
                    {prog.questions.map((q) => {
                      const val = answers[q.id];
                      const displayVal = Array.isArray(val) ? val.join(', ') : val || '(Chưa nhập)';
                      return (
                        <div key={q.id} className="text-body-sm bg-neutral-50 p-2.5 rounded border border-neutral-200">
                          <span className="font-medium text-neutral-700">{q.label}: </span>
                          <span className="text-neutral-900">{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {note && (
                  <div className="pt-3">
                    <span className="text-caption font-semibold text-neutral-500 block">Ghi chú đính kèm</span>
                    <p className="text-sm text-neutral-800 bg-neutral-50 p-2.5 rounded border border-neutral-200 mt-0.5">
                      {note}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Mandatory Commitment Box */}
            <Card className="p-5 space-y-3 bg-neutral-50 border-neutral-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <ShieldAlert className="h-4 w-4 text-brand-600" />
                <span>Cam kết tham gia &amp; Lưu ý an toàn</span>
              </div>
              <p className="text-caption text-neutral-600">
                {prog.safetyNotes || 'Vui lòng làm theo hướng dẫn của Ban tổ chức.'}
              </p>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={acknowledgedTerms}
                  onChange={(e) => setAcknowledgedTerms(e.target.checked)}
                  className="mt-1 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  Tôi đã đọc kỹ thông tin thời gian, lưu ý an toàn của chương trình và cam kết tham gia đúng giờ (hoặc báo hủy trước tối thiểu 24h nếu bận đột xuất). <span className="text-tier-danger-text">*</span>
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

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Quay lại: Chỉnh sửa thông tin
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={registerMutation.isPending}
              >
                Xác nhận nộp đơn đăng ký
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProgramRegisterPage;
