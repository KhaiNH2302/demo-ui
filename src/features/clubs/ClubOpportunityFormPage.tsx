import { useEffect, useRef, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, FileText, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/shared/FormField';
import { QuestionBuilder } from '@/components/shared/QuestionBuilder';
import { DynamicForm } from '@/components/shared/DynamicForm';
import { CoverImagePicker } from '@/components/shared/CoverImagePicker';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { ErrorState } from '@/components/shared/ErrorState';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import {
  DEPARTMENTS,
  formatClubDate,
  isRecruitment,
  reuseRecruitment,
  validateRecruitment,
} from './recruitment';
import type {
  Club,
  ClubOpportunity,
  FormQuestion,
  OpportunityPosition,
} from '@/types/entities';

type FormState = Pick<
  ClubOpportunity,
  | 'type'
  | 'title'
  | 'summary'
  | 'description'
  | 'tags'
  | 'quota'
  | 'expectedCommitment'
  | 'department'
  | 'commitmentType'
  | 'contactUserId'
  | 'questions'
  | 'positions'
  | 'coverImageUrl'
  | 'gallery'
  | 'registrationDeadline'
  | 'resultDeadline'
  | 'onboarding'
  | 'locationOrLink'
  | 'mode'
>;
const localInput = (value?: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const future = (days: number) =>
  localInput(new Date(Date.now() + days * 86400000).toISOString());
const blank = (): FormState => ({
  type: 'MemberRecruitment',
  title: '',
  summary: '',
  description: '',
  tags: [],
  quota: 20,
  expectedCommitment: '',
  department: 'other',
  commitmentType: 'semester',
  questions: [],
  positions: [],
  registrationDeadline: future(7),
  resultDeadline: future(10),
  locationOrLink: '',
  mode: 'Offline',
});
const steps = [
  'Thông tin đợt tuyển',
  'Chỉ tiêu & thời hạn',
  'Câu hỏi ứng tuyển',
  'Xem trước & công bố',
];

export function ClubOpportunityFormPage() {
  const { oppId } = useParams<{ oppId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { user, representedClubs, isRepresentativeOf } = useAuthStore();
  const [clubId, setClubId] = useState(
    params.get('clubId') || representedClubs[0]?.clubId || ''
  );
  const [form, setForm] = useState<FormState>(blank);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reuseId, setReuseId] = useState(params.get('reuse') || '');
  const hydrated = useRef('');
  const existing = useQuery<ClubOpportunity>({
    queryKey: ['club-opportunity', oppId, user?.id],
    queryFn: () => apiClient.get(`/clubs/opportunities/${oppId}`),
    enabled: Boolean(oppId && user),
  });
  const previous = useQuery<ClubOpportunity[]>({
    queryKey: ['clubs', 'opportunities', 'mine', user?.id],
    queryFn: () => apiClient.get('/clubs/opportunities?mine=true'),
    enabled: Boolean(user && representedClubs.length && !oppId),
  });
  const clubs = useQuery<Club[]>({
    queryKey: ['clubs', 'directory'],
    queryFn: () => apiClient.get('/clubs'),
    enabled: Boolean(user),
  });
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  useEffect(() => {
    if (!existing.data || hydrated.current === existing.data.id) return;
    const item = existing.data;
    hydrated.current = item.id;
    setClubId(item.clubId);
    setForm({
      ...blank(),
      ...item,
      registrationDeadline: localInput(item.registrationDeadline),
      resultDeadline: localInput(item.resultDeadline),
      onboarding: item.onboarding
        ? {
            ...item.onboarding,
            startAt: localInput(item.onboarding.startAt),
            endAt: localInput(item.onboarding.endAt),
          }
        : undefined,
    });
  }, [existing.data]);
  const locked = Boolean(existing.data?.hasResponses);
  const selectedClub = clubs.data?.find((c) => c.id === clubId);

  const applyTemplate = (
    type: 'MemberRecruitment' | 'CollaboratorRecruitment'
  ) => {
    const member = type === 'MemberRecruitment';
    const questions: FormQuestion[] = [
      {
        id: crypto.randomUUID(),
        label: member
          ? 'Vì sao bạn muốn gắn bó với CLB?'
          : 'Bạn muốn đóng góp điều gì trong chiến dịch này?',
        kind: 'long',
        required: true,
      },
      {
        id: crypto.randomUUID(),
        label: 'Bạn có thể dành thời gian vào những khung giờ nào?',
        kind: 'long',
        required: true,
      },
      {
        id: crypto.randomUUID(),
        label: 'Chia sẻ kinh nghiệm, sản phẩm hoặc kỹ năng bạn muốn học thêm.',
        kind: 'long',
        required: false,
      },
    ];
    setForm((prev) => ({
      ...prev,
      type,
      title: member
        ? 'Tuyển thành viên chính thức — đợt mới'
        : 'Tuyển cộng tác viên cho chiến dịch mới',
      summary: member
        ? 'Cùng phát triển kỹ năng và tham gia sinh hoạt trong học kỳ.'
        : 'Trải nghiệm công việc thực tế cùng CLB trong một chiến dịch ngắn hạn.',
      description:
        'Công việc và yêu cầu:\n- Điền nhiệm vụ cụ thể của từng ban.\n- Nêu kỹ năng cần có và những nội dung CLB sẽ hướng dẫn.\n\nQuyền lợi:\n- Nêu quyền lợi thực tế do CLB xác nhận.\n\nQuy trình tuyển:\n- Xét hồ sơ và trao đổi thêm nếu cần.\n- Thông báo kết quả và hướng dẫn bước tiếp theo trên hệ thống.',
      expectedCommitment: member
        ? '4–6 giờ/tuần, tối thiểu một học kỳ'
        : '3–5 giờ/tuần trong 2–4 tuần',
      commitmentType: member ? 'semester' : 'short',
      quota: 20,
      positions: [],
      questions,
    }));
    toast.success('Đã áp dụng mẫu. Hãy bổ sung thông tin thực tế của CLB.');
  };
  const reuse = (id: string) => {
    const source = previous.data?.find(
      (o) => o.id === id && o.clubId === clubId && isRecruitment(o)
    );
    if (!source) return;
    setForm({ ...blank(), ...reuseRecruitment(source) } as FormState);
    setErrors({});
    toast.success(
      'Đã sao chép nội dung và câu hỏi. Hãy chọn thời hạn mới trước khi công bố.'
    );
  };
  useEffect(() => {
    const sourceId = params.get('reuse');
    if (!oppId && sourceId && previous.data && hydrated.current !== sourceId) {
      const source = previous.data.find(
        (o) => o.id === sourceId && o.clubId === clubId && isRecruitment(o)
      );
      if (source) {
        hydrated.current = sourceId;
        setForm({ ...blank(), ...reuseRecruitment(source) } as FormState);
      }
    }
  }, [params, previous.data, oppId, clubId]);

  const payload = () => ({
    type: form.type,
    title: form.title.trim(),
    summary: form.summary.trim(),
    description: form.description.trim(),
    tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
    quota: form.quota,
    expectedCommitment: form.expectedCommitment?.trim(),
    department: form.department,
    commitmentType: form.commitmentType,
    contactUserId: form.contactUserId || '',
    positions: form.positions,
    questions: form.questions,
    mode: form.mode,
    locationOrLink: form.locationOrLink,
    coverImageUrl: form.coverImageUrl,
    gallery: form.gallery,
    confirmMode: 'Approval' as const,
    registrationDeadline: form.registrationDeadline
      ? new Date(form.registrationDeadline).toISOString()
      : '',
    resultDeadline: form.resultDeadline
      ? new Date(form.resultDeadline).toISOString()
      : '',
    onboarding: form.onboarding
      ? {
          ...form.onboarding,
          startAt: new Date(form.onboarding.startAt).toISOString(),
          endAt: new Date(form.onboarding.endAt).toISOString(),
        }
      : null,
  });
  const save = useMutation({
    mutationFn: (status: 'Draft' | 'Published') => {
      const body = {
        ...payload(),
        status: existing.data?.status === 'Closed' ? 'Closed' : status,
      };
      return oppId
        ? apiClient.put<ClubOpportunity>(`/clubs/opportunities/${oppId}`, body)
        : apiClient.post<ClubOpportunity>('/clubs/opportunities', {
            ...body,
            clubId,
          });
    },
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ['clubs'] });
      client.invalidateQueries({ queryKey: ['club-opportunity'] });
      toast.success('Đã lưu đợt tuyển CLB');
      navigate(`/clubs/manage/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const submit = (status: 'Draft' | 'Published') => {
    const next = validateRecruitment(
      { ...form, used: existing.data?.used },
      Date.now(),
      status === 'Published' && (!oppId || existing.data?.status === 'Draft')
    );
    if (!isRepresentativeOf(clubId))
      next.clubId = 'Chọn CLB bạn đang đại diện.';
    if (Object.keys(next).length) {
      setErrors(next);
      toast.error('Kiểm tra các mục được đánh dấu trước khi lưu.');
      return;
    }
    setErrors({});
    save.mutate(status);
  };
  const positions = (items: OpportunityPosition[]) =>
    setForm((prev) => ({
      ...prev,
      positions: items,
      quota: items.length
        ? items.reduce((sum, p) => sum + p.quota, 0)
        : prev.quota,
    }));

  if (!user || !representedClubs.length)
    return (
      <ErrorState
        title="Cần quyền đại diện CLB"
        message="Đăng nhập bằng tài khoản đại diện đã được xác minh để tạo đợt tuyển."
      />
    );
  if (oppId && existing.isPending)
    return <p role="status">Đang tải đợt tuyển…</p>;
  if (oppId && existing.isError)
    return (
      <ErrorState
        title="Không tải được đợt tuyển"
        onRetry={() => existing.refetch()}
      />
    );
  if (existing.data && !isRepresentativeOf(existing.data.clubId))
    return <ErrorState title="Bạn không quản lý CLB này" />;
  if (existing.data?.type === 'Event')
    return (
      <div className="space-y-4">
        <ErrorState
          title="Sự kiện được quản lý tại mục Hoạt động"
          message="Mục Câu lạc bộ tập trung vào tuyển thành viên và cộng tác viên."
        />
        <Link to="/programs">
          <Button>Đến Hoạt động</Button>
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/clubs?tab=manage"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand-700"
      >
        <ArrowLeft size={16} />
        Quản lý tuyển dụng
      </Link>
      <div>
        <h1 className="text-page-title text-neutral-900">
          {oppId ? 'Chỉnh sửa đợt tuyển' : 'Tạo đợt tuyển CLB'}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tuyển thành viên hoặc cộng tác viên. Đặt hạn trả kết quả và đầu mối
          liên hệ để sinh viên theo dõi.
        </p>
      </div>
      <nav
        aria-label="Các bước tạo đợt tuyển"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={step === i + 1 ? 'step' : undefined}
            onClick={() => setStep(i + 1)}
            className={`rounded-lg border p-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand-500 ${step === i + 1 ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-neutral-200 text-neutral-700'}`}
          >
            <span className="mb-1 block text-xs">Bước {i + 1}</span>
            {label}
          </button>
        ))}
      </nav>
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-tier-danger-border bg-tier-danger-bg p-4 text-sm text-tier-danger-text"
        >
          <p className="font-semibold">Cần bổ sung thông tin</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {step === 1 && (
        <Card className="space-y-5 p-5 sm:p-6">
          <FormField label="CLB tuyển dụng" required error={errors.clubId}>
            <Select
              disabled={Boolean(oppId)}
              value={clubId}
              onChange={(e) => {
                setClubId(e.target.value);
                setReuseId('');
                set('contactUserId', undefined);
              }}
            >
              <option value="">Chọn CLB</option>
              {representedClubs.map((c) => (
                <option key={c.clubId} value={c.clubId}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          {!oppId && (
            <section className="space-y-3 border-y border-neutral-200 py-4">
              <h2 className="font-semibold text-sm text-neutral-900">
                Bắt đầu từ mẫu hoặc nội dung đã có
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<FileText size={15} />}
                  onClick={() => applyTemplate('MemberRecruitment')}
                >
                  Mẫu thành viên
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Copy size={15} />}
                  onClick={() => applyTemplate('CollaboratorRecruitment')}
                >
                  Mẫu cộng tác viên
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  aria-label="Chọn đợt tuyển để tái sử dụng"
                  value={reuseId}
                  onChange={(e) => setReuseId(e.target.value)}
                >
                  <option value="">
                    {previous.isPending
                      ? 'Đang tải nội dung cũ…'
                      : 'Chọn đợt tuyển trước của CLB'}
                  </option>
                  {(previous.data || [])
                    .filter((o) => o.clubId === clubId && isRecruitment(o))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!reuseId || previous.isPending}
                  onClick={() => reuse(reuseId)}
                >
                  Tái sử dụng
                </Button>
              </div>
              {previous.isError && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => previous.refetch()}
                >
                  Tải lại danh sách đợt tuyển
                </Button>
              )}
            </section>
          )}
          <FormField label="Loại đợt tuyển" required>
            <Select
              disabled={locked}
              value={form.type}
              onChange={(e) => set('type', e.target.value as FormState['type'])}
            >
              <option value="MemberRecruitment">Thành viên chính thức</option>
              <option value="CollaboratorRecruitment">Cộng tác viên</option>
            </Select>
          </FormField>
          <FormField label="Tên đợt tuyển" required error={errors.title}>
            <Input
              maxLength={180}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </FormField>
          <FormField label="Giới thiệu ngắn">
            <Input
              maxLength={280}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </FormField>
          <FormField
            label="Công việc, yêu cầu & quyền lợi"
            required
            error={errors.description}
          >
            <Textarea
              rows={8}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Ban chuyên môn">
              <Select
                value={form.department || 'other'}
                onChange={(e) =>
                  set('department', e.target.value as FormState['department'])
                }
              >
                {Object.entries(DEPARTMENTS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Kỹ năng / chủ đề, cách nhau bằng dấu phẩy">
              <Input
                value={form.tags.join(', ')}
                onChange={(e) =>
                  set(
                    'tags',
                    e.target.value.split(',').map((t) => t.trimStart())
                  )
                }
              />
            </FormField>
          </div>
          <CoverImagePicker
            value={form.coverImageUrl || null}
            onChange={(value) => set('coverImageUrl', value)}
          />
          <ImageUploader
            value={form.gallery || []}
            onChange={(value) => set('gallery', value)}
          />
        </Card>
      )}
      {step === 2 && (
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Thời gian cam kết"
              required
              error={errors.expectedCommitment}
            >
              <Input
                value={form.expectedCommitment || ''}
                placeholder="Ví dụ: 4 giờ/tuần trong một học kỳ"
                onChange={(e) => set('expectedCommitment', e.target.value)}
              />
            </FormField>
            <FormField label="Mức gắn bó">
              <Select
                value={form.commitmentType || 'semester'}
                onChange={(e) =>
                  set(
                    'commitmentType',
                    e.target.value as FormState['commitmentType']
                  )
                }
              >
                <option value="semester">Dài hạn / theo học kỳ</option>
                <option value="short">Ngắn hạn / theo chiến dịch</option>
              </Select>
            </FormField>
            <FormField
              label="Hạn nhận đơn"
              required
              error={errors.registrationDeadline}
            >
              <Input
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(e) => set('registrationDeadline', e.target.value)}
              />
            </FormField>
            <FormField
              label="Dự kiến trả kết quả"
              required
              error={errors.resultDeadline}
            >
              <Input
                type="datetime-local"
                value={form.resultDeadline || ''}
                onChange={(e) => set('resultDeadline', e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Tổng chỉ tiêu" required error={errors.quota}>
            <Input
              type="number"
              min={Math.max(1, existing.data?.used || 0)}
              disabled={Boolean(form.positions?.length)}
              value={form.quota}
              onChange={(e) => set('quota', Number(e.target.value))}
            />
          </FormField>
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">
                Vị trí / ban cần tuyển (tùy chọn)
              </h2>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Plus size={15} />}
                onClick={() =>
                  positions([
                    ...(form.positions || []),
                    {
                      id: crypto.randomUUID(),
                      name: '',
                      description: '',
                      quota: 5,
                      registeredCount: 0,
                    },
                  ])
                }
              >
                Thêm vị trí
              </Button>
            </div>
            {(form.positions || []).map((position, index) => (
              <div
                key={position.id}
                className="space-y-2 rounded-lg border border-neutral-200 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_100px_auto]">
                  <Input
                    aria-label={`Tên vị trí ${index + 1}`}
                    placeholder="Tên vị trí"
                    value={position.name}
                    onChange={(e) =>
                      positions(
                        form.positions!.map((p) =>
                          p.id === position.id
                            ? { ...p, name: e.target.value }
                            : p
                        )
                      )
                    }
                  />
                  <Input
                    aria-label={`Chỉ tiêu vị trí ${index + 1}`}
                    type="number"
                    min={Math.max(1, position.registeredCount)}
                    value={position.quota}
                    onChange={(e) =>
                      positions(
                        form.positions!.map((p) =>
                          p.id === position.id
                            ? { ...p, quota: Number(e.target.value) }
                            : p
                        )
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Xóa vị trí ${index + 1}`}
                    disabled={position.registeredCount > 0}
                    onClick={() =>
                      positions(
                        form.positions!.filter((p) => p.id !== position.id)
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <Input
                  aria-label={`Mô tả vị trí ${index + 1}`}
                  placeholder="Công việc của vị trí"
                  value={position.description}
                  onChange={(e) =>
                    positions(
                      form.positions!.map((p) =>
                        p.id === position.id
                          ? { ...p, description: e.target.value }
                          : p
                      )
                    )
                  }
                />
              </div>
            ))}
          </section>
          <FormField label="Người phụ trách sau trúng tuyển">
            <Select
              value={form.contactUserId || ''}
              onChange={(e) => set('contactUserId', e.target.value)}
            >
              <option value="">Đại diện CLB đầu tiên trong hồ sơ</option>
              {selectedClub?.representatives?.map((rep) => (
                <option key={rep.userId} value={rep.userId}>
                  {rep.fullName} — {rep.roleNote}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Địa điểm sinh hoạt / đường dẫn họp">
            <Input
              value={form.locationOrLink || ''}
              onChange={(e) => set('locationOrLink', e.target.value)}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={Boolean(form.onboarding)}
              onChange={(e) =>
                set(
                  'onboarding',
                  e.target.checked
                    ? {
                        startAt: future(12),
                        endAt: localInput(
                          new Date(
                            Date.now() + 12 * 86400000 + 3600000
                          ).toISOString()
                        ),
                        location: '',
                      }
                    : undefined
                )
              }
            />
            Công bố lịch gặp mặt / onboarding sau khi được nhận
          </label>
          {form.onboarding && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Bắt đầu gặp mặt">
                <Input
                  type="datetime-local"
                  value={form.onboarding.startAt}
                  onChange={(e) =>
                    set('onboarding', {
                      ...form.onboarding!,
                      startAt: e.target.value,
                    })
                  }
                />
              </FormField>
              <FormField label="Kết thúc gặp mặt">
                <Input
                  type="datetime-local"
                  value={form.onboarding.endAt}
                  onChange={(e) =>
                    set('onboarding', {
                      ...form.onboarding!,
                      endAt: e.target.value,
                    })
                  }
                />
              </FormField>
              <FormField label="Địa điểm / link gặp mặt">
                <Input
                  value={form.onboarding.location}
                  onChange={(e) =>
                    set('onboarding', {
                      ...form.onboarding!,
                      location: e.target.value,
                    })
                  }
                />
              </FormField>
            </div>
          )}
        </Card>
      )}
      {step === 3 && (
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="text-section-title">Câu hỏi riêng của CLB</h2>
          <p className="text-sm text-neutral-600">
            Thông tin sinh viên được đính kèm tự động. Chỉ hỏi thêm những điều
            cần để xét tuyển.
          </p>
          {locked ? (
            <p className="text-sm text-neutral-600">
              Đợt tuyển đã có hồ sơ; không thay đổi câu hỏi để giữ nguyên nội
              dung sinh viên đã trả lời.
            </p>
          ) : (
            <QuestionBuilder
              questions={form.questions}
              onChange={(value) => set('questions', value)}
            />
          )}
          <DynamicForm
            questions={form.questions}
            values={{}}
            onChange={() => {}}
            readOnly
          />
        </Card>
      )}
      {step === 4 && (
        <Card className="space-y-5 p-5 sm:p-6">
          <p className="text-sm font-medium text-brand-700">
            Xem trước nội dung trước khi công bố
          </p>
          <h2 className="text-section-title text-neutral-900">
            {form.title || 'Tên đợt tuyển'}
          </h2>
          <p className="text-sm text-neutral-600">{form.summary}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {form.description}
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-600">CLB</dt>
              <dd className="font-medium">{selectedClub?.name}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Cam kết</dt>
              <dd>{form.expectedCommitment || 'Chưa nhập'}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Nhận đơn đến</dt>
              <dd>{formatClubDate(form.registrationDeadline)}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Dự kiến trả kết quả</dt>
              <dd>{formatClubDate(form.resultDeadline)}</dd>
            </div>
          </dl>
          <p className="text-sm">
            {form.quota} chỉ tiêu · {form.questions.length} câu hỏi · Hồ sơ được
            CLB xét duyệt
          </p>
        </Card>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
        <Button
          variant="secondary"
          disabled={step === 1}
          onClick={() => setStep(step - 1)}
        >
          Quay lại
        </Button>
        <div className="flex flex-wrap gap-2">
          {(!oppId || existing.data?.status === 'Draft') && (
            <Button
              variant="outline"
              loading={save.isPending}
              onClick={() => submit('Draft')}
            >
              Lưu nháp
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>Tiếp tục</Button>
          ) : (
            <Button
              loading={save.isPending}
              onClick={() => submit('Published')}
            >
              {oppId ? 'Lưu thay đổi' : 'Công bố đợt tuyển'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
export default ClubOpportunityFormPage;
