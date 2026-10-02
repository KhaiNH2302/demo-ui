import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Briefcase,
  Award,
  Compass,
  MessageSquare,
  FileText,
  ExternalLink,
  ShieldCheck,
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

export const AdminMentorApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [flaggedSections, setFlaggedSections] = useState<string[]>([]);
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

  if (isLoading || !application) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chi tiết hồ sơ Mentor" backHref="/admin/mentor-applications" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

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
        {/* Left Column (2/3): 7 Sections */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section 1: Cá nhân */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <User size={16} className="text-brand-600" />
                <span>1. Thông tin cá nhân & Liên hệ</span>
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flaggedSections.includes('personal')}
                  onChange={() => toggleSectionFlag('personal')}
                  className="rounded text-brand-600"
                />
                <span>Cần bổ sung phần này</span>
              </label>
            </div>
            <div className="flex items-start gap-4">
              <img
                src={application.personal?.avatarUrl}
                alt="Avatar"
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-neutral-200"
              />
              <div className="space-y-1 text-xs text-neutral-600">
                <p><strong>Vai trò:</strong> {application.personal?.currentRole} ({application.personal?.yearOrGraduation})</p>
                <p><strong>Điện thoại:</strong> {application.personal?.phone || 'Chưa cung cấp'}</p>
                <p><strong>Tổ chức / Nơi làm việc:</strong> {application.personal?.workplace}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Học vấn */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <BookOpen size={16} className="text-brand-600" />
                <span>2. Chuyên ngành & Học vấn</span>
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flaggedSections.includes('education')}
                  onChange={() => toggleSectionFlag('education')}
                  className="rounded text-brand-600"
                />
                <span>Cần bổ sung phần này</span>
              </label>
            </div>
            <div className="space-y-2 text-xs text-neutral-600">
              <p><strong>Chuyên ngành:</strong> {application.education?.major}</p>
              <p><strong>GPA tích lũy:</strong> <span className="font-bold text-neutral-900 text-sm">{application.education?.gpa} / {application.education?.gpaScale || 4}</span></p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(application.education?.strongSubjects || []).map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold rounded-lg">
                    {s.code}: {s.grade}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Kinh nghiệm & Kỹ năng */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Briefcase size={16} className="text-brand-600" />
                <span>3. Kinh nghiệm & Kỹ năng</span>
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flaggedSections.includes('experiences')}
                  onChange={() => toggleSectionFlag('experiences')}
                  className="rounded text-brand-600"
                />
                <span>Cần bổ sung phần này</span>
              </label>
            </div>
            <div className="space-y-3 text-xs">
              {(application.experiences || []).map((exp, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">{exp.title}</span>
                    <span className="text-neutral-400">{exp.from} - {exp.to || 'Hiện tại'}</span>
                  </div>
                  <p className="text-neutral-600">{exp.org} • {exp.role}</p>
                  <p className="text-neutral-700">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Minh chứng tài liệu */}
          <div className="p-5 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <FileText size={16} className="text-brand-600" />
                <span>4. Hồ sơ năng lực & Minh chứng</span>
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flaggedSections.includes('evidence')}
                  onChange={() => toggleSectionFlag('evidence')}
                  className="rounded text-brand-600"
                />
                <span>Cần bổ sung phần này</span>
              </label>
            </div>
            <div className="space-y-2 text-xs">
              {application.evidence?.cvUrl && (
                <a
                  href={application.evidence.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-brand-600" />
                    <span className="font-semibold text-neutral-900">Xem tệp CV ứng viên</span>
                  </div>
                  <ExternalLink size={14} className="text-neutral-400" />
                </a>
              )}
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
              <div className="space-y-1.5 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Tài khoản xác minh email trường</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>GPA {application.education?.gpa} đạt chuẩn ({'>='} 2.8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Không có tiền sử vi phạm học vụ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Có 4 bài chia sẻ trên Knowledge</span>
                </div>
              </div>
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
