import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleDashed, ExternalLink, Pencil, Send } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { MentorApplication } from '@/types/entities';
import {
  APPLICATION_STEPS,
  EXPERIENCE_TYPE_LABELS,
  ROLE_LABELS,
  SKILL_LEVEL_LABELS,
  getStepIssues,
  isApplicationComplete,
  type ApplicationStepKey,
} from './applicationSteps';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
    <dt className="text-sm text-neutral-500">{label}</dt>
    <dd className="text-sm text-neutral-900 dark:text-neutral-100">{children}</dd>
  </div>
);

const Empty: React.FC = () => <span className="italic text-neutral-400">Chưa điền</span>;

export const MentorApplyReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data: application, isLoading } = useQuery<MentorApplication>({
    queryKey: ['mentor', 'application', 'me'],
    queryFn: () => apiClient.get('/mentor/applications/me'),
  });

  const submitMutation = useMutation({
    mutationFn: () => apiClient.post('/mentor/applications/me/submit'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor', 'application', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['nav', 'counters'] });
      toast({
        title: 'Đã nộp hồ sơ Mentor',
        description: 'Ban Quản trị sẽ phản hồi trong 1–3 ngày làm việc.',
        variant: 'success',
      });
      navigate('/mentor/apply');
    },
    onError: () => toast({ title: 'Chưa nộp được hồ sơ', description: 'Thử lại sau ít phút.', variant: 'error' }),
  });

  if (isLoading || !application) {
    return (
      <div className="space-y-6">
        <PageHeader title="Xem lại hồ sơ Mentor" backHref="/mentor/apply/form" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const issues = getStepIssues(application);
  const complete = isApplicationComplete(application);
  const subjects = application.education?.strongSubjects || [];

  const renderStep = (key: ApplicationStepKey) => {
    switch (key) {
      case 'identity':
        return (
          <dl className="space-y-2">
            <Field label="Vai trò">{ROLE_LABELS[application.personal.currentRole]}</Field>
            <Field label="Năm học / tốt nghiệp">{application.personal.yearOrGraduation || <Empty />}</Field>
            {application.personal.currentRole !== 'student' && (
              <Field label="Nơi làm việc">
                {[application.personal.position, application.personal.workplace].filter(Boolean).join(' tại ') || <Empty />}
              </Field>
            )}
            <Field label="Số điện thoại">{application.personal.phone || <Empty />}</Field>
          </dl>
        );
      case 'teaching':
        return (
          <dl className="space-y-2">
            <Field label="Lĩnh vực">{application.focus?.areas?.join(', ') || <Empty />}</Field>
            <Field label="Môn nhận kèm">
              {subjects.length ? subjects.map((s) => `${s.code}${s.grade ? ` (${s.grade})` : ''}`).join(', ') : <Empty />}
            </Field>
            <Field label="GPA">
              {application.education?.gpa
                ? `${application.education.gpa}/${application.education.gpaScale ?? 4} · ${application.education.gpaPublic ? 'hiện trên hồ sơ' : 'chỉ Ban Quản trị thấy'}`
                : <Empty />}
            </Field>
          </dl>
        );
      case 'experience':
        return (
          <div className="space-y-4">
            {(application.experiences || []).length > 0 && (
              <ul className="space-y-3">
                {application.experiences.map((exp, index) => (
                  <li key={index} className="text-sm">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {exp.title} <span className="font-normal text-neutral-500">· {EXPERIENCE_TYPE_LABELS[exp.type]}</span>
                    </p>
                    <p className="text-neutral-600">{[exp.org, exp.role].filter(Boolean).join(', ')} · {exp.from || '?'} – {exp.to || 'nay'}</p>
                    {exp.description && <p className="text-neutral-700 dark:text-neutral-300">{exp.description}</p>}
                  </li>
                ))}
              </ul>
            )}
            <dl className="space-y-2">
              <Field label="Kỹ năng">
                {(application.skills || []).length
                  ? application.skills.map((s) => `${s.name}${s.level ? ` (${SKILL_LEVEL_LABELS[s.level]})` : ''}`).join(', ')
                  : <Empty />}
              </Field>
              <Field label="Thành tích">
                {(application.achievements || []).length
                  ? application.achievements.map((a) => `${a.name} – ${a.issuer} ${a.year}`).join('; ')
                  : <Empty />}
              </Field>
            </dl>
          </div>
        );
      case 'intro':
        return (
          <dl className="space-y-2">
            <Field label="Dòng giới thiệu">{application.about?.headline || <Empty />}</Field>
            <Field label="Giới thiệu">
              <span className="whitespace-pre-line">{application.about?.bio || <Empty />}</span>
            </Field>
            <Field label="Lý do làm Mentor">{application.about?.motivation || <Empty />}</Field>
            <Field label="Minh chứng">
              {[application.evidence?.cvUrl, ...(application.evidence?.portfolioUrls || []), ...(application.evidence?.otherFiles || []).map((f) => f.url)]
                .filter(Boolean).length ? (
                <ul className="space-y-1">
                  {application.evidence.cvUrl && (
                    <li><a href={application.evidence.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">CV <ExternalLink className="h-3 w-3" /></a></li>
                  )}
                  {application.evidence.portfolioUrls.map((url) => (
                    <li key={url}><a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline break-all">{url} <ExternalLink className="h-3 w-3 shrink-0" /></a></li>
                  ))}
                  {application.evidence.otherFiles.map((file) => (
                    <li key={file.url}><a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{file.name} <ExternalLink className="h-3 w-3" /></a></li>
                  ))}
                </ul>
              ) : <Empty />}
            </Field>
          </dl>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Xem lại hồ sơ trước khi nộp"
        description="Kiểm tra từng bước. Bấm Sửa để quay lại đúng bước cần chỉnh."
        backHref="/mentor/apply/form?step=4"
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {APPLICATION_STEPS.map((step, index) => (
            <section key={step.key} className="space-y-4 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-xs dark:border-neutral-700/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={issues[step.key].length === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                    {issues[step.key].length === 0 ? <CheckCircle2 className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
                  </span>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {index + 1}. {step.title}
                  </h2>
                </div>
                <Link
                  to={`/mentor/apply/form?step=${index + 1}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" /> Sửa
                </Link>
              </div>
              {issues[step.key].length > 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  Còn thiếu: {issues[step.key].join(', ').toLowerCase()}.
                </p>
              )}
              {renderStep(step.key)}
            </section>
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-sm dark:border-neutral-700/80">
            <p className="border-b border-neutral-100 px-5 py-3 text-sm font-medium text-neutral-600 dark:border-neutral-800">
              Học viên sẽ thấy bạn thế này
            </p>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <UserAvatar user={user ? { id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl } : undefined} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{user?.fullName}</p>
                  <p className="line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300">{application.about?.headline}</p>
                </div>
              </div>
              {(application.focus?.areas || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {application.focus.areas.map((area) => (
                    <span key={area} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {area}
                    </span>
                  ))}
                </div>
              )}
              <p className="line-clamp-4 text-sm leading-relaxed text-neutral-600">{application.about?.bio}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm dark:border-neutral-700/80">
            <Button className="w-full" disabled={!complete} loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              <Send className="mr-1.5 h-4 w-4" /> Nộp hồ sơ
            </Button>
            <p className="text-xs text-neutral-500">
              {complete
                ? 'Sau khi nộp, bạn theo dõi trạng thái ở trang Đăng ký Mentor và có thể rút hồ sơ khi chưa được duyệt.'
                : 'Hoàn thành các mục còn thiếu ở bên trái để nộp hồ sơ.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MentorApplyReviewPage;
