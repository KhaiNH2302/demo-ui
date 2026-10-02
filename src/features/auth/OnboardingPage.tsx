import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  User as UserIcon,
  MapPin,
  Sparkles,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  Camera,
  Image as ImageIcon,
  Plus,
  X,
  ExternalLink,
  Bot,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { AudienceSelect } from '../profile/fields/AudienceSelect';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import type {
  StudentProfile,
  EducationEntry,
  ProfileLink,
  ScheduleSlot,
  Audience,
} from '@/types/entities';
import {
  UNIVERSITIES,
  CAMPUSES,
  MAJORS,
  COHORTS,
  PROVINCES,
  SKILL_SUGGESTIONS,
  INTEREST_SUGGESTIONS,
  HOBBY_SUGGESTIONS,
  GOAL_SUGGESTIONS,
  LINK_TYPES,
} from '../profile/profileConstants';

const STEPS = [
  { id: 1, title: 'Học vấn', desc: 'Trường, ngành, khóa, MSSV', icon: GraduationCap, required: true },
  { id: 2, title: 'Ảnh & Giới thiệu', desc: 'Avatar, ảnh bìa, tiểu sử', icon: UserIcon, required: false },
  { id: 3, title: 'Nơi sống & Liên hệ', desc: 'Tỉnh/thành, SĐT, liên kết', icon: MapPin, required: false },
  { id: 4, title: 'Kỹ năng & Sở thích', desc: 'Kỹ năng, sở thích, mục tiêu', icon: Sparkles, required: false },
  { id: 5, title: 'Khung giờ rảnh', desc: 'Lịch rảnh hàng tuần', icon: Clock, required: false },
  { id: 6, title: 'Quyền riêng tư & Hoàn tất', desc: 'Bảo mật, AI, xem trước', icon: ShieldCheck, required: false },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [currentStep, setCurrentStep] = useState(0); // 0 to 5
  const [isSaving, setIsSaving] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Form states
  // Step 1: Education
  const [schoolName, setSchoolName] = useState(currentUser?.school || UNIVERSITIES[0]);
  const [campus, setCampus] = useState(currentUser?.campus || CAMPUSES[0]);
  const [major, setMajor] = useState(currentUser?.major || MAJORS[0]);
  const [cohort, setCohort] = useState(currentUser?.cohort || 'K18');
  const [studentCode, setStudentCode] = useState(currentUser?.studentCode || '');
  const [eduErrors, setEduErrors] = useState<{ studentCode?: string }>({});

  // Step 2: Photos & Intro
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || PRESET_AVATARS[0]);
  const [coverUrl, setCoverUrl] = useState(currentUser?.coverUrl || PRESET_COVERS[0]);
  const [intro, setIntro] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'undisclosed'>('male');
  const [birthday, setBirthday] = useState('2004-01-01');

  // Step 3: Places & Contact
  const [currentCity, setCurrentCity] = useState(PROVINCES[0]);
  const [hometown, setHometown] = useState(PROVINCES[1]);
  const [phone, setPhone] = useState('');
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [newLinkType, setNewLinkType] = useState<ProfileLink['type']>('github');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Step 4: Skills & Interests (Clean chips, not prefilled)
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [customHobby, setCustomHobby] = useState('');

  // Step 5: Schedule
  const [availability, setAvailability] = useState<ScheduleSlot[]>([
    { day: 'Mon', start: '18:00', end: '21:00' },
    { day: 'Wed', start: '18:00', end: '21:00' },
  ]);

  // Step 6: Privacy & Finish
  const [defaultAudience, setDefaultAudience] = useState<Audience>('public');
  const [swapMatching, setSwapMatching] = useState(true);
  const [groupMatching, setGroupMatching] = useState(true);
  const [mentoringMatching, setMentoringMatching] = useState(true);

  // Initial load
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiClient.get<any>('/profile/me');
        const apiData = res?.data || res;
        const p = apiData?.profile as StudentProfile | undefined;
        const u = apiData?.user;
        if (u) {
          if (u.school) setSchoolName(u.school);
          if (u.campus) setCampus(u.campus);
          if (u.major) setMajor(u.major);
          if (u.cohort) setCohort(u.cohort);
          if (u.studentCode) setStudentCode(u.studentCode);
          if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
          if (u.coverUrl) setCoverUrl(u.coverUrl);
        }
        if (p) {
          if (p.intro) setIntro(p.intro);
          if (p.gender) setGender(p.gender);
          if (p.birthday) setBirthday(p.birthday);
          if (p.currentCity) setCurrentCity(p.currentCity);
          if (p.hometown) setHometown(p.hometown);
          if (p.contact?.phone) setPhone(p.contact.phone);
          if (p.links) setLinks(p.links);
          if (p.skills && p.skills.length > 0) setSkills(p.skills);
          if (p.interests && p.interests.length > 0) setInterests(p.interests);
          if (p.hobbies && p.hobbies.length > 0) setHobbies(p.hobbies);
          if (p.goals && p.goals.length > 0) setGoals(p.goals);
          if (p.availability && p.availability.length > 0) setAvailability(p.availability);
          if (p.privacy) {
            setSwapMatching(p.privacy.swapMatching ?? true);
            setGroupMatching(p.privacy.groupMatching ?? true);
            setMentoringMatching(p.privacy.mentoringMatching ?? true);
          }

          // Resume from step param or first incomplete step
          const stepParam = searchParams.get('step');
          if (stepParam) {
            const parsed = parseInt(stepParam, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
              setCurrentStep(parsed - 1);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load profile for onboarding', err);
      }
    }
    loadProfile();
  }, [searchParams]);

  // Save current step data to server
  const saveCurrentStepData = async (stepIdx: number) => {
    setIsSaving(true);
    try {
      const payload: Partial<StudentProfile> & {
        school?: string;
        campus?: string;
        major?: string;
        cohort?: string;
        studentCode?: string;
        avatarUrl?: string;
        coverUrl?: string;
      } = {};

      if (stepIdx === 0) {
        // Step 1: Education
        const eduEntry: EducationEntry = {
          id: 'edu_primary',
          type: 'university',
          schoolName,
          campus,
          major,
          cohort,
          studentCode,
          fromYear: 2024,
          toYear: 2028,
          isCurrent: true,
          audience: 'public',
        };
        payload.school = schoolName;
        payload.campus = campus;
        payload.major = major;
        payload.cohort = cohort;
        payload.studentCode = studentCode;
        payload.education = [eduEntry];

        updateUser({
          school: schoolName,
          campus,
          major,
          cohort,
          studentCode,
        });
      } else if (stepIdx === 1) {
        // Step 2: Photo & Intro
        payload.avatarUrl = avatarUrl;
        payload.coverUrl = coverUrl;
        payload.intro = intro.trim();
        payload.gender = gender;
        payload.birthday = birthday;

        updateUser({
          avatarUrl,
          coverUrl,
        });
      } else if (stepIdx === 2) {
        // Step 3: Places & Contact
        payload.currentCity = currentCity;
        payload.hometown = hometown;
        payload.contact = { phone: phone.trim() };
        payload.links = links;
      } else if (stepIdx === 3) {
        // Step 4: Skills & Interests
        payload.skills = skills;
        payload.interests = interests;
        payload.hobbies = hobbies;
        payload.goals = goals;
      } else if (stepIdx === 4) {
        // Step 5: Availability
        payload.availability = availability;
      } else if (stepIdx === 5) {
        // Step 6: Privacy & Completed
        payload.privacy = {
          swapMatching,
          groupMatching,
          mentoringMatching,
          profileVisibility: defaultAudience === 'public' ? 'members' : defaultAudience === 'followers' ? 'followers' : 'private',
        };
        payload.onboarding = {
          completedSteps: [0, 1, 2, 3, 4, 5],
          completedAt: new Date().toISOString(),
        };
      }

      await apiClient.patch('/profile/me', payload);
      localStorage.setItem('scs_onboarding_last_step', String(stepIdx));
      return true;
    } catch (err) {
      console.error('Error saving step', err);
      toast.error('Lỗi khi lưu dữ liệu bước này');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    // Validate step 1
    if (currentStep === 0) {
      if (!studentCode.trim()) {
        setEduErrors({ studentCode: 'Vui lòng nhập Mã số sinh viên (MSSV)' });
        return;
      }
      setEduErrors({});
    }

    const ok = await saveCurrentStepData(currentStep);
    if (ok) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        localStorage.setItem('scs_onboarding_completed', 'true');
        toast.success('Hồ sơ đã được thiết lập thành công!');
        navigate('/profile/me');
      }
    }
  };

  const handleSkip = async () => {
    // Cannot skip Step 0 (Education is required)
    if (currentStep === 0) return;

    // Just advance to next step
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      localStorage.setItem('scs_onboarding_completed', 'true');
      navigate('/');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to add social link
  const addLink = () => {
    if (!newLinkUrl.trim()) return;
    const newL: ProfileLink = {
      id: `lnk_${Date.now()}`,
      type: newLinkType,
      url: newLinkUrl.trim(),
    };
    setLinks([...links, newL]);
    setNewLinkUrl('');
  };

  // Live preview card component
  const renderPreviewCard = () => (
    <div className="bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 shadow-md overflow-hidden sticky top-6">
      {/* Cover image */}
      <div className="h-28 w-full bg-neutral-200 dark:bg-neutral-800 relative overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600" />
        )}
      </div>

      <div className="p-4 pt-0 relative space-y-3">
        {/* Avatar */}
        <div className="-mt-10 flex items-end justify-between">
          <div className="w-20 h-20 rounded-full border-4 border-surface overflow-hidden shadow-md bg-neutral-100 dark:bg-neutral-800">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400 text-xl">
                {currentUser?.fullName?.[0] || 'U'}
              </div>
            )}
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Xem trước trực tiếp
          </span>
        </div>

        {/* Name & Bio */}
        <div>
          <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
            {currentUser?.fullName || 'Nguyễn Văn An'}
          </h4>
          {intro ? (
            <p className="text-xs text-neutral-600 dark:text-neutral-300 italic mt-0.5 line-clamp-2">
              "{intro}"
            </p>
          ) : (
            <p className="text-xs text-neutral-400 italic mt-0.5">Chưa có tiểu sử ngắn</p>
          )}
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
          {/* Education */}
          <div className="flex items-start gap-2">
            <GraduationCap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span>{major || 'Chuyên ngành'}</span>
              <span className="text-neutral-400"> · </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {schoolName || 'Trường đại học'}
              </span>
              {cohort && <span className="text-neutral-400"> ({cohort})</span>}
            </div>
          </div>

          {/* Place */}
          {(currentCity || hometown) && (
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sống tại {currentCity || 'Hà Nội'}</span>
            </div>
          )}

          {/* Links count */}
          {links.length > 0 && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-primary">{links.length} liên kết mạng xã hội</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-500 block">Kỹ năng nổi bật</span>
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {s}
                </span>
              ))}
              {skills.length > 5 && (
                <span className="text-[10px] text-neutral-400 py-0.5">+{skills.length - 5}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const progressPercent = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-900/50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Stepper */}
        <header className="bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary text-white">
                  SCS Onboarding
                </span>
                <span className="text-xs text-neutral-500">
                  Bước {currentStep + 1}/{STEPS.length} · {progressPercent}%
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {STEPS[currentStep].title}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {STEPS[currentStep].desc}
              </p>
            </div>

            {/* Mobile Preview toggle */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1.5"
                onClick={() => setMobilePreviewOpen(true)}
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                Xem trước thẻ
              </Button>
            </div>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-6 gap-2 pt-2">
            {STEPS.map((s, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={s.id} className="space-y-1">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-primary'
                        : isCurrent
                        ? 'bg-primary/80 ring-2 ring-primary/30'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                  <span
                    className={`text-[11px] hidden sm:block truncate ${
                      isCurrent
                        ? 'font-bold text-primary'
                        : isPast
                        ? 'text-neutral-700 dark:text-neutral-300'
                        : 'text-neutral-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </header>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Content (7 cols) */}
          <main className="lg:col-span-8 bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 p-6 shadow-sm space-y-6">
            {/* STEP 1: HỌC VẤN */}
            {currentStep === 0 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs leading-relaxed">
                  <strong>Thông tin bắt buộc:</strong> Trường đại học, chuyên ngành, khóa và MSSV giúp hệ thống tự động tải danh sách môn học, kích hoạt các tính năng Đổi lớp học phần và ghép nhóm đồ án.
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                      Trường đại học <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={schoolName}
                      onValueChange={setSchoolName}
                      options={UNIVERSITIES.map((u) => ({ value: u, label: u }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                        Cơ sở đào tạo
                      </label>
                      <Select
                        value={campus}
                        onValueChange={setCampus}
                        options={CAMPUSES.map((c) => ({ value: c, label: c }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                        Khóa sinh viên <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={cohort}
                        onValueChange={setCohort}
                        options={COHORTS.map((c) => ({ value: c, label: c }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                        Chuyên ngành <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={major}
                        onValueChange={setMajor}
                        options={MAJORS.map((m) => ({ value: m, label: m }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                        Mã số sinh viên (MSSV) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="VD: HE180123"
                        value={studentCode}
                        onChange={(e) => {
                          setStudentCode(e.target.value.toUpperCase());
                          if (eduErrors.studentCode) setEduErrors({});
                        }}
                        className={eduErrors.studentCode ? 'border-red-500' : ''}
                      />
                      {eduErrors.studentCode && (
                        <p className="text-[11px] text-red-500 mt-1">{eduErrors.studentCode}</p>
                      )}
                      <p className="text-[11px] text-neutral-400 mt-1">
                        MSSV được che bớt (VD: HE18••••) khi hiển thị với người dùng khác để bảo vệ danh tính.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ẢNH & GIỚI THIỆU */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Avatar selection */}
                <div>
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2 block">
                    Ảnh đại diện
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-sm bg-neutral-100">
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-neutral-500 block">Chọn nhanh ảnh đại diện mẫu:</span>
                      <div className="flex gap-2">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform ${
                              avatarUrl === url ? 'border-primary scale-105 ring-2 ring-primary/40' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt="Preset" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover selection */}
                <div>
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2 block">
                    Ảnh bìa hồ sơ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_COVERS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverUrl(url)}
                        className={`h-16 rounded-xl overflow-hidden border-2 transition-all relative ${
                          coverUrl === url ? 'border-primary ring-2 ring-primary/40' : 'border-neutral-200 dark:border-neutral-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="Cover preset" className="w-full h-full object-cover" />
                        {coverUrl === url && (
                          <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Short Intro */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Tiểu sử ngắn (≤ 101 ký tự)
                    </label>
                    <span className="text-[11px] text-neutral-400">{intro.length}/101</span>
                  </div>
                  <Textarea
                    placeholder="VD: Thích React và tìm nhóm đồ án AI, sẵn sàng trao đổi kinh nghiệm SWP391..."
                    rows={2}
                    value={intro}
                    onChange={(e) => setIntro(e.target.value.slice(0, 101))}
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Dòng giới thiệu ngắn này sẽ xuất hiện ngay dưới tên bạn trên trang cá nhân.
                  </p>
                </div>

                {/* Gender & Birthday */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                      Giới tính
                    </label>
                    <Select
                      value={gender}
                      onValueChange={(val) => setGender(val as any)}
                      options={[
                        { value: 'male', label: 'Nam' },
                        { value: 'female', label: 'Nữ' },
                        { value: 'other', label: 'Khác' },
                        { value: 'undisclosed', label: 'Không tiết lộ' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                      Ngày sinh
                    </label>
                    <Input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: NƠI SỐNG & LIÊN HỆ */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                      Tỉnh / Thành phố hiện tại
                    </label>
                    <Select
                      value={currentCity}
                      onValueChange={setCurrentCity}
                      options={PROVINCES.map((p) => ({ value: p, label: p }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                      Quê quán
                    </label>
                    <Select
                      value={hometown}
                      onValueChange={setHometown}
                      options={PROVINCES.map((p) => ({ value: p, label: p }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 block">
                    Số điện thoại liên lạc
                  </label>
                  <Input
                    placeholder="VD: 0987 654 321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Số điện thoại mặc định ở chế độ 🔒 Chỉ mình tôi, chỉ dùng để xác minh hoặc khi bạn chia sẻ.
                  </p>
                </div>

                {/* Social links */}
                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Liên kết mạng xã hội & Portfolio
                  </label>

                  <div className="flex gap-2">
                    <div className="w-36 shrink-0">
                      <Select
                        value={newLinkType}
                        onValueChange={(val) => setNewLinkType(val as any)}
                        options={LINK_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                      />
                    </div>
                    <Input
                      placeholder="https://github.com/username..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLink();
                        }
                      }}
                    />
                    <Button size="sm" variant="outline" onClick={addLink} disabled={!newLinkUrl.trim()}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
                    </Button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold capitalize text-neutral-600 dark:text-neutral-400">
                            {link.type}:
                          </span>
                          <span className="truncate text-primary">{link.url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLinks(links.filter((l) => l.id !== link.id))}
                          className="text-neutral-400 hover:text-red-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {links.length === 0 && (
                      <p className="text-xs text-neutral-400 italic">Chưa thêm liên kết nào.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: KỸ NĂNG & SỞ THÍCH */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Skills */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Kỹ năng chuyên môn
                  </label>
                  <div className="flex gap-2">
                    <Input
                      className="text-xs h-8"
                      placeholder="Thêm kỹ năng khác (Enter để thêm)..."
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customSkill.trim() && !skills.includes(customSkill.trim())) {
                            setSkills([...skills, customSkill.trim()]);
                            setCustomSkill('');
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (customSkill.trim() && !skills.includes(customSkill.trim())) {
                          setSkills([...skills, customSkill.trim()]);
                          setCustomSkill('');
                        }
                      }}
                      disabled={!customSkill.trim()}
                    >
                      Thêm
                    </Button>
                  </div>

                  {/* Selected */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((it) => it !== s))}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Suggestions */}
                  <div className="pt-1">
                    <span className="text-[11px] text-neutral-400 block mb-1">Gợi ý kỹ năng:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s))
                        .slice(0, 10)
                        .map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSkills([...skills, s])}
                            className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary hover:text-primary transition-colors"
                          >
                            + {s}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Lĩnh vực quan tâm
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_SUGGESTIONS.map((item) => {
                      const isSelected = interests.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setInterests(interests.filter((it) => it !== item));
                            } else {
                              setInterests([...interests, item]);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Mục tiêu trên SCS
                  </label>
                  <div className="space-y-1.5">
                    {GOAL_SUGGESTIONS.slice(0, 5).map((goal) => {
                      const isSelected = goals.includes(goal);
                      return (
                        <div
                          key={goal}
                          onClick={() => {
                            if (isSelected) {
                              setGoals(goals.filter((g) => g !== goal));
                            } else {
                              setGoals([...goals, goal]);
                            }
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary/5 border-primary text-neutral-900 dark:text-neutral-100 font-medium'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-primary border-primary text-white'
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span>{goal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: KHUNG GIỜ RẢNH */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Tại sao cần khung giờ rảnh?</strong>
                    <p className="mt-0.5">
                      Thuật toán SCS sẽ đối chiếu khung giờ rảnh của bạn với các bạn sinh viên khác để sắp xếp lịch hẹn đổi lớp không bị trùng giờ học, hoặc tìm nhóm đồ án có cùng thời gian rảnh trong tuần.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Thiết lập các khung giờ rảnh hàng tuần (24h)
                  </label>
                  <ScheduleInput value={availability} onChange={setAvailability} />
                </div>
              </div>
            )}

            {/* STEP 6: QUYỀN RIÊNG TƯ & HOÀN TẤT */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Default Audience */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Mức độ hiển thị hồ sơ mặc định
                  </label>
                  <AudienceSelect value={defaultAudience} onChange={setDefaultAudience} />
                  <p className="text-[11px] text-neutral-400">
                    Bạn luôn có thể tùy chỉnh quyền hiển thị riêng cho từng mục tại trang cá nhân bất kỳ lúc nào.
                  </p>
                </div>

                {/* AI Matching Toggles */}
                <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Tính năng gợi ý ghép nối thông minh AI
                    </label>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface">
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                          Tự động gợi ý đổi lớp học phần
                        </span>
                        <span className="text-[11px] text-neutral-400 block">
                          Nhận thông báo khi có người muốn đổi lớp môn bạn đang tìm
                        </span>
                      </div>
                      <Switch checked={swapMatching} onCheckedChange={setSwapMatching} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface">
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                          Gợi ý nhóm đồ án phù hợp
                        </span>
                        <span className="text-[11px] text-neutral-400 block">
                          Kết nối nhóm theo kỹ năng và khung giờ rảnh tương thích
                        </span>
                      </div>
                      <Switch checked={groupMatching} onCheckedChange={setGroupMatching} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface">
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                          Đề xuất Mentor hỗ trợ học tập
                        </span>
                        <span className="text-[11px] text-neutral-400 block">
                          Gợi ý Mentor xuất sắc theo chuyên ngành và môn học của bạn
                        </span>
                      </div>
                      <Switch checked={mentoringMatching} onCheckedChange={setMentoringMatching} />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong>Hồ sơ của bạn đã sẵn sàng!</strong>
                    <p className="mt-0.5">
                      Nhấn "Xem trang cá nhân" để chiêm ngưỡng trang hồ sơ hoàn chỉnh hoặc "Vào trang chủ" để bắt đầu trải nghiệm SCS.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions Footer */}
            <footer className="pt-6 border-t border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between gap-3">
              <div>
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    disabled={isSaving}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Quay lại
                  </Button>
                ) : (
                  <span className="text-xs text-neutral-400 italic">Bước bắt buộc</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    disabled={isSaving}
                  >
                    Để sau
                  </Button>
                )}

                {currentStep === STEPS.length - 1 ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        saveCurrentStepData(5).then(() => {
                          localStorage.setItem('scs_onboarding_completed', 'true');
                          navigate('/');
                        });
                      }}
                      disabled={isSaving}
                    >
                      Vào trang chủ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNext}
                      loading={isSaving}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Xem trang cá nhân
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    loading={isSaving}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Lưu & tiếp tục
                  </Button>
                )}
              </div>
            </footer>
          </main>

          {/* Right Column: Live Preview Card (Desktop ≥ 1024px) */}
          <aside className="hidden lg:block lg:col-span-4">
            {renderPreviewCard()}
          </aside>
        </div>
      </div>

      {/* Mobile Preview Modal */}
      <Dialog open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-base font-bold">Xem trước hồ sơ của bạn</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {renderPreviewCard()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
