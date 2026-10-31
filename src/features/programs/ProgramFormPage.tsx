import { HybridQuotaFields } from './HybridQuotaFields';
import { ActivityContentField } from './ActivityContentFields';
import React, { useEffect, useState } from 'react';
import { Navigate, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { ErrorState } from '@/components/shared/ErrorState';
import { useAuthStore } from '@/store/authStore';
import type {
  FormQuestion,
  MediaImageItem,
  ProgramChannel,
  ProgramSlot,
} from '@/types/entities';
import type { ProgramType } from '@/types/status';

const toLocalDateTime = (value: string) => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16); };

const upcomingProgramDateTime = (hour: number, minute: number) => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(hour, minute, 0, 0);
  return toLocalDateTime(date.toISOString());
};

interface EligibilityData {
  eligible: boolean;
  activeChannelsCount: number;
  maxAllowed: number;
  checks: { key: string; label: string; passed: boolean }[];
}

export const ProgramFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { representedClubs, user } = useAuthStore();

  const initialStep = Math.min(Math.max(Number(searchParams.get('step')) || 1, 1), 4);
  const [step, setStep] = useState(initialStep);

  useEffect(() => {
    const requestedStep = Number(searchParams.get('step'));
    if (Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 4) {
      setStep(requestedStep);
    }
  }, [searchParams]);
  const [type, setType] = useState<ProgramType>(user?.roles.includes('club_rep') ? 'Event' : 'Workshop');

  const [clubId, setClubId] = useState(representedClubs[0]?.clubId || '');
  const [onlineLink, setOnlineLink] = useState('');
  const [offlineQuota, setOfflineQuota] = useState(30);
  const [onlineQuota, setOnlineQuota] = useState(100);
  const [onlineUnlimited, setOnlineUnlimited] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [roleNote, setRoleNote] = useState('Trưởng nhóm điều phối');
  const [tagsInput, setTagsInput] = useState('Sự kiện, Sinh viên');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<MediaImageItem[]>([]);

  const [startAt, setStartAt] = useState(upcomingProgramDateTime(8, 0));
  const [endAt, setEndAt] = useState(upcomingProgramDateTime(16, 30));
  const [mode, setMode] = useState<'Offline' | 'Online' | 'Hybrid'>('Offline');
  const [locationOrLink, setLocationOrLink] = useState('Hội trường Gamma, ĐH FPT Hà Nội');
  const [gatheringPoint, setGatheringPoint] = useState('Sảnh Tòa Alpha lúc 07:45');
  const [beneficiaryAndGoal, setBeneficiaryAndGoal] = useState('');
  const [safetyNotes, setSafetyNotes] = useState(
    'Tuân thủ hướng dẫn điều phối của BTC và quy tắc an toàn chung.'
  );
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
  const [registrationDeadline, setRegistrationDeadline] = useState(toLocalDateTime(new Date(Date.now() + 5 * 86400000).toISOString()));
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

  const { data: existingProg, isLoading, isError, refetch } = useQuery<ProgramChannel>({
    queryKey: ['program', id],
    queryFn: () => apiClient.get(`/programs/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingProg) {
      setType(existingProg.type);
      setOnlineLink(existingProg.onlineLink || '');
      setOfflineQuota(existingProg.slots?.find(s => s.attendanceMode === 'Offline')?.quota || 30);
      setOnlineQuota(existingProg.slots?.find(s => s.attendanceMode === 'Online')?.quota || 100);
      setClubId((existingProg as ProgramChannel & { clubId?: string }).clubId || '');
      setTitle(existingProg.title);
      setSummary(existingProg.summary);
      setDescription(existingProg.description);
      setRoleNote(existingProg.organizer.roleNote);
      setTagsInput(existingProg.tags.join(', '));
      setStartAt(toLocalDateTime(existingProg.startAt));
      setEndAt(toLocalDateTime(existingProg.endAt));
      setMode(existingProg.mode);
      setLocationOrLink(existingProg.locationOrLink);
      setGatheringPoint(existingProg.gatheringPoint || '');
      setBeneficiaryAndGoal(existingProg.beneficiaryAndGoal || '');
      setSafetyNotes(existingProg.safetyNotes || '');
      if (existingProg.slots) setSlots(existingProg.slots);
      if (existingProg.speakerInfo) {
        setSpeakerName(existingProg.speakerInfo.name);
        setSpeakerBio(existingProg.speakerInfo.bio);
      }
      setConfirmMode(existingProg.confirmMode);
      setQuota(existingProg.quota);
      setOnlineUnlimited(existingProg.onlineUnlimited === true);
      setCoverImageUrl(existingProg.coverImageUrl || existingProg.coverUrl || null);
      setGallery(existingProg.gallery || []);
      setRegistrationDeadline(toLocalDateTime(existingProg.registrationDeadline));
      setQuestions(existingProg.questions || []);
      setCommitted(true);
    }
  }, [existingProg]);

  useEffect(() => { if (type === 'Volunteer' && slots.length && mode !== 'Hybrid' && !(mode === 'Online' && onlineUnlimited)) setQuota(slots.reduce((sum,slot) => sum+slot.quota,0)); }, [type,slots,mode,onlineUnlimited]);

  const saveMutation = useMutation({
    mutationFn: (status: 'Draft' | 'Published') => {
      const payload = {
        type,
        isClubEvent: type === 'Event',
        clubId: type === 'Event' ? clubId : undefined,
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
        onlineUnlimited: mode !== 'Offline' && onlineUnlimited,
        locationOrLink,
        onlineLink: mode === 'Hybrid' ? onlineLink : undefined,
        gatheringPoint: type === 'Volunteer' ? gatheringPoint : undefined,
        beneficiaryAndGoal: type === 'Volunteer' ? beneficiaryAndGoal : undefined,
        slots: mode === 'Hybrid' ? ['Offline','Online'].map((m,i) => ({ id: existingProg?.slots?.find(s => s.attendanceMode === m)?.id || 'hybrid_'+m.toLowerCase(), attendanceMode: m, name: m === 'Offline' ? 'Tham gia trực tiếp' : 'Tham gia online', timeRange: 'Theo lịch chương trình', unlimited: m === 'Online' && onlineUnlimited, quota: i === 0 ? offlineQuota : onlineUnlimited ? 0 : onlineQuota, confirmedCount: existingProg?.slots?.find(s => s.attendanceMode === m)?.confirmedCount || 0 })) : type === 'Volunteer' && !(mode === 'Online' && onlineUnlimited) ? slots : [],
        safetyNotes,
        coverUrl: coverImageUrl || undefined,
        coverImageUrl,
        gallery,
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
        quota: mode === 'Hybrid' ? offlineQuota + (onlineUnlimited ? 0 : onlineQuota) : mode === 'Online' && onlineUnlimited ? 0 : Number(quota),
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        questions,
        status,
      };
      if (isEdit) {
        return apiClient.put(`/programs/${id}`, payload);
      }
      return apiClient.post('/programs', payload);
    },
    onError: (error: Error) => toast.error(error.message),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success(
        status === 'Draft'
          ? 'Đã lưu bản nháp kênh chương trình'
          : 'Đã công bố chương trình trực tiếp!'
      );
      navigate('/admin/programs');
    },
  });

  if (user?.roles.includes('club_rep') && !user.roles.includes('event_manager')) return <Navigate to="/programs/proposals" replace/>;
  if (!user?.roles.includes('event_manager')) return <ErrorState title="Cần quyền Manager" message="Student gửi ý tưởng tại mục Đề xuất của tôi." />;
  if (isEdit && isLoading) return <Card className="h-72 animate-pulse" />;
  if (isEdit && (isError || !existingProg)) return <ErrorState title="Không thể mở chương trình" onRetry={() => refetch()} />;
  if (existingProg && existingProg.organizer.userId !== user.id) return <ErrorState title="Không có quyền quản lý chương trình này" />;

  const steps = [
    { num: 1, label: 'Điều kiện & Thông tin' },
    { num: 2, label: 'Thời gian & Nội dung' },
    { num: 3, label: 'Chỉ tiêu & Câu hỏi' },
    { num: 4, label: 'Cam kết & Công bố' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <Link
        to="/admin/programs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại quản lý hoạt động</span>
      </Link>

      <div>
        <h1 className="text-page-title text-neutral-900">
          {isEdit
            ? 'Chỉnh sửa kênh chương trình cộng đồng'
            : 'Mở kênh đăng ký Tình nguyện / Workshop'}
        </h1>
        <p className="text-meta text-neutral-500 mt-1">
          Manager trực tiếp tổ chức và công bố chương trình. Student và Club Rep gửi ý tưởng ở mục Đề xuất của tôi để Manager duyệt.
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
                : 'border-neutral-200 bg-surface text-neutral-700'
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

                {(user?.roles.includes('club_rep') || existingProg?.type === 'Event') && <option value="Event">Sự kiện CLB</option>}<option disabled={!user?.roles.includes('event_manager')} value="Volunteer">Hoạt động Tình nguyện</option>
                <option disabled={!user?.roles.includes('event_manager')} value="Workshop">Workshop chia sẻ kỹ năng / học thuật</option>
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
            {type === 'Event' && (
              <div className="md:col-span-2 rounded-lg border border-brand-100 bg-brand-50/40 px-3.5 py-2.5">
                  <div className="mt-2.5">
                    <label className="block text-xs font-medium text-neutral-700 mb-1">CLB đại diện</label>
                    <Select value={clubId} onChange={(e) => setClubId(e.target.value)}>
                      {representedClubs.length > 0 ? representedClubs.map((club) => (
                        <option key={club.clubId} value={club.clubId}>{club.name}</option>
                      )) : <option value="">Chưa có CLB được xác minh</option>}
                    </Select>
                  </div>
              </div>
            )}
          </div>

          <ActivityContentField label="Tên hoạt động" value={title} onChange={setTitle} />

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Tóm tắt ngắn <span className="text-tier-danger-text">*</span>
            </label>
            <Textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={type === 'Event'
                ? 'Tóm tắt nội dung và đối tượng tham gia sự kiện trong 1–2 câu...'
                : 'Tóm tắt mục tiêu và ý nghĩa chương trình trong 1–2 câu...'}
            />
          </div>

          <ActivityContentField label="Mô tả chi tiết hoạt động" value={description} onChange={setDescription} multiline rows={5}/>

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
              {mode === 'Online' && <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={onlineUnlimited} onChange={e => setOnlineUnlimited(e.target.checked)}/>Không giới hạn số lượng tham gia</label>}
              {mode === 'Hybrid' && <div className="mt-4 space-y-3"><HybridQuotaFields offline={offlineQuota} online={onlineQuota} onOffline={setOfflineQuota} onOnline={setOnlineQuota} unlimited={onlineUnlimited} onUnlimited={setOnlineUnlimited}/><label className="block text-sm">Link tham gia online<Input aria-label="Link tham gia online" type="url" value={onlineLink} onChange={e => setOnlineLink(e.target.value)} placeholder="https://meet.google.com/..."/></label></div>}

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

              <div className={mode === 'Hybrid' || (mode === 'Online' && onlineUnlimited) ? 'hidden' : 'space-y-2.5 pt-2 border-t border-neutral-100'}>
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
          ) : type === 'Workshop' ? (
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
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

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
                {onlineUnlimited && mode !== 'Offline' ? 'Online không giới hạn số lượng' : 'Tổng chỉ tiêu'}
              </label>
              <Input
                type="number"
                min={5}
                max={500}
                placeholder={onlineUnlimited && mode !== 'Offline' ? 'Không giới hạn online' : ''}
                disabled={mode === 'Hybrid' || (mode === 'Online' && onlineUnlimited)}
                value={onlineUnlimited && mode !== 'Offline' ? '' : mode === 'Hybrid' ? offlineQuota + onlineQuota : quota}
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
                type="datetime-local"
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
              Tiếp tục: Cam kết &amp; Công bố
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
              Chỉ tiêu: <strong>{mode === 'Hybrid' ? `${offlineQuota} trực tiếp + ${onlineUnlimited ? 'online không giới hạn' : `${onlineQuota} online`}` : mode === 'Online' && onlineUnlimited ? 'Không giới hạn' : `${quota} chỗ`}</strong>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-4 rounded-lg border border-neutral-200 bg-surface cursor-pointer text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={committed}
              onChange={(e) => setCommitted(e.target.checked)}
              className="mt-1 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              <strong>Cam kết của sinh viên tổ chức:</strong> Tôi cam kết hoạt động này hoàn toàn phi thương mại, tuân thủ quy tắc an toàn học đường và chịu trách nhiệm điều phối người tham gia đúng như nội dung đã đăng ký với nhà trường.
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
                onClick={() => saveMutation.mutate('Published')}
              >
                Công bố chương trình
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProgramFormPage;
