import type { Mentor, MentorCourse, MentorPost, MentorProfileSection, MentoringRequest } from '@/types/entities';

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
    menteesCount: 24,
  },
];

export const seedMentorCourses: MentorCourse[] = [
  {
    id: 'mcourse_01',
    mentorId: 'usr_mentor_02',
    title: 'Luyện đề Practical CSD201 & Thuật toán Cây/Đồ thị',
    description: 'Khóa học 4 tuần ôn tập trọng tâm cây AVL, Dijkstra, Floyd và chiến lược làm bài thi thực hành đạt điểm tối đa.',
    subjectOrField: 'CSD201 · Cấu trúc dữ liệu & Giải thuật',
    mode: 'online',
    schedule: 'Thứ 3 & Thứ 5, 19:30–21:30',
    slots: 10,
    enrolled: 7,
    open: true,
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'mcourse_02',
    mentorId: 'usr_mentor_02',
    title: 'Xây dựng Backend REST API chuẩn công nghiệp với Spring Boot',
    description: 'Học cách thiết kế database, JWT authentication, Spring Security, clean architecture cho dự án SWP391/PRJ301.',
    subjectOrField: 'PRJ301 / SWP391 · Java Spring Boot',
    mode: 'offline',
    schedule: 'Chủ Nhật, 14:00–17:00 tại Thư viện Gamma',
    slots: 12,
    enrolled: 12,
    open: false,
    createdAt: '2026-09-15T08:00:00Z',
  },
];

export const seedMentorProfileSections: MentorProfileSection[] = [
  {
    id: 'sec_builtin_fields',
    kind: 'builtin',
    type: 'list',
    title: 'Lĩnh vực & Môn học phụ trách',
    content: [
      'CSD201 - Data Structures & Algorithms',
      'PRJ301 - Java Web Development',
      'SWP391 - Software Project',
      'Phát triển hệ thống phân tán',
    ],
    visible: true,
    order: 1,
  },
  {
    id: 'sec_builtin_exp',
    kind: 'builtin',
    type: 'text',
    title: 'Kinh nghiệm học thuật & Dự án',
    content:
      'Top 5 ACM-ICPC vòng Quốc gia, GPA 3.8/4.0. Đã hướng dẫn thành công hơn 20 sinh viên qua môn CSD201 và đạt điểm xuất sắc đồ án SWP391.',
    visible: true,
    order: 2,
  },
  {
    id: 'sec_custom_portfolio',
    kind: 'custom',
    type: 'links',
    title: 'Dự án & Tài liệu tiêu biểu',
    content: [
      { label: 'GitHub: Fullstack Capstone Template', url: 'https://github.com' },
      { label: 'Tài liệu tóm tắt CSD201 CheatSheet', url: 'https://notion.so' },
    ],
    visible: true,
    order: 3,
  },
];

export const seedMentoringPosts: MentorPost[] = [
  {
    id: 'mpost_01',
    mentorId: 'usr_mentor_02',
    authorId: 'usr_mentor_02',
    title: 'Kinh nghiệm vượt qua Practical Exam môn CSD201 với điểm 9+',
    contentMd:
      'Chào các bạn sinh viên, kỳ này rất nhiều bạn hỏi mình về cách phân bổ thời gian khi làm đề Practical CSD201.\n\nSau đây là 3 mẹo sống còn:\n1. Nắm chắc phần duyệt cây (Breadth-first, Preorder, Inorder, Postorder) và kỹ thuật xoay AVL.\n2. Thuộc lòng template thuật toán Dijkstra và BFS trên đồ thị vô hướng.\n3. Test kỹ các trường hợp rỗng (empty tree/graph) và biên.',
    field: 'Thuật toán & Cấu trúc dữ liệu',
    likeCount: 42,
    commentCount: 15,
    liked: true,
    saved: false,
    createdAt: '2026-09-24T14:30:00Z',
    tags: ['CSD201', 'Algorithms', 'FPTU'],
  },
  {
    id: 'mpost_02',
    mentorId: 'usr_mentor_02',
    authorId: 'usr_mentor_02',
    title: 'Checklist chuẩn bị đồ án SWP391: Tránh bị trượt vòng Review kiến trúc',
    contentMd:
      'Các lỗi phổ biến nhất của các nhóm SWP391 tuần 4-5:\n- Thiết kế ERD thiếu chuẩn hóa 3NF, trùng lặp foreign key.\n- Lưu mật khẩu dạng raw text thay vì BCrypt.\n- Hardcode secret key và API endpoint trong frontend code.\n\nHãy dành thời gian refactor code trước khi demo với thầy cô nhé!',
    field: 'Phát triển Phần mềm',
    likeCount: 68,
    commentCount: 22,
    liked: false,
    saved: true,
    createdAt: '2026-09-22T09:15:00Z',
    tags: ['SWP391', 'Architecture', 'CleanCode'],
  },
];

export const seedMentoringRequests: MentoringRequest[] = [
  {
    id: 'mreq_01',
    studentId: 'usr_student_01',
    mentorId: 'usr_mentor_02',
    topic: 'Tư vấn thiết kế Authentication JWT trong dự án SWP391',
    content:
      'Chào chị Bình, nhóm em đang gặp vướng mắc khi kết hợp Refresh Token và HttpOnly Cookie. Nhờ chị dành 1 tiếng tư vấn online giúp em ạ.',
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
    createdAt: '2026-09-23T11:00:00Z',
  },
];
