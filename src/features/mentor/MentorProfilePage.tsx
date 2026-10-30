import React, { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CircleDashed, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatCurrency, formatScheduleSlot } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import type { Mentor, MentorPackage, MentorPricing } from '@/types/entities';
import { formatPrice, formatStartingPrice } from '@/features/mentoring/plans';
import { getSetupIssues } from './mentorSetup';

const DEFAULT_PRICING: MentorPricing = {
  pricePerSession: 0,
  minutesPerSession: 60,
  trial: { enabled: true, price: 0, minutes: 30 },
  packages: [],
};

const MODES: { value: 'online' | 'offline' | 'chat'; label: string }[] = [
  { value: 'online', label: 'Online (Meet / Discord)' },
  { value: 'offline', label: 'Gặp trực tiếp tại trường' },
  { value: 'chat', label: 'Hỏi đáp qua tin nhắn' },
];

// Các trường form này sở hữu; trạng thái nhận học viên do header Mentor Center quản lý
const EDITABLE_KEYS = ['fields', 'subjects', 'experience', 'availability', 'supportModes', 'pricing'] as const;
type EditableProfile = Pick<Mentor, (typeof EDITABLE_KEYS)[number]>;

const pickEditable = (mentor?: Partial<Mentor> | null): EditableProfile => ({
  fields: mentor?.fields ?? [],
  subjects: mentor?.subjects ?? [],
  experience: mentor?.experience ?? '',
  availability: mentor?.availability ?? [],
  supportModes: mentor?.supportModes ?? ['online'],
  pricing: mentor?.pricing,
});

const Section: React.FC<{ id: string; title: string; hint: string; children: React.ReactNode }> = ({ id, title, hint, children }) => (
  <section id={id} className="scroll-mt-24 space-y-5 rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6 dark:border-neutral-700/80">
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      <p className="text-sm text-neutral-500">{hint}</p>
    </div>
    {children}
  </section>
);

export const MentorProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const profileQuery = useQuery({
    queryKey: ['mentor', 'profile'],
    queryFn: () => apiClient.get<Mentor | null>('/mentor/profile'),
  });

  const [form, setForm] = useState<EditableProfile>(pickEditable());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (profileQuery.data && !loaded) {
      setForm(pickEditable(profileQuery.data));
      setLoaded(true);
    }
  }, [profileQuery.data, loaded]);

  // Bấm "Hoàn thiện hồ sơ" ở header → cuộn tới đúng phần còn thiếu
  useEffect(() => {
    if (!loaded || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loaded, location.hash]);

  const saved = pickEditable(profileQuery.data);
  const dirty = loaded && JSON.stringify(form) !== JSON.stringify(saved);

  // Đổi tab hay mở trang xem trước khi còn thay đổi chưa lưu → hỏi lại (đổi #phần trong cùng trang thì không)
  const leavingRef = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname
  );

  const saveMutation = useMutation({
    // Gửi kèm acceptingRequests hiện tại để không ghi đè thay đổi vừa làm ở header
    mutationFn: () =>
      apiClient.put<Mentor>('/mentor/profile', { ...form, acceptingRequests: profileQuery.data?.acceptingRequests ?? true }),
    onSuccess: () => {
      toast.success('Đã lưu hồ sơ Mentor');
      queryClient.invalidateQueries({ queryKey: ['mentor', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'mentors'] });
    },
    onError: () => toast.error('Chưa lưu được hồ sơ, thử lại sau ít phút.'),
  });

  const set = <K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const pricing: MentorPricing = form.pricing || DEFAULT_PRICING;
  const updatePricing = (patch: Partial<MentorPricing>) => set('pricing', { ...pricing, ...patch });
  const updatePackage = (index: number, patch: Partial<MentorPackage>) =>
    updatePricing({
      packages: pricing.packages.map((pkg, i) => {
        if (i !== index) return pkg;
        const next = { ...pkg, ...patch };
        return { ...next, name: `Gói ${next.sessions} buổi` };
      }),
    });
  const addPackage = () =>
    updatePricing({
      packages: [
        ...pricing.packages,
        { id: `pkg_${Date.now()}`, name: 'Gói 4 buổi', sessions: 4, price: pricing.pricePerSession * 4 },
      ],
    });

  const issues = getSetupIssues(form);
  const preview: Mentor = {
    userId: user?.id ?? '',
    acceptingRequests: profileQuery.data?.acceptingRequests ?? true,
    ...form,
  };

  return (
    <QueryBoundary queries={[profileQuery]}>
      <div className="grid grid-cols-1 items-start gap-6 pb-24 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <Section id="teach" title="Bạn kèm gì" hint="Học viên lọc Mentor theo môn và lĩnh vực.">
            <FormField label="Môn nhận kèm" required helperText="Gõ mã môn rồi nhấn Enter, VD: CSD201.">
              <TagInput value={form.subjects} onChange={(tags) => set('subjects', tags.map((t) => t.toUpperCase()))} placeholder="CSD201, PRJ301..." />
            </FormField>
            <FormField label="Lĩnh vực">
              <TagInput value={form.fields} onChange={(tags) => set('fields', tags)} placeholder="VD: Phát triển Web, Thuật toán" />
            </FormField>
            <FormField label="Kinh nghiệm nổi bật" required helperText="Một hai câu cụ thể: điểm môn, dự án, số bạn đã kèm.">
              <Textarea
                rows={3}
                value={form.experience}
                onChange={(e) => set('experience', e.target.value)}
                placeholder="VD: CSD201 đạt 9.2, đã kèm 20 bạn K18 qua môn, Top 5 ICPC vòng trường."
              />
            </FormField>
          </Section>

          <Section id="when" title="Khi nào và ở đâu" hint="Học viên chọn giờ học trong các khung bạn đặt ở đây.">
            <FormField label="Lịch rảnh hằng tuần" required>
              <ScheduleInput value={form.availability} onChange={(slots) => set('availability', slots)} />
            </FormField>
            <FormField label="Hình thức kèm">
              <div className="flex flex-wrap gap-2">
                {MODES.map((mode) => {
                  const active = form.supportModes.some((m) => m.toLowerCase() === mode.value);
                  return (
                    <Chip
                      key={mode.value}
                      selected={active}
                      onClick={() =>
                        set(
                          'supportModes',
                          active ? form.supportModes.filter((m) => m.toLowerCase() !== mode.value) : [...form.supportModes, mode.value]
                        )
                      }
                    >
                      {mode.label}
                    </Chip>
                  );
                })}
              </div>
            </FormField>
          </Section>

          <Section id="pricing" title="Học phí" hint="Nhập 0 nếu bạn kèm miễn phí. Học viên trả trực tiếp cho bạn sau khi chốt lịch.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Học phí 1 buổi (VNĐ)" required>
                <Input type="number" min={0} step={10000} value={pricing.pricePerSession} onChange={(e) => updatePricing({ pricePerSession: Number(e.target.value) || 0 })} />
              </FormField>
              <FormField label="Thời lượng 1 buổi (phút)" required>
                <Input type="number" min={15} step={15} value={pricing.minutesPerSession} onChange={(e) => updatePricing({ minutesPerSession: Number(e.target.value) || 0 })} />
              </FormField>
            </div>

            <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Cho học thử</p>
                  <p className="text-xs text-neutral-500">Học viên gặp bạn một buổi ngắn trước khi quyết định. Thẻ có học thử thường được đặt nhiều hơn.</p>
                </div>
                <Switch checked={pricing.trial.enabled} onCheckedChange={(checked) => updatePricing({ trial: { ...pricing.trial, enabled: checked } })} aria-label="Cho học thử" />
              </div>
              {pricing.trial.enabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Học phí buổi thử (VNĐ)">
                    <Input type="number" min={0} step={10000} value={pricing.trial.price} onChange={(e) => updatePricing({ trial: { ...pricing.trial, price: Number(e.target.value) || 0 } })} />
                  </FormField>
                  <FormField label="Thời lượng buổi thử (phút)">
                    <Input type="number" min={15} step={15} value={pricing.trial.minutes} onChange={(e) => updatePricing({ trial: { ...pricing.trial, minutes: Number(e.target.value) || 0 } })} />
                  </FormField>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Gói nhiều buổi</p>
                <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Thêm gói
                </Button>
              </div>
              {pricing.packages.length === 0 ? (
                <p className="text-sm text-neutral-500">Chưa có gói. Học viên chỉ đăng ký được từng buổi lẻ.</p>
              ) : (
                pricing.packages.map((pkg, index) => {
                  const perSession = Math.round(pkg.price / Math.max(1, pkg.sessions));
                  const saving = pricing.pricePerSession > 0 ? Math.round((1 - perSession / pricing.pricePerSession) * 100) : 0;
                  return (
                    <div key={pkg.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                      <FormField label="Số buổi">
                        <Input type="number" min={2} value={pkg.sessions} onChange={(e) => updatePackage(index, { sessions: Number(e.target.value) || 0 })} />
                      </FormField>
                      <FormField label="Học phí cả gói (VNĐ)" helperText={`≈ ${formatCurrency(perSession)}/buổi${saving > 0 ? `, rẻ hơn ${saving}%` : ''}`}>
                        <Input type="number" min={0} step={10000} value={pkg.price} onChange={(e) => updatePackage(index, { price: Number(e.target.value) || 0 })} />
                      </FormField>
                      <IconButton
                        type="button"
                        variant="ghost"
                        aria-label={`Xóa gói ${pkg.sessions} buổi`}
                        onClick={() => updatePricing({ packages: pricing.packages.filter((_, i) => i !== index) })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  );
                })
              )}
            </div>
          </Section>
        </div>

        {/* Xem trước: thẻ học viên thấy ở trang Tìm Mentor, cập nhật khi bạn gõ */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-surface dark:border-neutral-700/80">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-600">Học viên thấy thẻ của bạn thế này</p>
              <Link
                to="/profile/me?preview=public"
                className="shrink-0 rounded-md text-xs font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-brand-300"
              >
                Xem cả trang hồ sơ
              </Link>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <UserAvatar user={user ? { id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl } : undefined} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{user?.fullName}</p>
                  <p className="text-sm font-semibold text-brand-700">{formatStartingPrice(preview)}</p>
                </div>
              </div>
              {pricing.trial.enabled && (
                <p className="text-sm font-medium text-emerald-700">
                  Học thử {pricing.trial.minutes} phút, {formatPrice(pricing.trial.price).toLowerCase()}
                </p>
              )}
              {form.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.subjects.slice(0, 5).map((subject) => (
                    <span key={subject} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                      {subject}
                    </span>
                  ))}
                </div>
              )}
              <p className={cn('line-clamp-3 text-sm', form.experience ? 'text-neutral-600' : 'italic text-neutral-400')}>
                {form.experience || 'Kinh nghiệm nổi bật sẽ hiện ở đây.'}
              </p>
              {form.availability.length > 0 && (
                <p className="flex items-start gap-1.5 text-sm text-neutral-600">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  {form.availability.slice(0, 2).map((slot) => formatScheduleSlot(slot)).join(', ')}
                  {form.availability.length > 2 && ` +${form.availability.length - 2}`}
                </p>
              )}
            </div>
          </div>

          {issues.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Còn thiếu để học viên đặt được bạn</p>
              <ul className="mt-2 space-y-1.5">
                {issues.map((issue) => (
                  <li key={issue.key}>
                    <a href={`#${issue.section}`} className="flex items-center gap-1.5 text-sm text-amber-900 hover:underline dark:text-amber-200">
                      <CircleDashed className="h-3.5 w-3.5 shrink-0" />
                      {issue.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Thanh lưu: chỉ hiện khi có thay đổi chưa lưu */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-neutral-700">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">Bạn có thay đổi chưa lưu</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setForm(saved)}>Hoàn tác</Button>
              <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Lưu thay đổi</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && !leavingRef.current && blocker.state === 'blocked' && blocker.reset()}
        title="Rời đi mà chưa lưu?"
        description="Các thay đổi trong hồ sơ & học phí sẽ mất nếu bạn rời trang này."
        confirmLabel="Rời đi"
        cancelLabel="Ở lại chỉnh sửa"
        variant="danger"
        onConfirm={() => {
          leavingRef.current = true;
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
    </QueryBoundary>
  );
};

export default MentorProfilePage;
