import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  UserCheck,
  Send,
  XCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StatusTimeline } from '@/components/shared/StatusTimeline';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import type { MentorApplication } from '@/types/entities';

export const MentorApplyIntroPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: application, isLoading } = useQuery<MentorApplication>({
    queryKey: ['mentor', 'application', 'me'],
    queryFn: () => apiClient.get('/mentor/applications/me'),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => apiClient.post('/mentor/applications/me/withdraw'),
    onSuccess: () => {
      toast({ title: 'Đã rút hồ sơ đăng ký Mentor' });
      queryClient.invalidateQueries({ queryKey: ['mentor', 'application', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['nav', 'counters'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Đăng ký Mentor" backHref="/mentoring" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const hasApplication = application && application.status !== 'Draft' && application.status !== 'Withdrawn';

  // If user already submitted an application, show MR3 status screen
  if (hasApplication) {
    const isNeedsInfo = application.status === 'NeedsMoreInfo';
    const isApproved = application.status === 'Approved';
    const isUnderReview = application.status === 'UnderReview' || application.status === 'Submitted';

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Trạng thái hồ sơ Mentor"
          backHref="/mentoring"
          breadcrumb={[
            { label: 'Mentoring', href: '/mentoring' },
            { label: 'Hồ sơ Mentor của tôi' },
          ]}
        />

        {/* Status Card Banner */}
        <div className="p-6 rounded-2xl bg-surface border border-neutral-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900">Hồ sơ ứng tuyển Mentor</h2>
                  <StatusBadge status={application.status} />
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mã hồ sơ: <span className="font-mono text-neutral-700">{application.id}</span> • Nộp ngày{' '}
                  {application.submittedAt
                    ? new Date(application.submittedAt).toLocaleDateString('vi-VN')
                    : 'Gần đây'}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            {isNeedsInfo && (
              <Link
                to="/mentor/apply/form"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
              >
                <span>Bổ sung thông tin ngay</span>
                <ArrowRight size={14} />
              </Link>
            )}

            {isApproved && (
              <Link
                to="/mentor"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
              >
                <span>Truy cập Mentor Center</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Reviewer Note (if flagged or feedback given) */}
          {application.reviewNote && (
            <div
              className={`p-4 rounded-xl border ${
                isNeedsInfo
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                {isNeedsInfo ? (
                  <AlertCircle size={16} className="text-rose-600" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                )}
                <span>Ghi chú từ Ban Quản trị xét duyệt:</span>
              </div>
              <p className="text-xs leading-relaxed">{application.reviewNote}</p>

              {application.flaggedSections && application.flaggedSections.length > 0 && (
                <div className="mt-2 text-xs font-semibold text-rose-700">
                  Các phần cần cập nhật: {application.flaggedSections.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-neutral-900">Tiến trình xét duyệt</h3>
            <div className="space-y-3">
              {(application.history || []).map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="h-6 w-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900">{h.status}: </span>
                    <span className="text-neutral-700">{h.note || 'Cập nhật trạng thái'}</span>
                    <span className="block text-[11px] text-neutral-400">
                      {new Date(h.at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          {isUnderReview && (
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Hồ sơ đang trong hàng đợi xét duyệt của Admin.
              </span>
              <button
                type="button"
                onClick={() => withdrawMutation.mutate()}
                className="text-xs text-neutral-500 hover:text-tier-danger-text underline font-medium"
              >
                Rút hồ sơ
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MR0: Intro screen for new applicants or draft
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Trở thành Mentor SCS"
        description="Đồng hành, chia sẻ kinh nghiệm học tập và hướng dẫn các bạn sinh viên khóa dưới"
        backHref="/mentoring"
      />

      {/* Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-lg relative overflow-hidden space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
          <Sparkles size={14} className="text-amber-300" />
          <span>Chương trình Mentor Đồng hành Sinh viên</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
          Chia sẻ kiến thức, lan tỏa giá trị và nâng tầm năng lực lãnh đạo
        </h1>
        <p className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed">
          Trở thành Mentor tại SCS để trực tiếp hỗ trợ sinh viên trong các môn học thế mạnh,
          hướng dẫn phương pháp học tập và chia sẻ kinh nghiệm thực tập OJT thực tế.
        </p>
      </div>

      {/* 4-Step Process */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-neutral-900">Quy trình 4 bước trở thành Mentor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Điền hồ sơ 7 phần', desc: 'Cung cấp thành tích học tập, kỹ năng, định hướng và lịch rảnh.' },
            { step: '2', title: 'Admin xét duyệt', desc: 'Ban Quản trị kiểm tra tính chính xác và điều kiện tiêu chuẩn.' },
            { step: '3', title: 'Cấp quyền Mentor', desc: 'Nhận huy hiệu Mentor và mở giao diện Mentor Center.' },
            { step: '4', title: 'Kết nối & Hướng dẫn', desc: 'Mở slot mentoring và trực tiếp hỗ trợ các bạn mentee.' },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5">
              <div className="h-7 w-7 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
                {item.step}
              </div>
              <h3 className="font-bold text-sm text-neutral-900">{item.title}</h3>
              <p className="text-xs text-neutral-600 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility Checklist */}
      <div className="p-6 rounded-2xl bg-surface border border-neutral-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck size={18} className="text-brand-600" />
          <span>Điều kiện xét duyệt tiêu chuẩn</span>
        </h2>
        <div className="space-y-2.5">
          {[
            'Sinh viên từ năm 3 trở lên (hoặc cựu sinh viên / giảng viên / chuyên gia)',
            'Điểm trung bình tích lũy GPA đạt từ 2.8 / 4.0 trở lên',
            'Không có vi phạm quy chế học vụ hoặc kỷ luật tại trường',
            'Đã có ít nhất 3 bài viết chia sẻ hoặc câu trả lời hữu ích trên Knowledge Sharing',
          ].map((cond, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-neutral-700">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{cond}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex items-center justify-between p-6 rounded-2xl bg-brand-50 border border-brand-100">
        <div>
          <h3 className="font-bold text-base text-brand-900">Sẵn sàng đồng hành cùng cộng đồng SCS?</h3>
          <p className="text-xs text-brand-700 mt-0.5">Form đăng ký gồm 7 phần và có thể tự động lưu nháp.</p>
        </div>

        <Link
          to="/mentor/apply/form"
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all hover:scale-102"
        >
          <span>Bắt đầu điền hồ sơ</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default MentorApplyIntroPage;
