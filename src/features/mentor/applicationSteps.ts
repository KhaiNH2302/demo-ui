import type { MentorApplication } from '@/types/entities';

// 4 bước của hồ sơ đăng ký Mentor; dùng chung cho form, trang Xem lại và trang Admin xét duyệt
export type ApplicationStepKey = 'identity' | 'teaching' | 'experience' | 'intro';

export const APPLICATION_STEPS: { key: ApplicationStepKey; title: string; description: string }[] = [
  { key: 'identity', title: 'Bạn là ai', description: 'Vai trò hiện tại và cách Ban Quản trị liên hệ' },
  { key: 'teaching', title: 'Môn nhận kèm & năng lực', description: 'Lĩnh vực, môn kèm điểm và GPA' },
  { key: 'experience', title: 'Kinh nghiệm & thành tích', description: 'Việc đã làm, kỹ năng, giải thưởng' },
  { key: 'intro', title: 'Giới thiệu & minh chứng', description: 'Lời giới thiệu, lý do và CV' },
];

// Hồ sơ cũ và Admin đánh dấu theo tên mục cũ (7 phần) → quy về bước mới
const LEGACY_SECTION_TO_STEP: Record<string, ApplicationStepKey> = {
  identity: 'identity',
  personal: 'identity',
  teaching: 'teaching',
  education: 'teaching',
  focus: 'teaching',
  experience: 'experience',
  experiences: 'experience',
  skills: 'experience',
  achievements: 'experience',
  intro: 'intro',
  about: 'intro',
  availability: 'intro',
  evidence: 'intro',
};

export const toStepKey = (section: string): ApplicationStepKey | undefined => LEGACY_SECTION_TO_STEP[section];

export const getFlaggedSteps = (application?: Partial<MentorApplication>): ApplicationStepKey[] => {
  const keys = (application?.flaggedSections || []).map(toStepKey).filter(Boolean) as ApplicationStepKey[];
  return Array.from(new Set(keys));
};

export const getStepTitle = (key: ApplicationStepKey) =>
  APPLICATION_STEPS.find((step) => step.key === key)?.title ?? key;

export const ROLE_LABELS: Record<MentorApplication['personal']['currentRole'], string> = {
  student: 'Sinh viên đang học',
  alumni: 'Cựu sinh viên',
};

export const EXPERIENCE_TYPE_LABELS: Record<MentorApplication['experiences'][number]['type'], string> = {
  internship: 'Thực tập',
  job: 'Công việc',
  project: 'Dự án',
  ta: 'Trợ giảng',
  club: 'Câu lạc bộ',
};

export const SKILL_LEVEL_LABELS: Record<'basic' | 'good' | 'expert', string> = {
  basic: 'Cơ bản',
  good: 'Khá',
  expert: 'Thành thạo',
};

export const HEADLINE_MAX = 90;
export const BIO_MAX = 600;
export const MIN_GPA = { 4: 2.8, 10: 7 } as const;

// Danh sách việc còn thiếu của từng bước; rỗng nghĩa là bước đã đủ để nộp
export const getStepIssues = (app: Partial<MentorApplication>): Record<ApplicationStepKey, string[]> => {
  const role = app.personal?.currentRole;
  const identity: string[] = [];
  if (!role) identity.push('Chọn vai trò hiện tại');
  if (!app.personal?.yearOrGraduation?.trim()) identity.push('Nhập năm học hoặc năm tốt nghiệp');
  if (role && role !== 'student' && !app.personal?.workplace?.trim()) identity.push('Nhập nơi làm việc');

  const teaching: string[] = [];
  if (!app.focus?.areas?.length) teaching.push('Thêm ít nhất 1 lĩnh vực');
  const subjects = (app.education?.strongSubjects || []).filter((s) => s.code.trim());
  if (subjects.length === 0) teaching.push('Thêm ít nhất 1 môn nhận kèm');
  if (subjects.some((s) => !s.grade?.trim())) teaching.push('Điền điểm cho từng môn');
  if (!app.education?.gpa) teaching.push('Nhập GPA tích lũy');

  const experience: string[] = [];
  const hasExperience = (app.experiences || []).some((e) => e.title.trim() && e.org.trim());
  const hasAchievement = (app.achievements || []).some((a) => a.name.trim());
  if (!hasExperience && !hasAchievement) experience.push('Thêm ít nhất 1 kinh nghiệm hoặc thành tích');
  if (!(app.skills || []).some((s) => s.name.trim())) experience.push('Thêm ít nhất 1 kỹ năng');

  const intro: string[] = [];
  if (!app.about?.headline?.trim()) intro.push('Viết dòng giới thiệu ngắn');
  if (!app.about?.bio?.trim()) intro.push('Viết phần giới thiệu bản thân');
  if (!app.about?.motivation?.trim()) intro.push('Cho biết lý do bạn muốn làm Mentor');
  if (!app.evidence?.cvUrl?.trim()) intro.push('Thêm đường dẫn CV');
  if (!app.agreed) intro.push('Xác nhận cam kết ở cuối trang');

  return { identity, teaching, experience, intro };
};

export const isApplicationComplete = (app: Partial<MentorApplication>) =>
  Object.values(getStepIssues(app)).every((issues) => issues.length === 0);

export const meetsGpaThreshold = (app: Partial<MentorApplication>) => {
  const gpa = app.education?.gpa;
  if (!gpa) return false;
  return gpa >= MIN_GPA[app.education?.gpaScale ?? 4];
};
