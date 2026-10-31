// Lựa chọn dùng chung cho form đăng bài (Bảng tin) và form sửa bài (Yêu cầu của tôi)
export const SUBJECTS = [
  { code: 'CSD201', name: 'Data Structures & Algorithms' },
  { code: 'PRJ301', name: 'Java Web Application' },
  { code: 'SWP391', name: 'Software Project' },
  { code: 'SWE201c', name: 'Software Engineering' },
  { code: 'PRF192', name: 'Programming with C' },
  { code: 'MAD101', name: 'Discrete Mathematics' },
  { code: 'MAS291', name: 'Statistics & Probability' },
  { code: 'AIP391', name: 'AI Project' },
  { code: 'UXD301', name: 'UX Design' },
  { code: 'SEP490', name: 'Capstone Project' },
];

export type Mode = 'online' | 'offline' | 'chat';
export const MODES: Mode[] = ['online', 'offline', 'chat'];

export const MODE_LABELS: Record<Mode, string> = {
  online: 'Online',
  offline: 'Gặp tại trường',
  chat: 'Hỏi đáp qua chat',
};

export const TIME_PRESETS = [
  'Tối Thứ 2 & Thứ 4 (19:30 – 21:00)',
  'Tối Thứ 3 & Thứ 5 (19:30 – 21:00)',
  'Chiều Thứ 7 & Chủ nhật (14:00 – 16:30)',
  'Linh hoạt, thỏa thuận theo tuần',
];

// Các cơ sở của Trường Đại học FPT, dùng khi học gặp tại trường
export const CAMPUSES = [
  { value: 'hanoi', label: 'Hà Nội (Hòa Lạc)' },
  { value: 'hcm', label: 'TP. Hồ Chí Minh' },
  { value: 'danang', label: 'Đà Nẵng' },
  { value: 'cantho', label: 'Cần Thơ' },
  { value: 'quynhon', label: 'Quy Nhơn' },
] as const;

export const campusLabel = (value?: string) => CAMPUSES.find((campus) => campus.value === value)?.label;
