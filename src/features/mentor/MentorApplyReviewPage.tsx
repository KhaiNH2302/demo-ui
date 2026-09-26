import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
  Send,
  Edit,
  User,
  BookOpen,
  Briefcase,
  Award,
  Compass,
  Clock,
  Sparkles,
  ArrowLeft,
  Video,
  MessageCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import type { MentorApplication } from '@/types/entities';

export const MentorApplyReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        title: 'Đã nộp hồ sơ xét duyệt Mentor!',
        description: 'Ban Quản trị sẽ xét duyệt hồ sơ của bạn trong vòng 1–3 ngày làm việc.',
        variant: 'success',
      });
      navigate('/mentor/apply');
    },
  });

  if (isLoading || !application) {
    return (
      <div className="space-y-6">
        <PageHeader title="Xem lại hồ sơ Mentor" backHref="/mentor/apply/form" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Xem lại hồ sơ & Xác nhận nộp"
        description="Kiểm tra lại toàn bộ thông tin đã khai báo trước khi gửi tới Ban Quản trị xét duyệt"
        backHref="/mentor/apply/form"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): All 7 Sections Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section 1 & 2 */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <User size={16} className="text-brand-600" />
                <span>1. Thông tin cá nhân & Học vấn</span>
              </h3>
              <Link to="/mentor/apply/form" className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                <Edit size={12} /> Sửa
              </Link>
            </div>

            <div className="flex items-start gap-4">
              <img
                src={application.personal?.avatarUrl}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-100"
              />
              <div className="space-y-1 text-xs text-neutral-600">
                <p><strong className="text-neutral-900">Vai trò:</strong> {application.personal?.currentRole} • {application.personal?.yearOrGraduation}</p>
                <p><strong className="text-neutral-900">Nơi làm việc:</strong> {application.personal?.workplace}</p>
                <p><strong className="text-neutral-900">Chuyên ngành:</strong> {application.education?.major} (GPA {application.education?.gpa})</p>
              </div>
            </div>
          </div>

          {/* Section 3 & 4 */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Briefcase size={16} className="text-brand-600" />
                <span>2. Kinh nghiệm & Kỹ năng</span>
              </h3>
              <Link to="/mentor/apply/form" className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                <Edit size={12} /> Sửa
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {(application.experiences || []).map((exp, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 rounded-xl">
                  <span className="font-bold text-neutral-900">{exp.title}</span> — {exp.org} ({exp.role})
                  <p className="text-neutral-600 mt-1">{exp.description}</p>
                </div>
              ))}

              <div className="flex flex-wrap gap-1.5 pt-2">
                {(application.skills || []).map((sk, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-semibold">
                    {sk.name} ({sk.level})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5 & 6 */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Compass size={16} className="text-brand-600" />
                <span>3. Định hướng & Giới thiệu</span>
              </h3>
              <Link to="/mentor/apply/form" className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                <Edit size={12} /> Sửa
              </Link>
            </div>

            <div className="space-y-2 text-xs text-neutral-700">
              <p><strong className="text-neutral-900">Headline:</strong> {application.about?.headline}</p>
              <p className="leading-relaxed"><strong className="text-neutral-900">Bio:</strong> {application.about?.bio}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(application.focus?.areas || []).map((a, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded text-[11px] font-medium">
                    #{a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Public Card Preview & Submit Action */}
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-md space-y-4 sticky top-20">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Xem trước thẻ Mentor công khai
            </div>

            {/* Simulated Public Mentor Card */}
            <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/40 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={application.personal?.avatarUrl}
                  alt="Mentor"
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-brand-300"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-neutral-900 block truncate">
                    Nguyễn Văn A
                  </span>
                  <span className="text-[11px] text-brand-700 font-medium block truncate">
                    {application.about?.headline || 'Mentor SCS'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                {application.about?.bio}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-brand-100 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1"><Video size={12} /> Online</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> Chat</span>
                <span>• Tối đa {application.focus?.maxMentees || 4} mentee</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Send size={16} />
              <span>Xác nhận & Nộp hồ sơ</span>
            </button>

            <p className="text-[11px] text-neutral-400 text-center leading-snug">
              Sau khi nộp, bạn vẫn có thể theo dõi trạng thái hoặc rút hồ sơ bất kỳ lúc nào.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorApplyReviewPage;
