import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CircleDashed, Lock, Plus, Save, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import type { MentorApplication } from '@/types/entities';
import {
  APPLICATION_STEPS,
  BIO_MAX,
  EXPERIENCE_TYPE_LABELS,
  HEADLINE_MAX,
  ROLE_LABELS,
  SKILL_LEVEL_LABELS,
  getFlaggedSteps,
  getStepIssues,
  type ApplicationStepKey,
} from './applicationSteps';

type Draft = Partial<MentorApplication> & {
  personal: MentorApplication['personal'];
  education: MentorApplication['education'];
  experiences: MentorApplication['experiences'];
  skills: MentorApplication['skills'];
  achievements: MentorApplication['achievements'];
  focus: MentorApplication['focus'];
  about: MentorApplication['about'];
  evidence: MentorApplication['evidence'];
};

const EMPTY_DRAFT: Draft = {
  personal: { avatarUrl: '', currentRole: 'student', yearOrGraduation: '' },
  education: { major: '', gpaScale: 4, gpaPublic: false, strongSubjects: [] },
  experiences: [],
  skills: [],
  achievements: [],
  focus: { areas: [], subjects: [] },
  about: { headline: '', bio: '', motivation: '' },
  evidence: { cvUrl: '', portfolioUrls: [], otherFiles: [] },
  agreed: false,
};

const toDraft = (app?: Partial<MentorApplication>): Draft => ({
  ...EMPTY_DRAFT,
  ...app,
  personal: { ...EMPTY_DRAFT.personal, ...app?.personal },
  education: { ...EMPTY_DRAFT.education, ...app?.education },
  focus: { ...EMPTY_DRAFT.focus, ...app?.focus },
  about: { ...EMPTY_DRAFT.about, ...app?.about },
  evidence: { ...EMPTY_DRAFT.evidence, ...app?.evidence },
  experiences: app?.experiences ?? [],
  skills: app?.skills ?? [],
  achievements: app?.achievements ?? [],
  agreed: app?.agreed ?? false,
});

const AREA_SUGGESTIONS = ['Lập trình Backend', 'Lập trình Frontend', 'Cấu trúc dữ liệu & Giải thuật', 'Thiết kế UI/UX', 'Định hướng thực tập', 'An toàn thông tin', 'Trí tuệ nhân tạo'];

// Một dòng trong danh sách có thể thêm/xóa (môn học, kinh nghiệm, thành tích...)
const RepeatRow: React.FC<{ onRemove: () => void; removeLabel: string; children: React.ReactNode }> = ({
  onRemove,
  removeLabel,
  children,
}) => (
  <div className="relative rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 pr-12 dark:border-neutral-700 dark:bg-neutral-800/40">
    {children}
    <IconButton
      type="button"
      variant="ghost"
      size="sm"
      aria-label={removeLabel}
      onClick={onRemove}
      className="absolute right-2 top-2 text-neutral-500 hover:text-rose-600"
    >
      <Trash2 className="h-4 w-4" />
    </IconButton>
  </div>
);

const SubSection: React.FC<{ title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  hint,
  action,
  children,
}) => (
  <section className="space-y-3">
    <div className="flex items-end justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const CharCount: React.FC<{ value: string; max: number }> = ({ value, max }) => (
  <span className={cn('text-xs tabular-nums', value.length > max ? 'text-rose-600' : 'text-neutral-400')}>
    {value.length}/{max}
  </span>
);

export const MentorApplyFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const stepParam = Number(searchParams.get('step'));
  const stepIndex = stepParam >= 1 && stepParam <= APPLICATION_STEPS.length ? stepParam - 1 : 0;
  const step = APPLICATION_STEPS[stepIndex];
  const goToStep = (index: number) => {
    setSearchParams({ step: String(index + 1) }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);

  const { data: serverApp } = useQuery<MentorApplication>({
    queryKey: ['mentor', 'application', 'me'],
    queryFn: () => apiClient.get('/mentor/applications/me'),
  });

  useEffect(() => {
    if (serverApp && !loaded) {
      setDraft(toDraft(serverApp));
      setLoaded(true);
    }
  }, [serverApp, loaded]);

  // Thông tin đã xác minh lấy từ tài khoản, không bắt khai lại
  const withAccountInfo = (data: Draft): Draft => ({
    ...data,
    personal: { ...data.personal, avatarUrl: user?.avatarUrl || data.personal.avatarUrl },
    education: { ...data.education, major: user?.major || data.education.major },
    focus: { ...data.focus, subjects: data.education.strongSubjects.map((s) => s.code).filter(Boolean) },
  });

  const saveMutation = useMutation({
    mutationFn: (data: Draft) => apiClient.put('/mentor/applications/me', withAccountInfo(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentor', 'application', 'me'] }),
  });

  const saveDraft = async (notify: boolean) => {
    try {
      await saveMutation.mutateAsync(draft);
      if (notify) toast({ title: 'Đã lưu bản nháp' });
      return true;
    } catch {
      toast({ title: 'Chưa lưu được bản nháp', description: 'Kiểm tra kết nối rồi bấm Lưu bản nháp lần nữa.', variant: 'error' });
      return false;
    }
  };

  const changeStep = (index: number) => {
    void saveDraft(false);
    goToStep(index);
  };

  const issues = getStepIssues(withAccountInfo(draft));
  const flaggedSteps = getFlaggedSteps(serverApp);
  const totalIssues = Object.values(issues).reduce((sum, list) => sum + list.length, 0);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));
  const patch = <K extends 'personal' | 'education' | 'focus' | 'about' | 'evidence'>(key: K, value: Partial<Draft[K]>) =>
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
  const updateAt = <K extends 'experiences' | 'skills' | 'achievements'>(key: K, index: number, value: Partial<Draft[K][number]>) =>
    setDraft((prev) => ({
      ...prev,
      [key]: (prev[key] as Draft[K][number][]).map((item, i) => (i === index ? { ...item, ...value } : item)),
    }));
  const removeAt = <K extends 'experiences' | 'skills' | 'achievements'>(key: K, index: number) =>
    setDraft((prev) => ({ ...prev, [key]: (prev[key] as unknown[]).filter((_, i) => i !== index) }));

  const subjects = draft.education.strongSubjects;
  const setSubjects = (next: typeof subjects) => patch('education', { strongSubjects: next });

  const isStudent = draft.personal.currentRole === 'student';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Hồ sơ đăng ký Mentor"
        description="4 bước, khoảng 10 phút. Bản nháp được lưu mỗi khi bạn chuyển bước."
        backHref="/mentor/apply"
        actions={
          <Button variant="outline" size="sm" onClick={() => saveDraft(true)} loading={saveMutation.isPending}>
            <Save className="mr-1.5 h-4 w-4" /> Lưu bản nháp
          </Button>
        }
      />

      {serverApp?.status === 'NeedsMoreInfo' && serverApp.reviewNote && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Ban Quản trị cần bạn bổ sung</p>
            <p>{serverApp.reviewNote}</p>
            {flaggedSteps.length > 0 && (
              <p className="text-amber-800 dark:text-amber-300">
                Xem các bước có chấm vàng: {flaggedSteps.map((key) => APPLICATION_STEPS.find((s) => s.key === key)?.title).join(', ')}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Thanh bước: 4 bước có thứ tự, bấm để nhảy tới bất kỳ bước nào */}
      <nav aria-label="Các bước hồ sơ">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {APPLICATION_STEPS.map((item, index) => {
            const active = index === stepIndex;
            const done = issues[item.key].length === 0;
            const flagged = flaggedSteps.includes(item.key);
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => changeStep(index)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex h-full w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    active
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/10'
                      : 'border-neutral-200 bg-surface hover:border-neutral-300 dark:border-neutral-700'
                  )}
                >
                  <span
                    className={cn(
                      'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      done ? 'bg-emerald-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                    {flagged && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-surface" aria-label="Cần bổ sung" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-sm font-semibold', active ? 'text-brand-800 dark:text-brand-200' : 'text-neutral-800 dark:text-neutral-200')}>
                      {item.title}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {done ? 'Đã đủ' : `Còn ${issues[item.key].length} mục`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="space-y-7 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-xs sm:p-7 dark:border-neutral-700/80">
            <header>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Bước {stepIndex + 1} / {APPLICATION_STEPS.length}</p>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{step.title}</h2>
              <p className="text-sm text-neutral-500">{step.description}</p>
            </header>

            {step.key === 'identity' && (
              <>
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <UserAvatar user={user ? { id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl } : undefined} size="lg" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user?.fullName}</p>
                    <p className="text-neutral-600">{[user?.major, user?.cohort].filter(Boolean).join(' · ')}</p>
                    <p className="text-neutral-500">{[user?.school, user?.campus].filter(Boolean).join(', ')}</p>
                  </div>
                  <span className="hidden items-center gap-1 text-xs text-neutral-500 sm:flex">
                    <Lock className="h-3.5 w-3.5" /> Lấy từ tài khoản đã xác minh
                  </span>
                </div>
                <p className="-mt-4 text-xs text-neutral-500">
                  Tên, ảnh, ngành và trường lấy từ tài khoản. Muốn đổi, hãy sửa trong <Link to="/profile/me" className="text-primary hover:underline">Hồ sơ cá nhân</Link>.
                </p>

                <SubSection title="Vai trò hiện tại">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Vai trò hiện tại">
                    {(Object.keys(ROLE_LABELS) as MentorApplication['personal']['currentRole'][]).map((role) => {
                      const active = draft.personal.currentRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => patch('personal', { currentRole: role })}
                          className={cn(
                            'rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                            active ? 'border-brand-500 bg-brand-50/70 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300'
                          )}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      );
                    })}
                  </div>
                </SubSection>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={isStudent ? 'Bạn đang học năm mấy?' : 'Năm tốt nghiệp'} required>
                    <Input
                      value={draft.personal.yearOrGraduation}
                      onChange={(e) => patch('personal', { yearOrGraduation: e.target.value })}
                      placeholder={isStudent ? 'VD: Năm 3 (K17)' : 'VD: 2024'}
                    />
                  </FormField>
                  <FormField label="Số điện thoại" helperText="Chỉ Ban Quản trị thấy, dùng khi cần liên hệ về hồ sơ.">
                    <Input
                      type="tel"
                      value={draft.personal.phone || ''}
                      onChange={(e) => patch('personal', { phone: e.target.value })}
                      placeholder="VD: 0912 345 678"
                    />
                  </FormField>
                  {!isStudent && (
                    <>
                      <FormField label="Nơi làm việc" required>
                        <Input
                          value={draft.personal.workplace || ''}
                          onChange={(e) => patch('personal', { workplace: e.target.value })}
                          placeholder="VD: FPT Software"
                        />
                      </FormField>
                      <FormField label="Vị trí">
                        <Input
                          value={draft.personal.position || ''}
                          onChange={(e) => patch('personal', { position: e.target.value })}
                          placeholder="VD: Backend Developer"
                        />
                      </FormField>
                    </>
                  )}
                </div>
              </>
            )}

            {step.key === 'teaching' && (
              <>
                <SubSection title="Lĩnh vực bạn hướng dẫn" hint="Gõ rồi nhấn Enter. Học viên lọc Mentor theo các lĩnh vực này.">
                  <TagInput
                    value={draft.focus.areas}
                    onChange={(areas) => patch('focus', { areas })}
                    suggestions={AREA_SUGGESTIONS}
                    placeholder="VD: Lập trình Backend"
                    max={6}
                  />
                </SubSection>

                <SubSection
                  title="Môn nhận kèm"
                  hint="Mỗi môn kèm điểm bạn đạt được để Ban Quản trị đối chiếu bảng điểm."
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={() => setSubjects([...subjects, { code: '', grade: '' }])}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Thêm môn
                    </Button>
                  }
                >
                  {subjects.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
                      Chưa có môn nào. Bấm Thêm môn để bắt đầu.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {subjects.map((subject, index) => (
                        <RepeatRow key={index} removeLabel={`Xóa môn ${subject.code || index + 1}`} onRemove={() => setSubjects(subjects.filter((_, i) => i !== index))}>
                          <div className="grid grid-cols-[1fr_7rem] gap-3">
                            <FormField label="Mã môn">
                              <Input
                                value={subject.code}
                                onChange={(e) => setSubjects(subjects.map((s, i) => (i === index ? { ...s, code: e.target.value.toUpperCase() } : s)))}
                                placeholder="VD: CSD201"
                              />
                            </FormField>
                            <FormField label="Điểm">
                              <Input
                                inputMode="decimal"
                                value={subject.grade || ''}
                                onChange={(e) => setSubjects(subjects.map((s, i) => (i === index ? { ...s, grade: e.target.value } : s)))}
                                placeholder="9.0"
                              />
                            </FormField>
                          </div>
                        </RepeatRow>
                      ))}
                    </div>
                  )}
                </SubSection>

                <SubSection title="GPA tích lũy">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <FormField label="GPA" required>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={draft.education.gpaScale ?? 4}
                        value={draft.education.gpa ?? ''}
                        onChange={(e) => patch('education', { gpa: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder={draft.education.gpaScale === 10 ? 'VD: 8.2' : 'VD: 3.5'}
                      />
                    </FormField>
                    <FormField label="Thang điểm">
                      <Select
                        value={String(draft.education.gpaScale ?? 4)}
                        onChange={(e) => patch('education', { gpaScale: Number(e.target.value) as 4 | 10 })}
                        options={[
                          { label: 'Thang 4', value: '4' },
                          { label: 'Thang 10', value: '10' },
                        ]}
                      />
                    </FormField>
                    <label className="flex h-10 items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <Switch
                        checked={draft.education.gpaPublic}
                        onCheckedChange={(checked) => patch('education', { gpaPublic: checked })}
                      />
                      Hiện GPA trên hồ sơ
                    </label>
                  </div>
                </SubSection>
              </>
            )}

            {step.key === 'experience' && (
              <>
                <SubSection
                  title="Kinh nghiệm"
                  hint="Thực tập, đi làm, dự án, trợ giảng hoặc vai trò trong câu lạc bộ."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        set('experiences', [...draft.experiences, { type: 'project', title: '', org: '', role: '', from: '', description: '' }])
                      }
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Thêm kinh nghiệm
                    </Button>
                  }
                >
                  {draft.experiences.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
                      Chưa có kinh nghiệm nào. Một dự án môn học có kết quả tốt cũng được tính.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {draft.experiences.map((exp, index) => (
                        <RepeatRow key={index} removeLabel={`Xóa kinh nghiệm ${exp.title || index + 1}`} onRemove={() => removeAt('experiences', index)}>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <FormField label="Loại">
                              <Select
                                value={exp.type}
                                onChange={(e) => updateAt('experiences', index, { type: e.target.value as typeof exp.type })}
                                options={Object.entries(EXPERIENCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                              />
                            </FormField>
                            <FormField label="Tên vị trí / dự án">
                              <Input value={exp.title} onChange={(e) => updateAt('experiences', index, { title: e.target.value })} placeholder="VD: Backend Intern" />
                            </FormField>
                            <FormField label="Tổ chức">
                              <Input value={exp.org} onChange={(e) => updateAt('experiences', index, { org: e.target.value })} placeholder="VD: FPT Software" />
                            </FormField>
                            <FormField label="Vai trò của bạn">
                              <Input value={exp.role} onChange={(e) => updateAt('experiences', index, { role: e.target.value })} placeholder="VD: Phát triển API" />
                            </FormField>
                            <FormField label="Từ tháng">
                              <Input type="month" value={exp.from} onChange={(e) => updateAt('experiences', index, { from: e.target.value })} />
                            </FormField>
                            <FormField label="Đến tháng" helperText="Để trống nếu vẫn đang làm.">
                              <Input type="month" value={exp.to || ''} onChange={(e) => updateAt('experiences', index, { to: e.target.value || undefined })} />
                            </FormField>
                            <div className="sm:col-span-2">
                              <FormField label="Bạn đã làm được gì?">
                                <Textarea
                                  rows={2}
                                  value={exp.description}
                                  onChange={(e) => updateAt('experiences', index, { description: e.target.value })}
                                  placeholder="VD: Viết REST API cho module thanh toán, giảm 35% thời gian phản hồi."
                                />
                              </FormField>
                            </div>
                          </div>
                        </RepeatRow>
                      ))}
                    </div>
                  )}
                </SubSection>

                <SubSection
                  title="Kỹ năng"
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={() => set('skills', [...draft.skills, { name: '', level: 'good' }])}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Thêm kỹ năng
                    </Button>
                  }
                >
                  {draft.skills.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">Chưa có kỹ năng nào.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {draft.skills.map((skill, index) => (
                        <RepeatRow key={index} removeLabel={`Xóa kỹ năng ${skill.name || index + 1}`} onRemove={() => removeAt('skills', index)}>
                          <div className="grid grid-cols-[1fr_7.5rem] gap-2">
                            <Input aria-label="Tên kỹ năng" value={skill.name} onChange={(e) => updateAt('skills', index, { name: e.target.value })} placeholder="VD: Spring Boot" />
                            <Select
                              aria-label="Mức độ"
                              value={skill.level || 'good'}
                              onChange={(e) => updateAt('skills', index, { level: e.target.value as 'basic' | 'good' | 'expert' })}
                              options={Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => ({ value, label }))}
                            />
                          </div>
                        </RepeatRow>
                      ))}
                    </div>
                  )}
                </SubSection>

                <SubSection
                  title="Thành tích & chứng chỉ"
                  hint="Không bắt buộc nếu bạn đã có kinh nghiệm ở trên."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => set('achievements', [...draft.achievements, { name: '', issuer: '', year: new Date().getFullYear() }])}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Thêm thành tích
                    </Button>
                  }
                >
                  {draft.achievements.length > 0 && (
                    <div className="space-y-3">
                      {draft.achievements.map((ach, index) => (
                        <RepeatRow key={index} removeLabel={`Xóa thành tích ${ach.name || index + 1}`} onRemove={() => removeAt('achievements', index)}>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1.5fr_6rem]">
                            <FormField label="Tên thành tích">
                              <Input value={ach.name} onChange={(e) => updateAt('achievements', index, { name: e.target.value })} placeholder="VD: Giải Nhì Hackathon" />
                            </FormField>
                            <FormField label="Đơn vị cấp">
                              <Input value={ach.issuer} onChange={(e) => updateAt('achievements', index, { issuer: e.target.value })} placeholder="VD: Đại học FPT" />
                            </FormField>
                            <FormField label="Năm">
                              <Input type="number" value={ach.year} onChange={(e) => updateAt('achievements', index, { year: Number(e.target.value) })} />
                            </FormField>
                            <div className="sm:col-span-3">
                              <FormField label="Link minh chứng" helperText="Ảnh giấy khen, trang công bố hoặc chứng chỉ online.">
                                <Input type="url" value={ach.url || ''} onChange={(e) => updateAt('achievements', index, { url: e.target.value })} placeholder="https://" />
                              </FormField>
                            </div>
                          </div>
                        </RepeatRow>
                      ))}
                    </div>
                  )}
                </SubSection>
              </>
            )}

            {step.key === 'intro' && (
              <>
                <FormField label="Dòng giới thiệu ngắn" required helperText="Hiện ngay dưới tên bạn trên thẻ Mentor.">
                  <div className="space-y-1">
                    <Input
                      value={draft.about.headline}
                      maxLength={HEADLINE_MAX}
                      onChange={(e) => patch('about', { headline: e.target.value })}
                      placeholder="VD: Backend Developer | Kèm CSD201, PRJ301 cho K18–K19"
                    />
                    <div className="text-right"><CharCount value={draft.about.headline} max={HEADLINE_MAX} /></div>
                  </div>
                </FormField>

                <FormField label="Giới thiệu bản thân" required helperText="Bạn kèm theo cách nào, đã giúp ai đạt được gì.">
                  <div className="space-y-1">
                    <Textarea
                      rows={5}
                      maxLength={BIO_MAX}
                      value={draft.about.bio}
                      onChange={(e) => patch('about', { bio: e.target.value })}
                      placeholder="VD: Mình hay dùng bài tập nhỏ để giải thích thuật toán, mỗi buổi đều có bài về nhà..."
                    />
                    <div className="text-right"><CharCount value={draft.about.bio} max={BIO_MAX} /></div>
                  </div>
                </FormField>

                <FormField label="Vì sao bạn muốn làm Mentor?" required helperText="Chỉ Ban Quản trị đọc phần này.">
                  <Textarea
                    rows={3}
                    value={draft.about.motivation}
                    onChange={(e) => patch('about', { motivation: e.target.value })}
                  />
                </FormField>

                <SubSection title="Minh chứng" hint="Dán đường dẫn Google Drive, GitHub hoặc trang cá nhân. Nhớ mở quyền xem.">
                  <div className="space-y-4">
                    <FormField label="CV" required>
                      <Input type="url" value={draft.evidence.cvUrl} onChange={(e) => patch('evidence', { cvUrl: e.target.value })} placeholder="https://drive.google.com/..." />
                    </FormField>
                    <FormField label="Portfolio, GitHub, LinkedIn" helperText="Dán từng link rồi nhấn Enter.">
                      <TagInput
                        value={draft.evidence.portfolioUrls}
                        onChange={(portfolioUrls) => patch('evidence', { portfolioUrls })}
                        placeholder="https://github.com/..."
                        max={5}
                      />
                    </FormField>
                    <FormField label="Bảng điểm" helperText="Giúp xét duyệt nhanh hơn với các môn bạn nhận kèm.">
                      <Input
                        type="url"
                        value={draft.evidence.otherFiles[0]?.url || ''}
                        onChange={(e) =>
                          patch('evidence', {
                            otherFiles: e.target.value
                              ? [{ name: 'Bảng điểm', url: e.target.value }, ...draft.evidence.otherFiles.slice(1)]
                              : draft.evidence.otherFiles.slice(1),
                          })
                        }
                        placeholder="https://"
                      />
                    </FormField>
                  </div>
                </SubSection>

                <label className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                  <Checkbox
                    checked={Boolean(draft.agreed)}
                    onCheckedChange={(checked) => set('agreed', checked === true)}
                    className="mt-0.5"
                  />
                  <span>Tôi xác nhận thông tin trên là đúng và đồng ý tuân thủ quy tắc dành cho Mentor SCS.</span>
                </label>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" disabled={stepIndex === 0} onClick={() => changeStep(stepIndex - 1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Bước trước
            </Button>
            {stepIndex < APPLICATION_STEPS.length - 1 ? (
              <Button onClick={() => changeStep(stepIndex + 1)}>
                Tiếp: {APPLICATION_STEPS[stepIndex + 1].title} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  if (await saveDraft(false)) navigate('/mentor/apply/review');
                }}
              >
                Xem lại hồ sơ <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Xem trước trực tiếp: học viên sẽ thấy bạn thế này */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-sm dark:border-neutral-700/80">
            <p className="border-b border-neutral-100 px-5 py-3 text-sm font-medium text-neutral-600 dark:border-neutral-800">
              Học viên sẽ thấy bạn thế này
            </p>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <UserAvatar user={user ? { id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl } : undefined} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{user?.fullName || 'Tên của bạn'}</p>
                  <p className={cn('line-clamp-2 text-sm', draft.about.headline ? 'text-neutral-700 dark:text-neutral-300' : 'italic text-neutral-400')}>
                    {draft.about.headline || 'Dòng giới thiệu ngắn ở bước 4'}
                  </p>
                </div>
              </div>
              {draft.focus.areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {draft.focus.areas.map((area) => (
                    <span key={area} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {area}
                    </span>
                  ))}
                </div>
              )}
              {subjects.some((s) => s.code) && (
                <p className="text-sm text-neutral-600">
                  Nhận kèm: <span className="font-medium text-neutral-900 dark:text-neutral-100">{subjects.map((s) => s.code).filter(Boolean).join(', ')}</span>
                </p>
              )}
              {draft.education.gpaPublic && draft.education.gpa ? (
                <p className="text-sm text-neutral-600">GPA {draft.education.gpa}/{draft.education.gpaScale ?? 4}</p>
              ) : null}
              <p className={cn('line-clamp-4 text-sm leading-relaxed', draft.about.bio ? 'text-neutral-600' : 'italic text-neutral-400')}>
                {draft.about.bio || 'Phần giới thiệu bản thân sẽ hiện ở đây.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm dark:border-neutral-700/80">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {totalIssues === 0 ? 'Hồ sơ đã đủ để nộp' : `Còn ${totalIssues} mục trước khi nộp`}
            </p>
            {totalIssues === 0 ? (
              <p className="mt-1 text-sm text-neutral-600">Bấm Xem lại hồ sơ ở bước 4 để kiểm tra lần cuối và nộp.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {APPLICATION_STEPS.map((item, index) =>
                  issues[item.key as ApplicationStepKey].length === 0 ? null : (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => changeStep(index)}
                        className="text-xs font-semibold text-neutral-500 hover:text-primary"
                      >
                        Bước {index + 1}: {item.title}
                      </button>
                      <ul className="mt-1 space-y-1">
                        {issues[item.key].map((issue) => (
                          <li key={issue} className="flex items-start gap-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                            <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                )}
              </ul>
            )}
            <p className="mt-4 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800">
              Lịch rảnh, hình thức kèm và học phí bạn sẽ đặt trong Mentor Center sau khi được duyệt.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MentorApplyFormPage;
