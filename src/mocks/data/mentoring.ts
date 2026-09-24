import type { Mentor, MentoringPost, MentoringRequest } from '@/types/entities';

export const seedMentors: Mentor[] = [
  {
    userId: 'usr_mentor_02',
    fields: ['Công nghệ thông tin', 'Thuật toán', 'Phát triển Web'],
    subjects: ['CSD201', 'PRJ301', 'SWP391', 'Java'],
    experience: 'Đã hoàn thành 5 dự án thực tế, Top 5 ACM-ICPC vòng Quốc gia, GPA 3.8/4.0.',
    availability: [
      { day: 'Tue', start: '19:00', end: '22:00' },
      { day: 'Thu', start: '19:00', end: '22:00' },
      { day: 'Sun', start: '14:00', end: '18:00' },
    ],
    supportModes: ['online', 'offline', 'chat'],
    acceptingRequests: true,
  },
];

export const seedMentoringPosts: MentoringPost[] = [
  {
    id: 'mpost_01',
    mentorId: 'usr_mentor_02',
    title: 'Hỗ trợ 1-1 ôn thi Practical Exam môn CSD201 & Luyện Tree/Graph',
    content: 'Dành cho các bạn sinh viên đang học CSD201 cần củng cố kiến thức cây nhị phân tìm kiếm, AVL Tree, Dijkstra và bài toán đồ thị.',
    field: 'Thuật toán & Cấu trúc dữ liệu',
    mode: 'online',
    slots: 3,
    open: true,
  },
  {
    id: 'mpost_02',
    mentorId: 'usr_mentor_02',
    title: 'Review kiến trúc Backend Spring Boot & Hướng dẫn làm đồ án PRJ301',
    content: 'Tư vấn thiết kế database, RESTful API và Spring Security cho các nhóm sinh viên.',
    field: 'Phát triển Web Java',
    mode: 'chat',
    slots: 5,
    open: true,
  },
];

export const seedMentoringRequests: MentoringRequest[] = [
  {
    id: 'mreq_01',
    studentId: 'usr_student_01',
    mentorId: 'usr_mentor_02',
    topic: 'Tư vấn thiết kế Authentication JWT trong dự án SWP391',
    content: 'Chào chị Bình, nhóm em đang gặp vướng mắc khi kết hợp Refresh Token và HttpOnly Cookie. Nhờ chị dành 1 tiếng tư vấn online giúp em ạ.',
    preferredTime: 'Tối thứ Năm lúc 20:00',
    status: 'ACCEPTED',
    createdAt: '2026-09-21T09:00:00Z',
  },
  {
    id: 'mreq_02',
    studentId: 'usr_student_07',
    mentorId: 'usr_mentor_02',
    topic: 'Hướng dẫn giải bài tập Tree trong CSD201',
    content: 'Em chưa hiểu phần xoay cây AVL trong bài thực hành số 3.',
    preferredTime: 'Chiều Chủ Nhật',
    status: 'PENDING_MENTOR_RESPONSE',
    createdAt: '2026-09-24T14:00:00Z',
  },
];
