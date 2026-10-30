import type { MentoringClass, MentorReview } from '@/types/entities';

// Thẻ chọn nhanh khi đánh giá Mentor
export const REVIEW_TAGS = [
  'Giải thích dễ hiểu',
  'Đúng giờ',
  'Nhiệt tình',
  'Có chuẩn bị bài',
  'Giá hợp lý',
  'Lịch linh hoạt',
] as const;

export const RATING_HINTS: Record<number, string> = {
  1: 'Chưa hài lòng',
  2: 'Cần cải thiện',
  3: 'Tạm ổn',
  4: 'Tốt',
  5: 'Rất tốt',
};

export const countDone = (cls?: MentoringClass) => cls?.sessions.filter((session) => session.status === 'DONE').length ?? 0;

// Lớp học của người xem (với tư cách học viên) với một Mentor
export const findClass = (classes: MentoringClass[], viewerId: string | undefined, mentorId: string) =>
  classes.find((cls) => Boolean(viewerId) && cls.studentId === viewerId && cls.mentorId === mentorId);

/**
 * none: chưa kết nối · waiting: đã kết nối nhưng chưa có buổi nào được xác nhận
 * can: được đánh giá · done: đã đánh giá lần kết nối này
 */
export type ReviewState = 'none' | 'waiting' | 'can' | 'done';

export const getReviewState = (cls: MentoringClass | undefined, reviews: MentorReview[]): ReviewState => {
  if (!cls) return 'none';
  if (reviews.some((review) => review.requestId === cls.request.id)) return 'done';
  return countDone(cls) > 0 ? 'can' : 'waiting';
};
