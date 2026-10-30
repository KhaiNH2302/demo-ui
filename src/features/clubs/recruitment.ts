import type { ClubOpportunity, OpportunityResponse } from '@/types/entities';

export const CLUB_CATEGORIES = {
  Tech: 'Công nghệ & Lập trình',
  Academic: 'Học thuật & Ngôn ngữ',
  Media: 'Truyền thông & Nhiếp ảnh',
  Art: 'Nghệ thuật & Âm nhạc',
  Sports: 'Thể thao & Cờ',
  Volunteer: 'Tình nguyện & Xã hội',
};
export const DEPARTMENTS = {
  tech: 'Chuyên môn & Kỹ thuật',
  media: 'Truyền thông & Thiết kế',
  logistics: 'Hậu cần & Đối ngoại',
  events: 'Sự kiện & Điều phối',
  other: 'Khác',
};
export const isRecruitment = (item: Pick<ClubOpportunity, 'type'>) =>
  item.type === 'MemberRecruitment' || item.type === 'CollaboratorRecruitment';
export const isRecruitmentOpen = (item: ClubOpportunity, now = Date.now()) =>
  isRecruitment(item) &&
  item.status === 'Published' &&
  Date.parse(item.registrationDeadline) > now &&
  item.used < item.quota &&
  (!item.positions?.length ||
    item.positions.some((p) => p.registeredCount < p.quota));
export const isResultOverdue = (
  response: Pick<OpportunityResponse, 'status'>,
  opportunity?: Pick<ClubOpportunity, 'resultDeadline'> | null,
  now = Date.now()
) =>
  Boolean(
    opportunity?.resultDeadline &&
    Date.parse(opportunity.resultDeadline) < now &&
    ['Submitted', 'UnderReview'].includes(response.status)
  );
export const formatClubDate = (date?: string) =>
  date && Number.isFinite(Date.parse(date))
    ? new Date(date).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Chưa công bố';
export function matchesDepartment(item: ClubOpportunity, department: string) {
  if (!department || department === 'all') return true;
  if (item.department === department) return true;
  const text =
    `${item.title} ${item.tags.join(' ')} ${item.positions?.map((p) => `${p.name} ${p.description}`).join(' ')}`.toLocaleLowerCase(
      'vi'
    );
  const patterns: Record<string, RegExp> = {
    tech: /kỹ thuật|lập trình|code|backend|frontend|tech/,
    media: /truyền thông|thiết kế|media|content|design/,
    logistics: /hậu cần|đối ngoại|logistics/,
    events: /sự kiện|điều phối|lễ tân|mc/,
  };
  return patterns[department]?.test(text) ?? false;
}

export function validateRecruitment(
  item: Partial<ClubOpportunity>,
  now = Date.now(),
  publishing = true
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isRecruitment(item as ClubOpportunity))
    errors.type = 'Sự kiện CLB được tạo trong mục Hoạt động.';
  if (typeof item.title !== 'string' || !item.title.trim())
    errors.title = 'Nhập tên đợt tuyển.';
  if (
    publishing &&
    (typeof item.description !== 'string' || !item.description.trim())
  )
    errors.description = 'Mô tả công việc, yêu cầu và quyền lợi của đợt tuyển.';
  if (
    !Number.isSafeInteger(item.quota) ||
    Number(item.quota) < Math.max(1, item.used || 0)
  )
    errors.quota =
      'Chỉ tiêu phải là số nguyên dương và không thấp hơn số đã nhận.';
  if (
    publishing &&
    (!Number.isFinite(Date.parse(item.registrationDeadline || '')) ||
      Date.parse(item.registrationDeadline!) <= now)
  )
    errors.registrationDeadline = 'Hạn nhận đơn phải ở tương lai.';
  if (
    publishing &&
    (!Number.isFinite(Date.parse(item.resultDeadline || '')) ||
      Date.parse(item.resultDeadline!) <
        Date.parse(item.registrationDeadline || ''))
  )
    errors.resultDeadline = 'Chọn hạn trả kết quả từ sau hạn nhận đơn.';
  if (
    publishing &&
    (typeof item.expectedCommitment !== 'string' ||
      !item.expectedCommitment.trim())
  )
    errors.expectedCommitment = 'Nêu thời gian và mức cam kết khi tham gia.';
  if (
    item.positions?.some(
      (p) =>
        !p.name.trim() ||
        !Number.isSafeInteger(p.quota) ||
        p.quota < Math.max(1, p.registeredCount)
    )
  )
    errors.positions = 'Mỗi vị trí cần tên và chỉ tiêu hợp lệ.';
  if (
    item.positions?.length &&
    item.positions.reduce((sum, p) => sum + p.quota, 0) !== item.quota
  )
    errors.positions = 'Tổng chỉ tiêu các vị trí phải bằng chỉ tiêu đợt tuyển.';
  if (
    item.questions?.some(
      (q) =>
        !q.label.trim() ||
        (['single', 'multi'].includes(q.kind) &&
          (!q.options || q.options.filter((o) => o.trim()).length < 2))
    )
  )
    errors.questions =
      'Điền nội dung câu hỏi; câu lựa chọn cần ít nhất hai phương án.';
  if (
    item.onboarding &&
    (!Number.isFinite(Date.parse(item.onboarding.startAt)) ||
      !Number.isFinite(Date.parse(item.onboarding.endAt)) ||
      Date.parse(item.onboarding.endAt) <=
        Date.parse(item.onboarding.startAt) ||
      Date.parse(item.onboarding.startAt) <
        Date.parse(item.resultDeadline || '') ||
      typeof item.onboarding.location !== 'string' ||
      !item.onboarding.location.trim())
  )
    errors.onboarding =
      'Lịch gặp mặt cần địa điểm, giờ kết thúc sau giờ bắt đầu và diễn ra sau hạn trả kết quả.';
  return errors;
}

export function reuseRecruitment(
  source: ClubOpportunity
): Partial<ClubOpportunity> {
  return {
    type: source.type,
    title: `${source.title} — đợt mới`,
    summary: source.summary,
    description: source.description,
    tags: [...source.tags],
    coverImageUrl: source.coverImageUrl || source.coverUrl,
    gallery: source.gallery?.map((image) => ({ ...image })),
    expectedCommitment: source.expectedCommitment,
    department: source.department,
    commitmentType: source.commitmentType,
    mode: source.mode,
    locationOrLink: source.locationOrLink,
    contactUserId: source.contactUserId,
    quota: source.quota,
    positions: source.positions?.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      registeredCount: 0,
    })),
    questions: source.questions.map((q) => ({
      ...q,
      id: crypto.randomUUID(),
      options: q.options ? [...q.options] : undefined,
    })),
  };
}

const escapeCalendar = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
export function onboardingCalendar(item: ClubOpportunity) {
  if (
    !item.onboarding ||
    !Number.isFinite(Date.parse(item.onboarding.startAt)) ||
    !Number.isFinite(Date.parse(item.onboarding.endAt))
  )
    return null;
  const stamp = (value: string) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SCS//Club Recruitment//VI',
    'BEGIN:VEVENT',
    `UID:club-${item.id}@scs.local`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(item.onboarding.startAt)}`,
    `DTEND:${stamp(item.onboarding.endAt)}`,
    `SUMMARY:${escapeCalendar(`Gặp mặt: ${item.clubName}`)}`,
    `LOCATION:${escapeCalendar(item.onboarding.location)}`,
    `DESCRIPTION:${escapeCalendar(item.onboarding.description || item.title)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
