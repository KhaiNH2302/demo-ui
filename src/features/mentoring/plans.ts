import { formatCurrency } from '@/lib/format';
import type { Mentor, MentoringPlanType, ScheduleSlot } from '@/types/entities';

// Một lựa chọn học mà học viên có thể chọn khi gửi yêu cầu (học thử / 1 buổi / gói N buổi)
export interface MentoringPlanOption {
  id: string;
  type: MentoringPlanType;
  packageId?: string;
  title: string;
  sessions: number;
  minutes: number;
  price: number;
}

export const formatPrice = (amount: number) => (amount > 0 ? formatCurrency(amount) : 'Miễn phí');

// Học phí ghi trên bài đăng: dùng chung cho thẻ ở Feed, trang chi tiết và hộp thoại đăng ký
export const describePostFee = (fee?: number | null) => {
  if (fee === undefined || fee === null) return 'Thỏa thuận';
  if (fee === 0) return 'Miễn phí';
  return `${formatCurrency(fee)}/buổi`;
};

export const getPlanOptions = (mentor?: Mentor | null): MentoringPlanOption[] => {
  const pricing = mentor?.pricing;
  if (!pricing) return [];
  const options: MentoringPlanOption[] = [];
  if (pricing.trial.enabled) {
    options.push({
      id: 'trial',
      type: 'TRIAL',
      title: 'Học thử',
      sessions: 1,
      minutes: pricing.trial.minutes,
      price: pricing.trial.price,
    });
  }
  options.push({
    id: 'single',
    type: 'SINGLE',
    title: 'Học lẻ 1 buổi',
    sessions: 1,
    minutes: pricing.minutesPerSession,
    price: pricing.pricePerSession,
  });
  pricing.packages.forEach((pkg) => {
    options.push({
      id: pkg.id,
      type: 'PACKAGE',
      packageId: pkg.id,
      title: pkg.name,
      sessions: pkg.sessions,
      minutes: pricing.minutesPerSession,
      price: pkg.price,
    });
  });
  return options;
};

export const describePlan = (option: MentoringPlanOption) =>
  `${option.title} · ${option.sessions} buổi × ${option.minutes} phút · ${formatPrice(option.price)}`;

// Giá thấp nhất cho 1 buổi chính thức (không tính học thử) để hiện trên thẻ Mentor
export const getStartingPricePerSession = (mentor: Mentor): number | null => {
  const pricing = mentor.pricing;
  if (!pricing) return null;
  const perSession = [
    pricing.pricePerSession,
    ...pricing.packages.map((pkg) => Math.round(pkg.price / Math.max(1, pkg.sessions))),
  ];
  return Math.min(...perSession);
};

const WEEKDAY_KEYS: ScheduleSlot['day'][] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export interface SessionDay {
  key: string;
  weekday: string;
  dayOfMonth: string;
  month: string;
  times: { start: string; end: string }[];
}

// Chia lịch rảnh hằng tuần thành các ngày cụ thể sắp tới, mỗi ngày gồm các giờ bắt đầu vừa đủ một buổi
export const getUpcomingSessionDays = (
  availability: ScheduleSlot[],
  minutesPerSession: number,
  daysAhead = 14,
  from = new Date()
): SessionDay[] => {
  const days: SessionDay[] = [];
  const length = Math.max(15, minutesPerSession);
  for (let offset = 1; offset <= daysAhead; offset++) {
    const date = new Date(from);
    date.setDate(from.getDate() + offset);
    const dayKey = WEEKDAY_KEYS[date.getDay()];
    const times = availability
      .filter((slot) => slot.day === dayKey)
      .flatMap((slot) => {
        const result: { start: string; end: string }[] = [];
        for (let t = toMinutes(slot.start); t + length <= toMinutes(slot.end); t += length) {
          result.push({ start: toTime(t), end: toTime(t + length) });
        }
        return result;
      });
    if (times.length === 0) continue;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    days.push({
      key: `${date.getFullYear()}-${month}-${dayOfMonth}`,
      weekday: WEEKDAY_SHORT[date.getDay()],
      dayOfMonth,
      month: `Th${date.getMonth() + 1}`,
      times,
    });
  }
  return days;
};

export const formatSessionTime = (day: SessionDay, time: { start: string; end: string }) =>
  `${day.weekday} ${day.dayOfMonth}/${day.key.slice(5, 7)} (${time.start} – ${time.end})`;

export const formatStartingPrice = (mentor: Mentor): string => {
  const price = getStartingPricePerSession(mentor);
  if (price === null) return 'Liên hệ Mentor';
  if (price === 0) return 'Miễn phí';
  return `từ ${formatCurrency(price)}/buổi`;
};
