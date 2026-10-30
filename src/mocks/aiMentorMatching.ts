import type {
  AiMentorCheck,
  AiMentorCriteria,
  AiMentorMatch,
  Mentor,
  ScheduleSlot,
  TimeOfDay,
} from '@/types/entities';

// Giả lập phần "AI" cho UI demo: đọc câu tiếng Việt thành tiêu chí, rồi chấm điểm Mentor theo dữ liệu mẫu.
// Khi có BE, chỉ cần giữ nguyên hình dạng request/response (AiMentorSearchResult).

const DAY_PATTERNS: [RegExp, ScheduleSlot['day']][] = [
  [/(thứ\s*2|thứ\s*hai|\bt2\b)/i, 'Mon'],
  [/(thứ\s*3|thứ\s*ba|\bt3\b)/i, 'Tue'],
  [/(thứ\s*4|thứ\s*tư|\bt4\b)/i, 'Wed'],
  [/(thứ\s*5|thứ\s*năm|\bt5\b)/i, 'Thu'],
  [/(thứ\s*6|thứ\s*sáu|\bt6\b)/i, 'Fri'],
  [/(thứ\s*7|thứ\s*bảy|\bt7\b)/i, 'Sat'],
  [/(chủ\s*nhật|\bcn\b)/i, 'Sun'],
];

// Từ khóa thường gặp → môn / lĩnh vực có trong hồ sơ Mentor
const KEYWORD_SUBJECTS: [RegExp, string][] = [
  [/(cây|đồ thị|thuật toán|giải thuật|cấu trúc dữ liệu|dsa)/i, 'CSD201'],
  [/(java web|servlet|jsp)/i, 'PRJ301'],
  [/(spring)/i, 'Spring Boot'],
  [/(đồ án|capstone|swp)/i, 'SWP391'],
  [/(machine learning|\bai\b|trí tuệ nhân tạo|computer vision)/i, 'AIP391'],
  [/(ui\/?ux|figma|thiết kế giao diện)/i, 'UXD301'],
  [/(bảo mật|pentest|owasp|ctf)/i, 'IAP301'],
  [/(flutter|mobile)/i, 'PRM392'],
  [/(docker|ci\/cd|devops|aws)/i, 'Docker'],
];

export const parseMentorQuery = (query: string): AiMentorCriteria => {
  const text = query.trim();
  const codes = (text.match(/\b[A-Za-z]{3}\d{3}[a-z]?\b/g) || []).map((code) => code.toUpperCase());
  const fromKeywords = KEYWORD_SUBJECTS.filter(([re]) => re.test(text)).map(([, subject]) => subject);
  const subjects = Array.from(new Set([...codes, ...fromKeywords]));

  let days = DAY_PATTERNS.filter(([re]) => re.test(text)).map(([, day]) => day);
  // "thứ 3 hoặc 5", "thứ 3, 5", "thứ 3–5", "t3/t5" → lấy hết các số đi sau chữ "thứ"
  const NUMBERED: ScheduleSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const group of text.matchAll(/(?:thứ|\bt)\s*([2-7](?:\s*(?:,|và|hoặc|-|–|&|\/)\s*t?\s*[2-7])*)/gi)) {
    for (const digit of group[1].match(/[2-7]/g) || []) days.push(NUMBERED[Number(digit) - 2]);
  }
  days = Array.from(new Set(days));
  if (/cuối tuần/i.test(text)) days = Array.from(new Set([...days, 'Sat', 'Sun'] as ScheduleSlot['day'][]));

  let timeOfDay: TimeOfDay | undefined;
  if (/\btối\b/i.test(text)) timeOfDay = 'evening';
  else if (/\bchiều\b/i.test(text)) timeOfDay = 'afternoon';
  else if (/\bsáng\b/i.test(text)) timeOfDay = 'morning';

  const modes: AiMentorCriteria['modes'] = [];
  if (/(online|meet|zoom|trực tuyến)/i.test(text)) modes.push('online');
  if (/(offline|trực tiếp|gặp|tại trường|campus|thư viện)/i.test(text)) modes.push('offline');
  if (/(chat|nhắn tin|tin nhắn)/i.test(text)) modes.push('chat');

  let maxFee: number | undefined;
  if (/(miễn phí|free|không mất phí)/i.test(text)) maxFee = 0;
  const fee = text.match(/(\d{2,4})\s*(k|nghìn|ngàn)\b/i) || text.match(/(\d{2,3})\.?000\s*(đ|₫|vnd)?/i);
  if (fee) maxFee = Number(fee[1]) * 1000;

  return { subjects, days, timeOfDay, modes, maxFee, wantTrial: /(học thử|thử trước|buổi thử)/i.test(text) };
};

const DAY_LABELS: Record<ScheduleSlot['day'], string> = {
  Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN',
};

const TIME_RANGES: Record<TimeOfDay, [number, number]> = {
  morning: [6, 12],
  afternoon: [12, 18],
  evening: [18, 23],
};

const TIME_LABELS: Record<TimeOfDay, string> = { morning: 'buổi sáng', afternoon: 'buổi chiều', evening: 'buổi tối' };

const hourOf = (time: string) => Number(time.split(':')[0]);

const formatVnd = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;

const startingPrice = (mentor: Mentor) => {
  const pricing = mentor.pricing;
  if (!pricing) return undefined;
  return Math.min(
    pricing.pricePerSession,
    ...pricing.packages.map((pkg) => Math.round(pkg.price / Math.max(1, pkg.sessions)))
  );
};

// Trọng số: môn quan trọng nhất, rồi tới lịch, hình thức, ngân sách, học thử
const WEIGHTS = { subject: 40, schedule: 25, mode: 15, budget: 15, trial: 5 } as const;

export const scoreMentor = (mentor: Mentor, criteria: AiMentorCriteria): AiMentorMatch => {
  const checks: AiMentorCheck[] = [];

  if (criteria.subjects.length) {
    const haystack = [...mentor.subjects, ...mentor.fields].map((item) => item.toLowerCase());
    const hit = criteria.subjects.filter((subject) => haystack.some((item) => item.includes(subject.toLowerCase())));
    checks.push({
      key: 'subject',
      ok: hit.length > 0,
      detail: hit.length ? `Nhận kèm ${hit.join(', ')}` : `Không nhận kèm ${criteria.subjects.join(', ')}`,
    });
  }

  if (criteria.days.length || criteria.timeOfDay) {
    const slots = mentor.availability.filter((slot) => {
      const dayOk = !criteria.days.length || criteria.days.includes(slot.day);
      if (!criteria.timeOfDay) return dayOk;
      const [from, to] = TIME_RANGES[criteria.timeOfDay];
      return dayOk && hourOf(slot.start) < to && hourOf(slot.end) > from;
    });
    const wanted = [
      criteria.days.map((day) => DAY_LABELS[day]).join(', '),
      criteria.timeOfDay ? TIME_LABELS[criteria.timeOfDay] : '',
    ].filter(Boolean).join(' ');
    checks.push({
      key: 'schedule',
      ok: slots.length > 0,
      detail: slots.length
        ? `Rảnh ${slots.map((slot) => `${DAY_LABELS[slot.day]} ${slot.start}–${slot.end}`).join(', ')}`
        : `Không rảnh ${wanted}`,
    });
  }

  if (criteria.modes.length) {
    const modes = criteria.modes.filter((mode) => mentor.supportModes.map((m) => m.toLowerCase()).includes(mode));
    const label: Record<string, string> = { online: 'online', offline: 'gặp trực tiếp', chat: 'qua chat' };
    checks.push({
      key: 'mode',
      ok: modes.length > 0,
      detail: modes.length ? `Kèm ${modes.map((m) => label[m]).join(', ')}` : `Không kèm ${criteria.modes.map((m) => label[m]).join(', ')}`,
    });
  }

  if (criteria.maxFee !== undefined) {
    const price = startingPrice(mentor);
    let ok = false;
    let detail = 'Chưa công bố học phí';
    if (price !== undefined) {
      ok = price <= criteria.maxFee;
      if (price === 0) detail = 'Kèm miễn phí';
      else if (ok) detail = `Từ ${formatVnd(price)}/buổi`;
      else detail = `Từ ${formatVnd(price)}/buổi, cao hơn ${formatVnd(price - criteria.maxFee)}`;
    }
    checks.push({ key: 'budget', ok, detail });
  }

  if (criteria.wantTrial) {
    const trial = mentor.pricing?.trial;
    checks.push({
      key: 'trial',
      ok: Boolean(trial?.enabled),
      detail: trial?.enabled ? `Học thử ${trial.minutes} phút${trial.price ? `, ${formatVnd(trial.price)}` : ', miễn phí'}` : 'Không có học thử',
    });
  }

  const total = checks.reduce((sum, check) => sum + WEIGHTS[check.key], 0);
  const earned = checks.reduce((sum, check) => sum + (check.ok ? WEIGHTS[check.key] : 0), 0);
  const score = total ? Math.round((earned / total) * 100) : 0;

  return {
    mentorId: mentor.userId,
    score,
    confidence: total ? earned / total : 0,
    reasons: checks.filter((check) => check.ok).map((check) => check.detail),
    checks,
  };
};

export const rankMentors = (mentors: Mentor[], criteria: AiMentorCriteria, limit = 5): AiMentorMatch[] => {
  const subjectRequired = criteria.subjects.length > 0;
  return mentors
    .filter((mentor) => mentor.acceptingRequests)
    .map((mentor) => ({ mentor, match: scoreMentor(mentor, criteria) }))
    // Sai môn thì không gợi ý, dù khớp lịch
    .filter(({ match }) => !subjectRequired || match.checks?.find((check) => check.key === 'subject')?.ok)
    .sort((a, b) => b.match.score - a.match.score || (b.mentor.rating ?? 0) - (a.mentor.rating ?? 0))
    .slice(0, limit)
    .map(({ match }) => match);
};
