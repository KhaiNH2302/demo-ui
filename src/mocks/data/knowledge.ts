import type { KnowledgePost, Comment, ViolationReport } from '@/types/entities';

export const seedKnowledgePosts: KnowledgePost[] = [
  {
    id: 'post_01',
    authorId: 'usr_mentor_02',
    type: 'experience',
    title: 'Kinh nghiệm qua môn CSD201 với điểm 9+ và mẹo học các thuật toán Đồ thị',
    contentMd: `Chào các bạn, môn **CSD201** là một trong những môn nền tảng quan trọng nhất của ngành SE.

### 1. Bí quyết nắm chắc Lý thuyết đồ thị (Graph)
- Hãy vẽ đồ thị ra giấy trước khi code.
- Nắm vững DFS, BFS và cách biểu diễn bằng Ma trận kề / Danh sách kề.
- Thuật toán Dijkstra và Prim, Kruskal thường xuyên xuất hiện trong bài thi Practical Exam.

### 2. Chuẩn bị cho Practical Exam (PE)
- Luyện tập trên BSTree, AVL Tree.
- Viết sẵn template đọc file đầu vào để không mất thời gian lúc thi.

Chúc các bạn ôn tập tốt!`,
    subject: 'CSD201',
    tags: ['CSD201', 'DataStructures', 'Algorithms', 'Tips'],
    attachments: [
      { name: 'CSD201_Graph_Summary.pdf', url: '#', size: 1024 * 1024 * 2.5 },
    ],
    visibility: 'school',
    status: 'Published',
    commentCount: 3,
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-09-18T10:00:00Z',
  },
  {
    id: 'post_02',
    authorId: 'usr_student_01',
    type: 'question',
    title: 'Hỏi về lỗi Spring Security CORS khi kết nối React với Spring Boot?',
    contentMd: `Mình đang làm bài tập lớn PRJ301 kết hợp Spring Boot và React Vite. Khi gửi request POST từ frontend (port 5173) sang backend (port 8080) thì gặp lỗi CORS header 'Access-Control-Allow-Origin' missing.

Đã cấu hình \`@CrossOrigin\` trên Controller nhưng vẫn bị 403. Có bạn nào gặp lỗi này chưa?`,
    subject: 'PRJ301',
    tags: ['PRJ301', 'SpringBoot', 'React', 'CORS'],
    attachments: [],
    visibility: 'cross_school',
    status: 'Published',
    commentCount: 2,
    createdAt: '2026-09-21T15:00:00Z',
    updatedAt: '2026-09-21T15:00:00Z',
  },
  {
    id: 'post_03',
    authorId: 'usr_student_07',
    type: 'document',
    title: 'Tổng hợp 100 câu trắc nghiệm ôn tập SWP391 và Scrum Framework',
    contentMd: `Tài liệu ôn tập các câu hỏi trắc nghiệm về Scrum, Agile, Git flow và quy trình phát triển phần mềm chuẩn bị cho kỳ thi Progress Test SWP391.`,
    subject: 'SWP391',
    tags: ['SWP391', 'Scrum', 'Quiz', 'Document'],
    attachments: [
      { name: 'SWP391_Quiz_Collection.docx', url: '#', size: 1024 * 512 },
    ],
    visibility: 'school',
    status: 'PendingReview',
    commentCount: 0,
    createdAt: '2026-09-23T08:00:00Z',
    updatedAt: '2026-09-23T08:00:00Z',
  },
  {
    id: 'post_04',
    authorId: 'usr_student_07',
    type: 'question',
    title: 'Tài liệu bị từ chối do vi phạm bản quyền đề thi',
    contentMd: `Đề thi trắc nghiệm môn DBI202 bị admin từ chối duyệt.`,
    subject: 'DBI202',
    tags: ['DBI202'],
    attachments: [],
    visibility: 'school',
    status: 'Rejected',
    rejectReason: 'Nội dung chứa đề thi nội bộ có bản quyền của bộ môn, không được phép chia sẻ công khai.',
    commentCount: 0,
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
  },
];

export const seedComments: Comment[] = [
  {
    id: 'cmt_01',
    postId: 'post_01',
    authorId: 'usr_student_01',
    content: 'Cảm ơn bạn nhiều, bài viết rất chi tiết và dễ hiểu!',
    createdAt: '2026-09-18T14:20:00Z',
  },
  {
    id: 'cmt_02',
    postId: 'post_02',
    authorId: 'usr_mentor_02',
    content: 'Bạn cần cấu hình CorsConfigurationSource trong SecurityFilterChain thay vì chỉ dùng @CrossOrigin nhé.',
    createdAt: '2026-09-21T16:10:00Z',
  },
];

export const seedReports: ViolationReport[] = [
  {
    id: 'rep_01',
    postId: 'post_02',
    reporterId: 'usr_student_07',
    reason: 'Spam',
    note: 'Nghi ngờ câu hỏi lặp lại nhiều lần',
    status: 'Open',
    createdAt: '2026-09-22T09:00:00Z',
  },
];
