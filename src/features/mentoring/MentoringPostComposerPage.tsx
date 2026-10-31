import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatCurrency, formatScheduleSlot } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { CAMPUSES, MODES, MODE_LABELS, SUBJECTS, TIME_PRESETS } from './postOptions';
import type { Mentor, MentorPost, SupportMode } from '@/types/entities';

type Lane = 'OFFER_MENTORING' | 'NEED_MENTOR';

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const ToggleChips: React.FC<{ options: { value: string; label: string }[]; value: string[]; onChange: (next: string[]) => void }> = ({
  options,
  value,
  onChange,
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => (
      <Chip
        key={option.value}
        selected={value.includes(option.value)}
        onClick={() =>
          onChange(value.includes(option.value) ? value.filter((item) => item !== option.value) : [...value, option.value])
        }
      >
        {option.label}
      </Chip>
    ))}
  </div>
);

// Trang riêng để đăng bài: /mentoring/new?type=need (học viên) hoặc ?type=offer (Mentor mở lớp)
export const MentoringPostComposerPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isMentor = Boolean(user?.roles?.some((role) => role.toLowerCase() === 'mentor'));
  const [searchParams] = useSearchParams();

  // Học viên chỉ đăng bài nhờ kèm; Mentor chọn được cả hai
  const wanted: Lane = searchParams.get('type') === 'offer' ? 'OFFER_MENTORING' : 'NEED_MENTOR';
  const [composer, setComposer] = useState<Lane>(isMentor ? wanted : 'NEED_MENTOR');

  const mentorsQuery = useQuery({
    queryKey: ['mentoring', 'mentors'],
    queryFn: () => apiClient.get<Mentor[]>('/mentoring/mentors'),
  });
  const myMentorProfile = mentorsQuery.data?.find((mentor) => mentor.userId === user?.id);

  const [form, setForm] = useState({
    subject: SUBJECTS[0].code,
    title: '',
    content: '',
    schedule: [TIME_PRESETS[1]] as string[],
    modes: ['online'] as string[],
    campus: CAMPUSES[0].value as string,
    feeMode: 'negotiable' as 'negotiable' | 'fixed',
    fee: 100000,
    sessions: 4,
    capacity: 5,
    trial: true,
    deadline: inDays(7),
  });
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const openComposer = (type: Lane) => {
    // Mentor mở lớp: lấy sẵn học phí & lịch rảnh từ hồ sơ Mentor để khỏi nhập lại
    const pricing = myMentorProfile?.pricing;
    setForm((prev) => ({
      ...prev,
      title: '',
      content: '',
      feeMode: type === 'OFFER_MENTORING' ? 'fixed' : 'negotiable',
      fee: type === 'OFFER_MENTORING' ? pricing?.pricePerSession ?? 100000 : prev.fee,
      trial: type === 'OFFER_MENTORING' ? pricing?.trial.enabled ?? true : prev.trial,
      schedule:
        type === 'OFFER_MENTORING' && myMentorProfile?.availability.length
          ? myMentorProfile.availability.map((slot) => formatScheduleSlot(slot))
          : [TIME_PRESETS[1]],
    }));
    setComposer(type);
  };

  // Hồ sơ Mentor tải xong mới có học phí và lịch để điền sẵn
  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (prefilled.current || !myMentorProfile || composer !== 'OFFER_MENTORING') return;
    prefilled.current = true;
    openComposer('OFFER_MENTORING');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMentorProfile]);

  const backTo = isMentor ? '/mentor/posts' : '/mentoring';

  const createPost = useMutation({
    mutationFn: () => {
      const offer = composer === 'OFFER_MENTORING';
      return apiClient.post<MentorPost>('/mentoring/posts', {
        title: form.title.trim(),
        content: form.content.trim(),
        contentMd: form.content.trim(),
        subject: form.subject,
        field: form.subject,
        modes: form.modes as SupportMode[],
        campus: form.modes.includes('offline') ? form.campus : undefined,
        mode: form.modes[0] || 'online',
        schedule: form.schedule,
        fee: form.feeMode === 'fixed' ? form.fee : undefined,
        sessions: form.sessions,
        trial: offer ? form.trial : undefined,
        capacity: offer ? form.capacity : 1,
        deadline: form.deadline,
        postType: composer,
        authorRole: offer ? 'mentor' : 'student',
        tags: [form.subject],
      });
    },
    onSuccess: () => {
      toast.success(composer === 'OFFER_MENTORING' ? 'Đã mở lớp kèm' : 'Đã đăng bài nhờ kèm');
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts', 'mine'] });
      // Học viên quản lý bài nhờ kèm của mình ở trang Yêu cầu; Mentor quay về Bảng tin
      navigate(!isMentor && composer === 'NEED_MENTOR' ? '/mentoring/requests?tab=posts' : backTo);
    },
    onError: () => toast.error('Chưa đăng được bài. Kiểm tra các ô bắt buộc rồi thử lại.'),
  });

  const offer = composer === 'OFFER_MENTORING';
  const scheduleOptions = Array.from(new Set([...form.schedule, ...TIME_PRESETS])).map((value) => ({ value, label: value }));
  const canSubmit = form.title.trim() && form.content.trim() && form.schedule.length > 0 && form.modes.length > 0 && form.deadline && (!form.modes.includes('offline') || form.campus);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại bảng tin
      </button>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {offer ? 'Mở lớp kèm' : 'Đăng bài nhờ kèm'}
        </h1>
        <p className="text-sm text-neutral-600">
          {offer
            ? 'Học viên thấy môn, lịch, học phí và số chỗ ngay trên thẻ bài. Học phí và lịch được lấy sẵn từ hồ sơ Mentor của bạn.'
            : 'Mentor thấy môn bạn đang vướng và giờ bạn học được, rồi gửi lời nhận kèm.'}
        </p>
        {isMentor && (
          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-700" role="tablist">
            {(['OFFER_MENTORING', 'NEED_MENTOR'] as Lane[]).map((type) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={composer === type}
                onClick={() => openComposer(type)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  composer === type ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                {type === 'OFFER_MENTORING' ? 'Mở lớp kèm' : 'Tôi cần người kèm'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5 rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6 dark:border-neutral-700/80">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[12rem_1fr]">
          <FormField label="Môn" required>
            <Select
              value={form.subject}
              onChange={(e) => setField('subject', e.target.value)}
              options={SUBJECTS.map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))}
            />
          </FormField>
          <FormField label="Tiêu đề" required>
            <Input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={offer ? 'VD: Kèm CSD201 từ mất gốc tới qua môn, 8 buổi' : 'VD: Cần người kèm ôn Practical Exam CSD201 tuần sau'}
            />
          </FormField>
        </div>

        <FormField label={offer ? 'Lớp học gồm những gì?' : 'Bạn đang vướng ở đâu?'} required>
          <Textarea
            rows={4}
            value={form.content}
            onChange={(e) => setField('content', e.target.value)}
            placeholder={
              offer
                ? 'Lộ trình từng buổi, tài liệu bạn chuẩn bị, cách bạn chữa bài...'
                : 'Phần kiến thức chưa hiểu, mục tiêu (qua môn, đạt điểm, xong đồ án), muốn học 1-1 hay nhóm nhỏ...'
            }
          />
        </FormField>

        <FormField label={offer ? 'Lịch học' : 'Giờ bạn học được'} required helperText="Chọn một hoặc nhiều khung giờ.">
          <ToggleChips options={scheduleOptions} value={form.schedule} onChange={(next) => setField('schedule', next)} />
        </FormField>

        <FormField label="Hình thức" required>
          <ToggleChips
            options={MODES.map((mode) => ({ value: mode, label: MODE_LABELS[mode] }))}
            value={form.modes}
            onChange={(next) => setField('modes', next)}
          />
        </FormField>

        {form.modes.includes('offline') && (
          <FormField label="Cơ sở FPTU" required helperText={offer ? 'Học viên gặp bạn ở cơ sở này.' : 'Bạn học được ở cơ sở này.'}>
            <Select value={form.campus} onChange={(e) => setField('campus', e.target.value)} options={[...CAMPUSES]} />
          </FormField>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label={offer ? 'Học phí mỗi buổi' : 'Học phí bạn trả được'}>
            <div className="space-y-2">
              {!offer && (
                <Select
                  value={form.feeMode}
                  onChange={(e) => setField('feeMode', e.target.value as 'negotiable' | 'fixed')}
                  options={[
                    { value: 'negotiable', label: 'Thỏa thuận' },
                    { value: 'fixed', label: 'Nhập mức cụ thể' },
                  ]}
                />
              )}
              {(offer || form.feeMode === 'fixed') && (
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={form.fee}
                  onChange={(e) => setField('fee', Number(e.target.value) || 0)}
                  aria-label="Học phí (VNĐ/buổi)"
                />
              )}
              {(offer || form.feeMode === 'fixed') && (
                <p className="text-xs text-neutral-500">{form.fee === 0 ? 'Miễn phí' : `${formatCurrency(form.fee)}/buổi`}</p>
              )}
            </div>
          </FormField>
          <FormField label={offer ? 'Số buổi' : 'Số buổi dự kiến'}>
            <Input type="number" min={1} max={30} value={form.sessions} onChange={(e) => setField('sessions', Number(e.target.value) || 1)} />
          </FormField>
          <FormField label={offer ? 'Hạn đăng ký' : 'Cần tìm trước ngày'} required>
            <Input type="date" min={inDays(0)} value={form.deadline} onChange={(e) => setField('deadline', e.target.value)} />
          </FormField>
        </div>

        {offer && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Số học viên tối đa">
              <Input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setField('capacity', Number(e.target.value) || 1)} />
            </FormField>
            <label className="flex items-center justify-between gap-3 self-end rounded-xl border border-neutral-200 px-4 py-2.5 text-sm dark:border-neutral-700">
              <span>
                <span className="block font-medium text-neutral-900 dark:text-neutral-100">Cho học thử 1 buổi</span>
                <span className="text-xs text-neutral-500">Học viên gặp bạn trước khi quyết định</span>
              </span>
              <Switch checked={form.trial} onCheckedChange={(checked) => setField('trial', checked)} />
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <Button variant="outline" onClick={() => navigate(backTo)}>Hủy</Button>
          <Button disabled={!canSubmit} loading={createPost.isPending} onClick={() => createPost.mutate()}>
            {offer ? 'Mở lớp kèm' : 'Đăng bài nhờ kèm'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MentoringPostComposerPage;
