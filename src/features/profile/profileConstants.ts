import type { Audience, ProfileFieldKey } from '@/types/entities';

export interface DropdownOption {
  value: string;
  label: string;
}

export const AUDIENCE_CONFIG: Record<
  Audience,
  { label: string; iconName: string; symbol: string; description: string }
> = {
  public: {
    label: 'Công khai',
    iconName: 'Globe',
    symbol: '🌐',
    description: 'Mọi thành viên SCS đều có thể thấy',
  },
  followers: {
    label: 'Người theo dõi',
    iconName: 'Users',
    symbol: '👥',
    description: 'Chỉ những sinh viên đang theo dõi bạn',
  },
  only_me: {
    label: 'Chỉ mình tôi',
    iconName: 'Lock',
    symbol: '🔒',
    description: 'Chỉ hiển thị cho chính bạn',
  },
};

export const DEFAULT_FIELD_AUDIENCE: Record<ProfileFieldKey, Audience> = {
  intro: 'public',
  about: 'public',
  gender: 'public',
  birthday: 'followers',
  otherNames: 'public',
  favoriteQuote: 'public',
  languages: 'public',
  hobbies: 'public',
  currentCity: 'public',
  hometown: 'followers',
  education: 'public',
  work: 'public',
  contact: 'only_me',
  links: 'public',
  lifeEvents: 'public',
  skills: 'public',
  interests: 'public',
  goals: 'public',
  availability: 'only_me',
};

export const UNIVERSITIES: string[] = [
  'Đại học FPT Hà Nội',
  'Đại học FPT TP.HCM',
  'Đại học FPT Đà Nẵng',
  'Đại học FPT Cần Thơ',
  'Đại học FPT Quy Nhơn',
  'Đại học Bách Khoa Hà Nội',
  'Đại học Quốc Gia Hà Nội',
  'Đại học Kinh tế Quốc dân (NEU)',
  'Đại học Ngoại thương (FTU)',
  'Đại học Bách Khoa TP.HCM',
  'Đại học Công nghệ Thông tin - ĐHQG TP.HCM (UIT)',
  'Học viện Công nghệ Bưu chính Viễn thông (PTIT)',
  'Đại học Sư phạm Kỹ thuật TP.HCM',
];

export const CAMPUSES: string[] = [
  'Hòa Lạc (Hà Nội)',
  'Khu Công nghệ cao (TP.HCM)',
  'Sơn Trà (Đà Nẵng)',
  'An Bình (Cần Thơ)',
  'An Phú Thịnh (Quy Nhơn)',
];

export const MAJORS: string[] = [
  'Kỹ thuật phần mềm (SE)',
  'An toàn thông tin (IA)',
  'Trí tuệ nhân tạo (AI)',
  'Hệ thống thông tin (IS)',
  'Thiết kế đồ họa (GD)',
  'Quản trị kinh doanh (BA)',
  'Kinh doanh quốc tế (IB)',
  'Digital Marketing (DM)',
  'Truyền thông đa phương tiện (MC)',
  'Ngôn ngữ Anh',
  'Ngôn ngữ Nhật',
  'Ngôn ngữ Hàn',
];

export const COHORTS: string[] = ['K17', 'K18', 'K19', 'K20', 'K21'];

export const PROVINCES: string[] = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nam Định',
  'Nghệ An',
  'Bắc Ninh',
  'Thanh Hóa',
  'Bình Dương',
  'Đồng Nai',
  'Quảng Ninh',
  'Thái Nguyên',
  'Bình Định',
  'Khánh Hòa',
  'Lâm Đồng',
  'Thừa Thiên Huế',
  'Hà Tĩnh',
  'Vĩnh Phúc',
  'Hải Dương',
  'Hưng Yên',
  'Thái Bình',
  'Phú Thọ',
  'Bắc Giang',
  'Quảng Nam',
  'Kiên Giang',
  'An Giang',
  'Đắk Lắk',
  'Gia Lai',
  'Vũng Tàu',
];

export const SKILL_SUGGESTIONS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Java',
  'Spring Boot',
  'Node.js',
  'Python',
  'SQL',
  'Algorithms',
  'Data Structures',
  'Git',
  'UI/UX Design',
  'Docker',
  'Flutter',
  'Machine Learning',
  'C/C++',
  'Next.js',
  'TailwindCSS',
];

export const INTEREST_SUGGESTIONS = [
  'Lập trình Web',
  'Phát triển ứng dụng di động',
  'Trí tuệ nhân tạo & Data',
  'An toàn không gian mạng',
  'Điện toán đám mây (Cloud)',
  'Thiết kế sản phẩm (Product)',
  'Học thuật & Nghiên cứu',
  'Hoạt động tình nguyện',
  'Thể thao & Thể hình',
  'Âm nhạc & Nghệ thuật',
];

export const HOBBY_SUGGESTIONS = [
  'Đọc sách',
  'Đá bóng',
  'Bóng rổ',
  'Chơi game',
  'Nhiếp ảnh',
  'Du lịch phượt',
  'Nghe nhạc Indie',
  'Code dạo cuối tuần',
  'Chạy bộ (Marathon)',
  'Cờ vua',
  'Xem phim tài liệu',
  'Nấu ăn',
];

export const GOAL_SUGGESTIONS = [
  'Tìm đối tác đổi lớp học phần',
  'Tìm nhóm làm đồ án tốt nghiệp / Capstone',
  'Tìm nhóm học tập môn CSD201 & PRJ301',
  'Tìm Mentor định hướng nghề nghiệp',
  'Tham gia CLB học thuật & phong trào',
  'Luyện thi chứng chỉ FE / IELTS 7.5+',
  'Tìm đồng đội thi Hackathon',
  'Chuẩn bị hồ sơ thực tập On-the-Job-Training (OJT)',
];

export const LINK_TYPES = [
  { value: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { value: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
  { value: 'portfolio', label: 'Portfolio', placeholder: 'https://yourportfolio.dev' },
  { value: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
  { value: 'other', label: 'Khác', placeholder: 'https://...' },
] as const;

export const LIFE_EVENT_KINDS = [
  { value: 'scholarship', label: 'Học bổng', icon: 'Award' },
  { value: 'internship', label: 'Thực tập', icon: 'Briefcase' },
  { value: 'award', label: 'Giải thưởng / Cuộc thi', icon: 'Trophy' },
  { value: 'graduation', label: 'Tốt nghiệp', icon: 'GraduationCap' },
  { value: 'other', label: 'Khác', icon: 'Bookmark' },
] as const;
