import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Plus, Trash2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { QuestionBuilder } from '@/components/shared/QuestionBuilder';
import { CoverImagePicker } from '@/components/shared/CoverImagePicker';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import type {
  FormQuestion,
  MediaImageItem,
  ProgramChannel,
  ProgramSlot,
} from '@/types/entities';
import type { ProgramType } from '@/types/status';

interface EligibilityData {
  eligible: boolean;
  activeChannelsCount: number;
  maxAllowed: number;
  checks: { key: string; label: string; passed: boolean }[];
}

export const ProgramFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<ProgramType>('Volunteer');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [roleNote, setRoleNote] = useState('Trưởng nhóm điều phối');
  const [tagsInput, setTagsInput] = useState('Tình nguyện, Cộng đồng');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<MediaImageItem[]>([]);

  const [startAt, setStartAt] = useState('2026-10-18T08:00');
  const [endAt, setEndAt] = useState('2026-10-18T16:30');
  const [mode, setMode] = useState<'Offline' | 'Online' | 'Hybrid'>('Offline');
  const [locationOrLink, setLocationOrLink] = useState('Khuôn viên ĐH FPT Hòa Lạc');
  const [gatheringPoint, setGatheringPoint] = useState('Sảnh Tòa Alpha lúc 07:45');
  const [beneficiaryAndGoal, setBeneficiaryAndGoal] = useState('');
  const [safetyNotes, setSafetyNotes] = useState(
    'Tuân thủ hướng dẫn điều phối của BTC và quy tắc an toàn chung.'
  );
  const [costInfo, setCostInfo] = useState('Free');
  const [slots, setSlots] = useState<ProgramSlot[]>([
    {
      id: 'slot_1',
      name: 'Ca sáng (08:00 – 11:30)',
      timeRange: '08:00 – 11:30',
      quota: 20,
      confirmedCount: 0,
      description: 'Hỗ trợ công tác chuẩn bị và triển khai đợt sáng',
    },
  ]);

  const [speakerName, setSpeakerName] = useState('');
  const [speakerBio, setSpeakerBio] = useState('');
  const [targetAudience, setTargetAudience] = useState('Sinh viên toàn trường');

  const [confirmMode, setConfirmMode] = useState<'Instant' | 'Approval'>('Instant');
  const [quota, setQuota] = useState(40);
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-10-16');
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: 'q_prog_1',
      label: 'Số điện thoại liên hệ của bạn trong ngày diễn ra chương trình',
      kind: 'short',
      required: true,
    },
  ]);
  const [committed, setCommitted] = useState(false);

  const { data: eligibility } = useQuery<EligibilityData>({
    queryKey: ['programs', 'eligibility'],
    queryFn: () => apiClient.get('/programs/eligibility'),
  });

  const { data: existingProg } = useQuery<ProgramChannel>({
    queryKey: ['program', id],
    queryFn: () => apiClient.get(`/programs/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingProg) {
      setType(existingProg.type);
      setTitle(existingProg.title);
      setSummary(existingProg.summary);
      setDescription(existingProg.description);
      setRoleNote(existingProg.organizer.roleNote);
      setTagsInput(existingProg.tags.join(', '));
      setStartAt(existingProg.startAt.slice(0, 16));
      setEndAt(existingProg.endAt.slice(0, 16));
      setMode(existingProg.mode);
      setLocationOrLink(existingProg.locationOrLink);
      setGatheringPoint(existingProg.gatheringPoint || '');
      setBeneficiaryAndGoal(existingProg.beneficiaryAndGoal || '');
      setSafetyNotes(existingProg.safetyNotes || '');
      setCostInfo(existingProg.costInfo);
      if (existingProg.slots) setSlots(existingProg.slots);
      if (existingProg.speakerInfo) {
        setSpeakerName(existingProg.speakerInfo.name);
        setSpeakerBio(existingProg.speakerInfo.bio);
      }
      setConfirmMode(existingProg.confirmMode);
      setQuota(existingProg.quota);
      setRegistrationDeadline(existingProg.registrationDeadline.slice(0, 10));
      setQuestions(existingProg.questions || []);
      setCommitted(true);
    }
  }, [existingProg]);

  const saveMutation = useMutation({
    mutationFn: (status: 'Draft' | 'PendingReview') => {
      const payload = {
        type,
        title,
        summary,
        description,
        roleNote,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        mode,
        locationOrLink,
        gatheringPoint: type === 'Volunteer' ? gatheringPoint : undefined,
        beneficiaryAndGoal: type === 'Volunteer' ? beneficiaryAndGoal : undefined,
        slots: type === 'Volunteer' ? slots : undefined,
        safetyNotes,
        costInfo,
        speakerInfo:
          type === 'Workshop'
            ? {
                name: speakerName || 'Diễn giả sinh viên',
                bio: speakerBio,
                topics: [],
              }
            : undefined,
        targetAudience,
        confirmMode,
        quota: Number(quota),
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        questions,
        status,
      };
      if (isEdit) {
        return apiClient.put(`/programs/${id}`, payload);
      }
      return apiClient.post('/programs', payload);
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success(
        status === 'Draft'
          ? 'Đã lưu bản nháp kênh chương trình'
          : 'Đã gửi kênh chương trình tới Admin xét duyệt!'
      );
      navigate('/programs?tab=organizing');
    },
  });

  const steps = [
    { num: 1, label: 'Điều kiện & Thông tin' },
    { num: 2, label: 'Thời gian & Nội dung' },
    { num: 3, label: 'Chỉ tiêu & Câu hỏi' },
    { num: 4, label: 'Cam kết & Gửi duyệt' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/programs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại Tình nguyện &amp; Workshop</span>
      </Link>

      <div>
        <h1 className="text-page-title text-neutral-900">
          {isEdit
            ? 'Chỉnh sửa kênh chương trình cộng đồng'
            : 'Mở kênh đăng ký Tình nguyện / Workshop'}
        </h1>
        <p className="text-meta text-neutral-500 mt-1">
          Kênh do sinh viên khởi xướng sẽ được Admin nhà trường xác minh nhanh trước khi hiển thị công khai.
        </p>
      </div>

      {/* Eligibility Checklist Box (PG5 spec) */}
      {eligibility && !isEdit && (
        <Card className="p-4 bg-neutral-50 border-neutral-200 space-y-2">
          <div className="text-caption font-semibold text-neutral-700">
            Kiểm tra điều kiện mở kênh tổ chức
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {eligibility.checks.map((c) => (
              <div key={c.key} className="flex items-center gap-2 text-caption text-neutral-700">
                {c.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-tier-success-text shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-tier-danger-text shrink-0" />
                )}
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              step === s.num
                ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                : 'border-neutral-200 bg-white text-neutral-700'
            }`}
          >
            <div className="text-caption font-semibold">Bước {s.num}</div>
            <div className="text-sm font-semibold truncate">{s.label}</div>
          </button>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Loại chương trình <span className="text-tier-danger-text">*</span>
              </label>
              <Select
                disabled={Boolean(existingProg?.hasRegistrations)}
                value={type}
                onChange={(e) => setType(e.target.value as ProgramType)}
              >
                <option value="Volunteer">Hoạt động Tình nguyện</option>
                <option value="Workshop">Workshop chia sẻ kỹ năng / học thuật</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Vai trò của bạn trong Ban tổ chức <span className="text-tier-danger-text">*</span>
              </label>
              <Input
                value={roleNote}
                onChange={(e) => setRoleNote(e.target.value)}
                placeholder="VD: Trưởng nhóm dự án Chủ Nhật Xanh"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Tên kênh chương trình <span className="text-tier-danger-text">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Chiến dịch Thu gom pin cũ & Đổi cây xanh tại Hòa Lạc"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Tóm tắt ngắn <span className="text-tier-danger-text">*</span>
            </label>
            <Textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tóm tắt mục tiêu và ý nghĩa chương trình trong 1–2 câu..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Mô tả chi tiết hoạt động <span className="text-tier-danger-text">*</span>
            </label>
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Trình bày lịch trình, nhiệm vụ cụ thể và giá trị mang lại cho cộng đồng..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              disabled={!title.trim() || !summary.trim()}
              onClick={() => setStep(2)}
            >
              Tiếp tục: Thời gian &amp; Nội dung
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Thời gian bắt đầu
              </label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Thời gian kết thúc
              </label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Hình thức
              </label>
              <Select value={mode} onChange={(e) => setMode(e.target.value as any)}>
                <option value="Offline">Offline trực tiếp</option>
                <option value="Online">Online trực tuyến</option>
                <option value="Hybrid">Hybrid kết hợp</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Địa điểm / Đường dẫn tham gia
            </label>
            <Input
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
            />
          </div>

          {type === 'Volunteer' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1">
                  Điểm tập trung &amp; Phương tiện di chuyển
                </label>
                <Input
                  value={gatheringPoint}
                  onChange={(e) => setGatheringPoint(e.target.value)}
                />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-neutral-900">
                    Các ca / Nhóm công việc tình nguyện
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setSlots([
                        ...slots,
                        {
                          id: `slot_${Date.now()}`,
                          name: '',
                          timeRange: '',
                          quota: 15,
                          confirmedCount: 0,
                          description: '',
                        },
                      ])
                    }
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Thêm ca
                  </Button>
                </div>
                {slots.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 grid grid-cols-1 md:grid-cols-3 gap-2"
                  >
                    <Input
                      value={s.name}
                      onChange={(e) => {
                        const next = [...slots];
                        next[idx] = { ...s, name: e.target.value };
                        setSlots(next);
                      }}
                      placeholder="Tên ca (VD: Ca sáng 07:30–11:30)"
                    />
                    <Input
                      value={s.description || ''}
                      onChange={(e) => {
                        const next = [...slots];
                        next[idx] = { ...s, description: e.target.value };
                        setSlots(next);
                      }}
                      placeholder="Nhiệm vụ cụ thể..."
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={s.quota}
                        onChange={(e) => {
                          const next = [...slots];
                          next[idx] = { ...s, quota: Number(e.target.value) };
                          setSlots(next);
                        }}
                      />
                      {slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSlots(slots.filter((_, i) => i !== idx))}
                          className="p-2 text-neutral-500 hover:text-tier-danger-text cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1">
                  Tên người chia sẻ (Speaker)
                </label>
                <Input
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="VD: Lê Thị Bình (Mentor K17 SE)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1">
                  Giới thiệu kinh nghiệm người chia sẻ
                </label>
                <Input
                  value={speakerBio}
                  onChange={(e) => setSpeakerBio(e.target.value)}
                  placeholder="VD: Giải Ba ICPC, Mentor môn CSD201/SWP391"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Thông tin chi phí (Minh bạch 100%)
              </label>
              <Input
                value={costInfo}
                onChange={(e) => setCostInfo(e.target.value)}
                placeholder="Ghi 'Free' nếu miễn phí, hoặc mô tả rõ khoản tự túc"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Lưu ý an toàn bắt buộc
              </label>
              <Input
                value={safetyNotes}
                onChange={(e) => setSafetyNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-neutral-100">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                Ảnh bìa chương trình (16:9 · tuỳ chọn)
              </label>
              <CoverImagePicker
                value={coverImageUrl}
                onChange={setCoverImageUrl}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                Ảnh minh họa hoạt động / tiền trạm (tối đa 8 ảnh · tuỳ chọn)
              </label>
              <ImageUploader
                value={gallery}
                onChange={setGallery}
                maxImages={8}
              />
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Quay lại
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Tiếp tục: Chỉ tiêu &amp; Câu hỏi
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Tổng chỉ tiêu (5 – 500 chỗ)
              </label>
              <Input
                type="number"
                min={5}
                max={500}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Chế độ xác nhận
              </label>
              <Select
                value={confirmMode}
                onChange={(e) => setConfirmMode(e.target.value as any)}
              >
                <option value="Instant">Tự động xác nhận ngay</option>
                <option value="Approval">Người tổ chức duyệt thủ công</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Hạn cuối đăng ký
              </label>
              <Input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-card-title text-neutral-900 mb-2">
              Câu hỏi bổ sung cho người đăng ký (Tối đa 8 câu)
            </h3>
            <QuestionBuilder
              questions={questions}
              onChange={setQuestions}
              maxQuestions={8}
              locked={Boolean(existingProg?.hasRegistrations)}
            />
          </div>

          <div className="flex justify-between pt-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Quay lại
            </Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Tiếp tục: Cam kết &amp; Gửi duyệt
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-6 space-y-5">
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
            <div className="text-caption font-semibold text-brand-600">
              Xem trước thông tin kênh
            </div>
            <h2 className="text-section-title text-neutral-900">{title}</h2>
            <p className="text-meta text-neutral-600">{summary}</p>
            <div className="text-caption text-neutral-500 pt-1">
              Chỉ tiêu: <strong>{quota} chỗ</strong> · Chi phí: <strong>{costInfo}</strong>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-4 rounded-lg border border-neutral-200 bg-white cursor-pointer text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={committed}
              onChange={(e) => setCommitted(e.target.checked)}
              className="mt-1 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              <strong>Cam kết của sinh viên tổ chức:</strong> Tôi cam kết hoạt động này hoàn toàn phi thương mại, minh bạch về chi phí, tuân thủ quy tắc an toàn học đường và chịu trách nhiệm điều phối người tham gia đúng như nội dung đã đăng ký với nhà trường.
            </span>
          </label>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Quay lại
            </Button>
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                isLoading={saveMutation.isPending}
                onClick={() => saveMutation.mutate('Draft')}
              >
                Lưu nháp
              </Button>
              <Button
                variant="primary"
                disabled={!committed}
                isLoading={saveMutation.isPending}
                onClick={() => saveMutation.mutate('PendingReview')}
              >
                Gửi Admin duyệt mở kênh
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProgramFormPage;
