import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  BookOpen,
  Briefcase,
  Award,
  Compass,
  MessageSquare,
  Clock,
  CheckCircle2,
  Save,
  ArrowRight,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { useToast } from '@/components/ui/Toast';
import type { MentorApplication, ScheduleSlot } from '@/types/entities';

export const MentorApplyFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState(1);

  // Form State initialized with defaults
  const [formData, setFormData] = useState<Partial<MentorApplication>>({
    personal: {
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '0987654321',
      currentRole: 'student',
      yearOrGraduation: 'Năm 3 (K17)',
      workplace: 'Đại học FPT',
      position: 'Sinh viên SE',
    },
    education: {
      major: 'Kỹ thuật phần mềm (SE)',
      gpa: 3.65,
      gpaScale: 4,
      gpaPublic: true,
      strongSubjects: [
        { code: 'CSD201', grade: '9.2' },
        { code: 'PRJ301', grade: '9.5' },
      ],
    },
    experiences: [
      {
        type: 'internship',
        title: 'Backend Software Engineering Intern',
        org: 'FPT Software HCM',
        role: 'Intern',
        from: '2025-06',
        to: '2025-12',
        description: 'Phát triển REST APIs với Spring Boot.',
      },
    ],
    skills: [
      { name: 'Java / Spring Boot', level: 'expert' },
      { name: 'Data Structures & Algorithms', level: 'good' },
      { name: 'React / TypeScript', level: 'good' },
    ],
    achievements: [
      {
        name: 'Giải Nhì FPT Edu Hackathon 2025',
        issuer: 'Tập đoàn FPT',
        year: 2025,
      },
    ],
    focus: {
      areas: ['Lập trình Backend', 'Cấu trúc dữ liệu & Giải thuật', 'Định hướng thực tập OJT'],
      subjects: ['CSD201', 'PRJ301', 'SWP391'],
      targetAudience: ['Sinh viên năm 1-2 cần kèm môn học', 'Sinh viên chuẩn bị OJT'],
      maxMentees: 4,
    },
    about: {
      headline: 'Full-stack Developer @ F-Code | Chia sẻ lộ trình Java & OJT',
      bio: 'Mình từng đạt điểm A các môn lập trình và có kinh nghiệm thực tập tại FSOFT. Sẵn sàng hỗ trợ các bạn vượt qua các môn code!',
      motivation: 'Mong muốn lan tỏa tinh thần học tập nhóm và giúp các bạn khóa dưới định hướng nghề nghiệp sớm.',
    },
    availability: {
      slots: [
        { day: 'Tue', start: '19:30', end: '21:30' },
        { day: 'Thu', start: '19:30', end: '21:30' },
      ],
      modes: ['online', 'offline', 'chat'],
      sessionMinutes: 45,
    },
    evidence: {
      cvUrl: 'https://example.com/cv-nguyen-van-a.pdf',
      portfolioUrls: ['https://github.com/nguyenvana'],
      otherFiles: [{ name: 'Bang_Diem_Tam_Thoi.pdf', url: 'https://example.com/transcript.pdf' }],
    },
    agreed: true,
  });

  const { data: serverApp } = useQuery<MentorApplication>({
    queryKey: ['mentor', 'application', 'me'],
    queryFn: () => apiClient.get('/mentor/applications/me'),
  });

  useEffect(() => {
    if (serverApp) {
      setFormData((prev) => ({ ...prev, ...serverApp }));
    }
  }, [serverApp]);

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: (data: Partial<MentorApplication>) => apiClient.put('/mentor/applications/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor', 'application', 'me'] });
      toast({ title: 'Đã tự động lưu bản nháp' });
    },
  });

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(formData);
  };

  const sections = [
    { id: 1, title: 'Thông tin cá nhân', icon: User },
    { id: 2, title: 'Chuyên ngành & Học vấn', icon: BookOpen },
    { id: 3, title: 'Kinh nghiệm & Kỹ năng', icon: Briefcase },
    { id: 4, title: 'Thành tích & Chứng chỉ', icon: Award },
    { id: 5, title: 'Định hướng Mentoring', icon: Compass },
    { id: 6, title: 'Giới thiệu bản thân', icon: MessageSquare },
    { id: 7, title: 'Thời gian, Hình thức & Minh chứng', icon: Clock },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Hồ sơ đăng ký Mentor"
        description="Điền thông tin 7 phần dưới đây để Ban Quản trị xét duyệt và cấp quyền Mentor"
        backHref="/mentor/apply"
        actions={
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Save size={15} />
            <span>Lưu bản nháp</span>
          </button>
        }
      />

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sticky Table of Contents (1/4) */}
        <div className="lg:col-span-1 space-y-2">
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs sticky top-20 space-y-2">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-2">
              Các phần hồ sơ
            </h3>
            <div className="space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-bold shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-brand-600' : 'text-neutral-400'} />
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  navigate('/mentor/apply/review');
                }}
                className="w-full py-2.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Xem lại & Nộp</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Section Content (3/4) */}
        <div className="lg:col-span-3 space-y-6">
          {/* PHẦN 1: THÔNG TIN CÁ NHÂN */}
          {activeSection === 1 && (
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <User size={18} className="text-brand-600" />
                <span>1. Thông tin cá nhân</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex items-center gap-4">
                  <img
                    src={formData.personal?.avatarUrl}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-brand-500/30"
                  />
                  <div>
                    <span className="font-semibold text-xs text-neutral-900 block">Ảnh đại diện Mentor (120px)</span>
                    <span className="text-[11px] text-neutral-500">Ảnh chân dung rõ mặt, lịch sự</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formData.personal?.phone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal!, phone: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Vai trò hiện tại</label>
                  <select
                    value={formData.personal?.currentRole || 'student'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal!, currentRole: e.target.value as any },
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="student">Sinh viên đang theo học</option>
                    <option value="alumni">Cựu sinh viên</option>
                    <option value="lecturer">Giảng viên / Trợ giảng</option>
                    <option value="professional">Chuyên gia doanh nghiệp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Khóa học / Năm tốt nghiệp</label>
                  <input
                    type="text"
                    value={formData.personal?.yearOrGraduation || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal!, yearOrGraduation: e.target.value },
                      })
                    }
                    placeholder="VD: Năm 3 (K17)"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Nơi làm việc / Tổ chức</label>
                  <input
                    type="text"
                    value={formData.personal?.workplace || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal!, workplace: e.target.value },
                      })
                    }
                    placeholder="VD: Đại học FPT TP.HCM"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PHẦN 2: CHUYÊN NGÀNH & HỌC VẤN */}
          {activeSection === 2 && (
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <BookOpen size={18} className="text-brand-600" />
                <span>2. Chuyên ngành & Học vấn</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Chuyên ngành chính</label>
                  <input
                    type="text"
                    value={formData.education?.major || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: { ...formData.education!, major: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Điểm GPA tích lũy</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.education?.gpa || 3.5}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education: { ...formData.education!, gpa: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 block">Các môn học thế mạnh (kèm điểm số)</label>
                  <div className="flex flex-wrap gap-2">
                    {(formData.education?.strongSubjects || []).map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-semibold">
                        {s.code}: {s.grade}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHẦN 3: KINH NGHIỆM & KỸ NĂNG */}
          {activeSection === 3 && (
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Briefcase size={18} className="text-brand-600" />
                <span>3. Kinh nghiệm & Kỹ năng</span>
              </h2>

              <div className="space-y-4">
                {(formData.experiences || []).map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900">{exp.title}</span>
                      <span className="text-xs text-neutral-500">{exp.from} - {exp.to || 'Hiện tại'}</span>
                    </div>
                    <p className="text-xs text-neutral-600">{exp.org} • {exp.role}</p>
                    <p className="text-xs text-neutral-700">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHẦN 4: THÀNH TÍCH & CHỨNG CHỈ */}
          {activeSection === 4 && (
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Award size={18} className="text-brand-600" />
                <span>4. Thành tích & Chứng chỉ</span>
              </h2>

              <div className="space-y-3">
                {(formData.achievements || []).map((ach, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-neutral-900 block">{ach.name}</span>
                      <span className="text-xs text-neutral-500">{ach.issuer} ({ach.year})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHẦN 5: ĐỊNH HƯỚNG MENTORING */}
          {activeSection === 5 && (
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Compass size={18} className="text-brand-600" />
                <span>5. Định hướng Mentoring</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Lĩnh vực nhận hướng dẫn</label>
                  <div className="flex flex-wrap gap-2">
                    {(formData.focus?.areas || []).map((a, idx) => (
                      <span key={idx} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-semibold">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Số lượng Mentee tối đa đồng thời</label>
                  <input
                    type="number"
                    value={formData.focus?.maxMentees || 4}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        focus: { ...formData.focus!, maxMentees: parseInt(e.target.value) },
                      })
                    }
                    className="w-32 h-10 px-3 rounded-xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PHẦN 6: GIỚI THIỆU BẢN THÂN */}
          {activeSection === 6 && (
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-brand-600" />
                <span>6. Giới thiệu bản thân</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Tiêu đề ngắn (Headline)</label>
                  <input
                    type="text"
                    value={formData.about?.headline || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        about: { ...formData.about!, headline: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Đôi dòng giới thiệu (Bio)</label>
                  <textarea
                    rows={4}
                    value={formData.about?.bio || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        about: { ...formData.about!, bio: e.target.value },
                      })
                    }
                    className="w-full p-3 rounded-xl border border-neutral-300 text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PHẦN 7: THỜI GIAN, HÌNH THỨC & MINH CHỨNG */}
          {activeSection === 7 && (
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Clock size={18} className="text-brand-600" />
                <span>7. Thời gian, Hình thức & Minh chứng</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-2">Lịch rảnh có thể mentoring</label>
                  <ScheduleInput
                    value={formData.availability?.slots || []}
                    onChange={(slots) =>
                      setFormData({
                        ...formData,
                        availability: { ...formData.availability!, slots },
                      })
                    }
                  />
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Đường dẫn CV / Portfolio</label>
                  <input
                    type="text"
                    value={formData.evidence?.cvUrl || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evidence: { ...formData.evidence!, cvUrl: e.target.value },
                      })
                    }
                    placeholder="https://example.com/cv.pdf"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={formData.agreed}
                    onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                    className="h-4 w-4 text-brand-600 rounded"
                  />
                  <label htmlFor="terms-check" className="text-xs text-neutral-700 cursor-pointer">
                    Tôi cam kết thông tin khai báo là chính xác và đồng ý tuân thủ quy tắc Mentor SCS.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Section Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              disabled={activeSection === 1}
              onClick={() => setActiveSection((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            >
              Phần trước
            </button>

            {activeSection < 7 ? (
              <button
                type="button"
                onClick={() => setActiveSection((prev) => Math.min(7, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Tiếp tục: Phần {activeSection + 1}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  navigate('/mentor/apply/review');
                }}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <span>Xem lại toàn bộ hồ sơ</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorApplyFormPage;
