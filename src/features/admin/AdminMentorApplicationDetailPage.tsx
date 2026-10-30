import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  User,
  BookOpen,
  Briefcase,
  Award,
  FileText,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import type { MentorApplication } from '@/types/entities';
import {
  APPLICATION_STEPS,
  EXPERIENCE_TYPE_LABELS,
  MIN_GPA,
  ROLE_LABELS,
  SKILL_LEVEL_LABELS,
  getFlaggedSteps,
  getStepIssues,
  meetsGpaThreshold,
} from '@/features/mentor/applicationSteps';

// Tiêu đề bước + ô đánh dấu "Cần bổ sung"; khóa đánh dấu trùng với bước của form ứng viên
const StepHeader: React.FC<{ index: number; icon: LucideIcon; flagged: boolean; onToggle: () => void }> = ({
  index,
  icon: Icon,
  flagged,
  onToggle,
}) => (
  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
      <Icon size={16} className="text-brand-600" />
      <span>{index + 1}. {APPLICATION_STEPS[index].title}</span>
    </h3>
    <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
      <input type="checkbox" checked={flagged} onChange={onToggle} className="rounded text-brand-600" />
      <span>Cần bổ sung bước này</span>
    </label>
  </div>
);

export const AdminMentorApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [flaggedSections, setFlaggedSections] = useState<string[]>([]);
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [requestInfoDialogOpen, setRequestInfoDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

  const { data: application, isLoading } = useQuery<MentorApplication>({
    queryKey: ['admin', 'mentor-applications', id],
    queryFn: () => apiClient.get(`/admin/mentor-applications/${id}`),
  });

  const toggleSectionFlag = (sectionName: string) => {
    setFlaggedSections((prev) =>
      prev.includes(sectionName) ? prev.filter((s) => s !== sectionName) : [...prev, sectionName]
    );
  };

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/admin/mentor-applications/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-applications'] });
      toast({
        title: 'Đã phê duyệt trở thành Mentor!',
        description: 'Tài khoản ứng viên đã được gán vai trò Mentor và mở quyền truy cập Mentor Center.',
        variant: 'success',
      });
      navigate('/admin/mentor-applications');
    },
  });

  const requestInfoMutation = useMutation({
    mutationFn: (note: string) =>
      apiClient.post(`/admin/mentor-applications/${id}/request-info`, {
        note,
        sections: flaggedSections,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-applications'] });
      toast({
        title: 'Đã gửi yêu cầu bổ sung thông tin',
        description: 'Thông báo đã được gửi tới sinh viên kèm các mục cần sửa.',
      });
      navigate('/admin/mentor-applications');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (note: string) =>
      apiClient.post(`/admin/mentor-applications/${id}/reject`, {
        reasonCode: 'INELIGIBLE',
        note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-applications'] });
      toast({
        title: 'Đã từ chối hồ sơ',
        description: 'Lý do từ chối đã được gửi thông báo tới ứng viên.',
      });
      navigate('/admin/mentor-applications');
    },
  });

  // Lần đầu mở hồ sơ: hiện lại các bước đã đánh dấu ở lần yêu cầu bổ sung trước
  useEffect(() => {
    if (application && !flagsLoaded) {
      setFlaggedSections(getFlaggedSteps(application));
      setFlagsLoaded(true);
    }
  }, [application, flagsLoaded]);

  if (isLoading || !application) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chi tiết hồ sơ Mentor" backHref="/admin/mentor-applications" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const issues = getStepIssues(application);
  const gpaScale = application.education?.gpaScale ?? 4;
  const autoChecks = [
    { ok: true, label: 'Tài khoản đã xác minh email trường' },
    {
      ok: meetsGpaThreshold(application),
      label: application.education?.gpa
        ? `GPA ${application.education.gpa}/${gpaScale} ${meetsGpaThreshold(application) ? 'đạt' : 'chưa đạt'} mức tối thiểu ${MIN_GPA[gpaScale]}`
        : 'Chưa khai GPA',
    },
    { ok: Boolean(application.evidence?.cvUrl), label: application.evidence?.cvUrl ? 'Đã đính kèm CV' : 'Chưa có CV' },
    ...APPLICATION_STEPS.map((step) => ({
      ok: issues[step.key].length === 0,
      label: issues[step.key].length === 0 ? `${step.title}: đủ thông tin` : `${step.title}: thiếu ${issues[step.key].length} mục`,
    })),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={`Xét duyệt hồ sơ #${application.id}`}
        backHref="/admin/mentor-applications"
        breadcrumb={[
          { label: 'Admin', href: '/admin' },
          { label: 'Duyệt Mentor', href: '/admin/mentor-applications' },
          { label: `Hồ sơ ${application.id}` },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): 4 bước giống form đăng ký */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bước 1: Bạn là ai */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <StepHeader index={0} icon={User} flagged={flaggedSections.includes('identity')} onToggle={() => toggleSectionFlag('identity')} />
            <div className="flex items-start gap-4">
              {application.personal?.avatarUrl && (
                <img
                  src={application.personal.avatarUrl}
                  alt="Ảnh đại diện ứng viên"
                  className="h-16 w-16 rounded-2xl object-cover ring-1 ring-neutral-200"
                />
              )}
              <dl className="space-y-1 text-sm text-neutral-700">
                <p><strong>Vai trò:</strong> {ROLE_LABELS[application.personal?.currentRole] || application.personal?.currentRole} ({application.personal?.yearOrGraduation || 'chưa ghi năm'})</p>
                <p><strong>Chuyên ngành:</strong> {application.education?.major || 'Chưa có'}</p>
                {application.personal?.currentRole !== 'student' && (
                  <p><strong>Nơi làm việc:</strong> {[application.personal?.position, application.personal?.workplace].filter(Boolean).join(' tại ') || 'Chưa cung cấp'}</p>
                )}
                <p><strong>Điện thoại:</strong> {application.personal?.phone || 'Chưa cung cấp'}</p>
              </dl>
            </div>
          </div>

          {/* Bước 2: Môn nhận kèm & năng lực */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <StepHeader index={1} icon={BookOpen} flagged={flaggedSections.includes('teaching')} onToggle={() => toggleSectionFlag('teaching')} />
            <div className="space-y-2 text-sm text-neutral-700">
              <p><strong>Lĩnh vực:</strong> {application.focus?.areas?.join(', ') || 'Chưa có'}</p>
              <p>
                <strong>GPA tích lũy:</strong>{' '}
                <span className="font-bold text-neutral-900">{application.education?.gpa ?? '—'} / {application.education?.gpaScale || 4}</span>
                <span className="text-neutral-500"> · {application.education?.gpaPublic ? 'công khai' : 'ẩn với học viên'}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(application.education?.strongSubjects || []).map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold rounded-lg text-xs">
                    {s.code}: {s.grade || 'chưa có điểm'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bước 3: Kinh nghiệm & thành tích */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <StepHeader index={2} icon={Briefcase} flagged={flaggedSections.includes('experience')} onToggle={() => toggleSectionFlag('experience')} />
            <div className="space-y-3 text-sm">
              {(application.experiences || []).map((exp, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-neutral-900">{exp.title}</span>
                    <span className="text-xs text-neutral-500">{exp.from} – {exp.to || 'Hiện tại'}</span>
                  </div>
                  <p className="text-neutral-600">{EXPERIENCE_TYPE_LABELS[exp.type]} · {[exp.org, exp.role].filter(Boolean).join(', ')}</p>
                  {exp.description && <p className="text-neutral-700">{exp.description}</p>}
                </div>
              ))}
              {(application.skills || []).length > 0 && (
                <p className="text-neutral-700">
                  <strong>Kỹ năng:</strong>{' '}
                  {application.skills.map((s) => `${s.name}${s.level ? ` (${SKILL_LEVEL_LABELS[s.level]})` : ''}`).join(', ')}
                </p>
              )}
              {(application.achievements || []).map((ach, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3">
                  <span className="flex items-center gap-2">
                    <Award size={15} className="text-amber-600" />
                    <span className="font-semibold text-neutral-900">{ach.name}</span>
                    <span className="text-neutral-500">· {ach.issuer} {ach.year}</span>
                  </span>
                  {ach.url ? (
                    <a href={ach.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600">
                      Minh chứng <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-amber-700">Chưa có minh chứng</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bước 4: Giới thiệu & minh chứng */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <StepHeader index={3} icon={FileText} flagged={flaggedSections.includes('intro')} onToggle={() => toggleSectionFlag('intro')} />
            <div className="space-y-2 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">{application.about?.headline || 'Chưa có dòng giới thiệu'}</p>
              {application.about?.bio && <p className="whitespace-pre-line">{application.about.bio}</p>}
              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-semibold text-neutral-500">Lý do muốn làm Mentor</p>
                <p>{application.about?.motivation || 'Ứng viên chưa trả lời.'}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {application.evidence?.cvUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">Preview CV ứng viên</span>
                    <a href={application.evidence.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold">
                      Mở riêng <ExternalLink size={13} />
                    </a>
                  </div>
                  <div className="h-72 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden">
                    {application.evidence.cvUrl.match(/\.(png|jpe?g|webp|gif)(\?|$)/i) ? (
                      <img src={application.evidence.cvUrl} alt="CV ứng viên" className="w-full h-full object-contain" />
                    ) : (
                      <iframe src={application.evidence.cvUrl} title="Preview CV ứng viên" className="w-full h-full" />
                    )}
                  </div>
                </div>
              )}
              {(application.evidence?.portfolioUrls || []).map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between transition-colors">
                  <span className="font-semibold text-neutral-900">Portfolio / minh chứng {index + 1}</span><ExternalLink size={14} className="text-neutral-400" />
                </a>
              ))}
              {(application.evidence?.otherFiles || []).map((file) => (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between transition-colors">
                  <span className="font-semibold text-neutral-900">{file.name}</span><ExternalLink size={14} className="text-neutral-400" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3, Sticky Action Box & Auto Checks) */}
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Trạng thái</span>
              <StatusBadge status={application.status} />
            </div>

            {/* Automated Checks */}
            <div className="space-y-2.5 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-bold text-neutral-900 block">Kiểm tra tự động:</span>
              <ul className="space-y-1.5 text-xs text-neutral-700">
                {autoChecks.map((check) => (
                  <li key={check.label} className="flex items-center gap-2">
                    {check.ok ? (
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle size={14} className="shrink-0 text-amber-600" />
                    )}
                    <span>{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveConfirmOpen(true)}
                disabled={approveMutation.isPending || application.status === 'Approved'}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Phê duyệt & Cấp quyền Mentor
              </button>

              <button
                type="button"
                onClick={() => setRequestInfoDialogOpen(true)}
                className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
              >
                Yêu cầu bổ sung thông tin
              </button>

              <button
                type="button"
                onClick={() => setRejectDialogOpen(true)}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
              >
                Từ chối hồ sơ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title="Xác nhận phê duyệt Mentor"
        description="Ứng viên sẽ được cấp vai trò Mentor, có thể mở các bài đăng mentoring và nhận yêu cầu hướng dẫn từ mentee."
        confirmLabel="Phê duyệt ngay"
        onConfirm={() => approveMutation.mutate()}
      />

      {/* Request Info Dialog */}
      <ReasonDialog
        open={requestInfoDialogOpen}
        onOpenChange={setRequestInfoDialogOpen}
        title="Yêu cầu bổ sung hồ sơ Mentor"
        description={`Nhập hướng dẫn cụ thể cho sinh viên để bổ sung các phần đã chọn (${flaggedSections.length} phần được đánh dấu).`}
        label="Nội dung yêu cầu bổ sung"
        placeholder="VD: Vui lòng bổ sung minh chứng bảng điểm có xác nhận của phòng đào tạo..."
        confirmLabel="Gửi yêu cầu"
        onConfirm={(reason) => requestInfoMutation.mutate(reason)}
      />

      {/* Reject Dialog */}
      <ReasonDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Từ chối hồ sơ ứng tuyển Mentor"
        description="Vui lòng nhập lý do từ chối để hệ thống gửi thông báo phản hồi tới sinh viên."
        label="Lý do từ chối"
        placeholder="VD: Chưa đáp ứng đủ số lượng bài chia sẻ kiến thức theo quy định..."
        confirmLabel="Xác nhận từ chối"
        onConfirm={(reason) => rejectMutation.mutate(reason)}
      />
    </div>
  );
};

export default AdminMentorApplicationDetailPage;
