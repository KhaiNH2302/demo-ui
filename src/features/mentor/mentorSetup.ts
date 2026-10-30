import type { Mentor } from '@/types/entities';

// Những việc Mentor cần làm để học viên tìm thấy và đặt được buổi học
export interface SetupIssue {
  key: 'subjects' | 'experience' | 'availability' | 'pricing';
  label: string;
  section: 'teach' | 'when' | 'pricing';
}

export const getSetupIssues = (mentor?: Partial<Mentor> | null): SetupIssue[] => {
  if (!mentor) return [];
  const issues: SetupIssue[] = [];
  if (!mentor.subjects?.length) issues.push({ key: 'subjects', label: 'Thêm môn bạn nhận kèm', section: 'teach' });
  if (!mentor.experience?.trim()) issues.push({ key: 'experience', label: 'Viết vài dòng kinh nghiệm', section: 'teach' });
  if (!mentor.availability?.length) issues.push({ key: 'availability', label: 'Đặt lịch rảnh hằng tuần', section: 'when' });
  if (!mentor.pricing) issues.push({ key: 'pricing', label: 'Đặt học phí (hoặc chọn miễn phí)', section: 'pricing' });
  return issues;
};
