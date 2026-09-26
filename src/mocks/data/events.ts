import type { ClubEvent } from '@/types/entities';

export interface PublicEventItem extends ClubEvent {
  clubName: string;
  clubLogoUrl?: string;
  registeredByMe?: boolean;
  registeredCount: number;
  coverUrl?: string;
  speaker?: string;
  isOnline?: boolean;
}

export const seedPublicEvents: PublicEventItem[] = [
  {
    id: 'evt_01',
    clubId: 'club_01',
    clubName: 'F-Code Club',
    clubLogoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    title: 'Workshop: Chinh phục Java Spring Boot & Microservices Kiến trúc thực tế',
    description: 'Chia sẻ kiến thức từ Senior Engineer về xây dựng kiến trúc Microservices chịu tải cao, thực hành live coding và giải đáp lộ trình phỏng vấn Backend.',
    startAt: '2026-09-28T14:00:00Z',
    endAt: '2026-09-28T17:00:00Z',
    location: 'Hội trường Innovation Hall (Tầng 2)',
    capacity: 120,
    registeredCount: 85,
    status: 'Published',
    registeredByMe: true,
    speaker: 'Anh Lê Hoàng Minh (Tech Lead @ VNG Corporation)',
    isOnline: false,
  },
  {
    id: 'evt_02',
    clubId: 'club_02',
    clubName: 'JS Club',
    clubLogoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    title: 'Giao lưu trực tuyến: Cơ hội làm việc tại Nhật Bản cùng kỹ sư CNTT FPT',
    description: 'Khám phá văn hóa làm việc tại Tokyo, cách rèn luyện kỹ năng tiếng Nhật chuyên ngành và con đường trở thành Bridge Software Engineer (BrSE).',
    startAt: '2026-09-30T19:30:00Z',
    endAt: '2026-09-30T21:30:00Z',
    location: 'Google Meet (Link gửi qua email)',
    capacity: 200,
    registeredCount: 142,
    status: 'Published',
    registeredByMe: false,
    speaker: 'Chị Nguyễn Thanh Thảo (BrSE @ FPT Japan)',
    isOnline: true,
  },
  {
    id: 'evt_03',
    clubId: 'club_01',
    clubName: 'F-Code Club',
    clubLogoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    title: 'Hackathon Coding Cup 2026 - Vòng sơ loại nội bộ FPTU',
    description: 'Cuộc thi giải thuật và lập trình tiếp sức kéo dài 24 giờ. Cơ hội nhận học bổng và vé mời tham dự Chung kết FPT Edu toàn quốc.',
    startAt: '2026-10-05T08:00:00Z',
    endAt: '2026-10-06T08:00:00Z',
    location: 'Phòng Lab AI & IoT (Tòa Alpha)',
    capacity: 60,
    registeredCount: 58,
    status: 'Published',
    registeredByMe: false,
    speaker: 'Ban Giám khảo CLB F-Code & Mentor Doanh nghiệp',
    isOnline: false,
  },
  {
    id: 'evt_04',
    clubId: 'club_01',
    clubName: 'F-Code Club',
    clubLogoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    title: 'Talkshow: Tips ôn thi & Luyện đề CSD201 Cấu trúc dữ liệu',
    description: 'Tổng kết các dạng bài thuật toán cây, đồ thị, thuật toán tìm đường và hướng dẫn làm bài PE hiệu quả đạt điểm cao.',
    startAt: '2026-09-15T18:00:00Z',
    endAt: '2026-09-15T20:30:00Z',
    location: 'Phòng 204 Tòa Beta',
    capacity: 80,
    registeredCount: 80,
    status: 'Finished',
    registeredByMe: true,
    speaker: 'Nhóm Mentor Chuyên môn F-Code',
    isOnline: false,
  },
];
