import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { QuestionBuilder } from '@/components/shared/QuestionBuilder';
import { DynamicForm } from '@/components/shared/DynamicForm';
import { CoverImagePicker } from '@/components/shared/CoverImagePicker';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { OPPORTUNITY_TYPE_LABELS } from '@/components/shared/OpportunityCard';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import type {
  ClubOpportunity,
  FormQuestion,
  MediaImageItem,
  OpportunityPosition,
} from '@/types/entities';
import type { OpportunityType } from '@/types/status';

export const ClubOpportunityFormPage: React.FC = () => {
  const { oppId } = useParams<{ oppId: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(oppId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { representedClubs } = useAuthStore();

  const initialStep = Math.min(Math.max(Number(searchParams.get('step')) || 1, 1), 4);
  const [step, setStep] = useState(initialStep);

  useEffect(() => {
    const requestedStep = Number(searchParams.get('step'));
    if (Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 4) {
      setStep(requestedStep);
    }
  }, [searchParams]);
  const [clubId, setClubId] = useState(
    searchParams.get('clubId') || representedClubs[0]?.clubId || 'club_01'
  );
  const [type, setType] = useState<OpportunityType>('Event');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Kỹ năng, Sinh viên FPT');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<MediaImageItem[]>([]);

  // Step 2: Type specifics + Quota/Deadlines
  const [startAt, setStartAt] = useState('2026-10-15T14:00');
  const [endAt, setEndAt] = useState('2026-10-15T17:00');
  const [mode, setMode] = useState<'Online' | 'Offline' | 'Hybrid'>('Offline');
  const [locationOrLink, setLocationOrLink] = useState('Hội trường Gamma, ĐH FPT Hà Nội');
  const [confirmMode, setConfirmMode] = useState<'Instant' | 'Approval'>('Instant');
  const [expectedCommitment, setExpectedCommitment] = useState('4–6 giờ/tuần trong học kỳ');
  const [positions, setPositions] = useState<OpportunityPosition[]>([
    {
      id: 'pos_1',
      name: 'Ban Truyền thông',
      quota: 5,
      registeredCount: 0,
      description: 'Viết bài truyền thông và hỗ trợ hình ảnh sự kiện',
    },
  ]);
  const [quota, setQuota] = useState(50);
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-10-12');
  const [resultDeadline, setResultDeadline] = useState('2026-10-14');

  // Step 3: Questions
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: 'q_default_1',
      label: 'Mục tiêu hoặc mong muốn của bạn khi tham gia cơ hội này là gì?',
      kind: 'long',
      required: true,
    },
  ]);

  const { data: existingOpp } = useQuery<ClubOpportunity>({
    queryKey: ['club-opportunity', oppId],
    queryFn: () => apiClient.get(`/clubs/opportunities/${oppId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingOpp) {
      setClubId(existingOpp.clubId);
      setType(existingOpp.type);
      setTitle(existingOpp.title);
      setSummary(existingOpp.summary);
      setDescription(existingOpp.description);
      setTagsInput(existingOpp.tags.join(', '));
      if (existingOpp.startAt) setStartAt(existingOpp.startAt.slice(0, 16));
      if (existingOpp.endAt) setEndAt(existingOpp.endAt.slice(0, 16));
      if (existingOpp.mode) setMode(existingOpp.mode);
      if (existingOpp.locationOrLink) setLocationOrLink(existingOpp.locationOrLink);
      if (existingOpp.confirmMode) setConfirmMode(existingOpp.confirmMode);
      if (existingOpp.expectedCommitment) setExpectedCommitment(existingOpp.expectedCommitment);
      if (existingOpp.positions) setPositions(existingOpp.positions);
      setQuota(existingOpp.quota);
      if (existingOpp.registrationDeadline) {
        setRegistrationDeadline(existingOpp.registrationDeadline.slice(0, 10));
      }
      if (existingOpp.resultDeadline) {
        setResultDeadline(existingOpp.resultDeadline.slice(0, 10));
      }
      setQuestions(existingOpp.questions || []);
    }
  }, [existingOpp]);

  const hasResponses = Boolean(existingOpp?.hasResponses);

  const saveMutation = useMutation({
    mutationFn: (status: 'Draft' | 'Published') => {
      const payload: Partial<ClubOpportunity> = {
        clubId,
        type,
        title,
        summary,
        description,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        startAt: type === 'Event' ? new Date(startAt).toISOString() : undefined,
        endAt: type === 'Event' ? new Date(endAt).toISOString() : undefined,
        mode,
        locationOrLink,
        confirmMode: type === 'Event' ? confirmMode : 'Approval',
        expectedCommitment: type !== 'Event' ? expectedCommitment : undefined,
        positions: type === 'CollaboratorRecruitment' ? positions : undefined,
        quota: Number(quota),
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        resultDeadline: type !== 'Event' ? new Date(resultDeadline).toISOString() : undefined,
        questions,
        status,
      };
      if (isEdit) {
        return apiClient.put(`/clubs/opportunities/${oppId}`, payload);
      }
      return apiClient.post('/clubs/opportunities', payload);
    },
    onSuccess: (res: any, status) => {
      queryClient.invalidateQueries({ queryKey: ['clubs', 'opportunities'] });
      toast.success(
        status === 'Draft' ? 'Đã lưu bản nháp hoạt động CLB' : 'Đã đăng công khai hoạt động CLB'
      );
      navigate(`/clubs/manage/${res.id || oppId}`);
    },
  });

  const steps = [
    { num: 1, label: 'Thông tin cơ bản' },
    { num: 2, label: 'Thời gian & Chỉ tiêu' },
    { num: 3, label: 'Câu hỏi đăng ký' },
    { num: 4, label: 'Xem trước & Đăng' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/clubs?tab=manage"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại Bài đăng của tôi</span>
      </Link>

      <div>
        <h1 className="text-page-title text-neutral-900">
          {isEdit ? 'Chỉnh sửa hoạt động Câu lạc bộ' : 'Đăng hoạt động Câu lạc bộ mới'}
        </h1>
        <p className="text-meta text-neutral-500 mt-1">
          Mở kênh tiếp nhận đăng ký sự kiện, tuyển thành viên hoặc cộng tác viên cho CLB bạn đại diện.
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              step === s.num
                ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                : s.num < step
                ? 'border-neutral-200 bg-surface text-neutral-800'
                : 'border-neutral-200 bg-neutral-50 text-neutral-500'
            }`}
          >
            <div className="text-caption font-semibold">Bước {s.num}</div>
            <div className="text-sm font-semibold truncate">{s.label}</div>
          </button>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Câu lạc bộ đại diện <span className="text-tier-danger-text">*</span>
              </label>
              <Select
                disabled={isEdit}
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
              >
                {representedClubs.length > 0 ? (
                  representedClubs.map((c) => (
                    <option key={c.clubId} value={c.clubId}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value="club_01">F-Code Club (CLB Lập Trình FPT)</option>
                )}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Loại hoạt động <span className="text-tier-danger-text">*</span>
              </label>
              <Select
                disabled={hasResponses}
                value={type}
                onChange={(e) => setType(e.target.value as OpportunityType)}
              >
                <option value="Event">Sự kiện CLB</option>
                <option value="MemberRecruitment">Tuyển thành viên</option>
                <option value="CollaboratorRecruitment">Tuyển cộng tác viên (CTV)</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Tiêu đề hoạt động <span className="text-tier-danger-text">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tuyển thành viên F-Code Gen 11 — Ban Thuật toán & Sản phẩm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Tóm tắt ngắn (hiển thị trên thẻ danh sách) <span className="text-tier-danger-text">*</span>
            </label>
            <Textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Mô tả ngắn gọn 1–2 câu về mục tiêu và đối tượng tham gia..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Mô tả chi tiết <span className="text-tier-danger-text">*</span>
            </label>
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung chi tiết, quyền lợi khi tham gia, yêu cầu chuẩn bị..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Thẻ chủ đề (phân cách bằng dấu phẩy)
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Web Dev, Algorithms, K18, K19"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              disabled={!title.trim() || !summary.trim()}
              onClick={() => setStep(2)}
            >
              Tiếp tục: Thời gian &amp; Chỉ tiêu
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Card className="p-6 space-y-4">
          {type === 'Event' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Hình thức tổ chức
                </label>
                <Select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                >
                  <option value="Offline">Offline tại trường</option>
                  <option value="Online">Online trực tuyến</option>
                  <option value="Hybrid">Hybrid kết hợp</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1">
                  Chế độ xác nhận đăng ký
                </label>
                <Select
                  disabled={hasResponses}
                  value={confirmMode}
                  onChange={(e) => setConfirmMode(e.target.value as any)}
                >
                  <option value="Instant">Xác nhận ngay khi còn chỗ</option>
                  <option value="Approval">Đại diện CLB xét duyệt thủ công</option>
                </Select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Mức cam kết thời gian dự kiến <span className="text-tier-danger-text">*</span>
              </label>
              <Input
                value={expectedCommitment}
                onChange={(e) => setExpectedCommitment(e.target.value)}
                placeholder="VD: 4–6 giờ/tuần trong học kỳ Fall 2026"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Địa điểm sinh hoạt / Link tham dự
            </label>
            <Input
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder="VD: Hội trường Gamma hoặc Google Meet"
            />
          </div>

          {type === 'CollaboratorRecruitment' && (
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-neutral-900">
                  Các vị trí Cộng tác viên cần tuyển
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setPositions([
                      ...positions,
                      {
                        id: `pos_${Date.now()}`,
                        name: '',
                        quota: 5,
                        registeredCount: 0,
                        description: '',
                      },
                    ])
                  }
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Thêm vị trí
                </Button>
              </div>
              {positions.map((pos, idx) => (
                <div
                  key={pos.id}
                  className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <Input
                        value={pos.name}
                        onChange={(e) => {
                          const next = [...positions];
                          next[idx] = { ...pos, name: e.target.value };
                          setPositions(next);
                        }}
                        placeholder="Tên vị trí (VD: Ban Hậu cần)"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={pos.quota}
                        onChange={(e) => {
                          const next = [...positions];
                          next[idx] = { ...pos, quota: Number(e.target.value) };
                          setPositions(next);
                        }}
                        placeholder="Chỉ tiêu"
                      />
                      {positions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPositions(positions.filter((_, i) => i !== idx))
                          }
                          className="p-2 text-neutral-500 hover:text-tier-danger-text cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Input
                    value={pos.description}
                    onChange={(e) => {
                      const next = [...positions];
                      next[idx] = { ...pos, description: e.target.value };
                      setPositions(next);
                    }}
                    placeholder="Mô tả ngắn công việc của vị trí này..."
                  />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Tổng chỉ tiêu (chỗ)
              </label>
              <Input
                type="number"
                min={1}
                max={2000}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
              />
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
            {type !== 'Event' && (
              <div>
                <label className="block text-sm font-medium text-neutral-800 mb-1">
                  Hạn phản hồi kết quả dự kiến
                </label>
                <Input
                  type="date"
                  value={resultDeadline}
                  onChange={(e) => setResultDeadline(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-4 pt-3 border-t border-neutral-100">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                Ảnh bìa hoạt động (16:9 · tuỳ chọn)
              </label>
              <CoverImagePicker
                value={coverImageUrl}
                onChange={setCoverImageUrl}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                Ảnh hoạt động / các đợt trước (tối đa 8 ảnh · tuỳ chọn)
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
              Tiếp tục: Câu hỏi đăng ký
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-card-title text-neutral-900">
              Thiết kế form câu hỏi cho sinh viên đăng ký (Tối đa 10 câu)
            </h3>
            <p className="text-caption text-neutral-500 mt-0.5">
              Họ tên, MSSV, Email, Ngành và Khóa sẽ được lấy tự động từ tài khoản sinh viên.
            </p>
          </div>

          <QuestionBuilder
            questions={questions}
            onChange={setQuestions}
            maxQuestions={10}
            locked={hasResponses}
          />

          <div className="flex justify-between pt-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Quay lại
            </Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Tiếp tục: Xem trước
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: PREVIEW */}
      {step === 4 && (
        <Card className="p-6 space-y-5">
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
            <span className="inline-block px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-caption font-semibold">
              {OPPORTUNITY_TYPE_LABELS[type]}
            </span>
            <h2 className="text-section-title text-neutral-900">{title}</h2>
            <p className="text-meta text-neutral-600">{summary}</p>
            <div className="text-caption text-neutral-500 pt-1">
              Tổng chỉ tiêu: <strong>{quota}</strong> · Hạn đăng ký: <strong>{registrationDeadline}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-card-title text-neutral-900">
              Xem trước Form câu hỏi sinh viên sẽ thấy ({questions.length} câu)
            </h3>
            <DynamicForm questions={questions} values={{}} readOnly={false} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Quay lại chỉnh sửa
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
                isLoading={saveMutation.isPending}
                onClick={() => saveMutation.mutate('Published')}
              >
                {isEdit ? 'Lưu & Cập nhật bài đăng' : 'Đăng công khai hoạt động'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClubOpportunityFormPage;
