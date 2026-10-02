import type { KnowledgePost, Comment, ViolationReport } from '@/types/entities';

export const seedKnowledgePosts: KnowledgePost[] = [
  {
    id: 'post_01',
    authorId: 'usr_mentor_02',
    type: 'experience',
    title: 'Kinh nghiệm qua môn CSD201 với điểm 9+ và mẹo học các thuật toán Đồ thị',
    contentMd: `Chào các bạn, môn **CSD201** là một trong những môn nền tảng quan trọng nhất của ngành SE.

1. **Bí quyết nắm chắc Lý thuyết đồ thị (Graph):**
- Hãy vẽ đồ thị ra giấy trước khi code.
- Nắm vững DFS, BFS và cách biểu diễn bằng Ma trận kề / Danh sách kề.
- Thuật toán Dijkstra và Prim, Kruskal thường xuyên xuất hiện trong bài thi Practical Exam.

2. **Chuẩn bị cho Practical Exam (PE):**
- Luyện tập trên BSTree, AVL Tree.
- Viết sẵn template đọc file đầu vào để không mất thời gian lúc thi.

Chúc các bạn ôn tập tốt và đạt điểm cao!`,
    subject: 'CSD201',
    subjectCode: 'CSD201',
    tags: ['CSD201', 'DataStructures', 'Algorithms', 'Tips'],
    attachments: [
      { name: 'CSD201_Graph_Summary.pdf', url: '#', size: 1024 * 1024 * 2.5 },
    ],
    visibility: 'school',
    status: 'Published',
    likesCount: 38,
    likedByMe: true,
    savedByMe: true,
    commentCount: 4,
    createdAt: '2026-09-24T14:30:00Z',
    updatedAt: '2026-09-24T14:30:00Z',
  },
  {
    id: 'post_02',
    authorId: 'usr_student_01',
    type: 'question',
    title: 'Hỏi về lỗi Spring Security CORS khi kết nối React Vite với Spring Boot 3?',
    contentMd: `Mình đang làm bài tập lớn PRJ301 kết hợp Spring Boot 3 và React Vite. Khi gửi request POST từ frontend (port 5173) sang backend (port 8080) thì gặp lỗi CORS header 'Access-Control-Allow-Origin' missing.

Đã cấu hình \`@CrossOrigin\` trên Controller nhưng khi request có kèm Bearer token Authorization header vẫn bị 403 Forbidden. Có bạn nào gặp lỗi này chưa và cách fix chuẩn trong SecurityFilterChain là gì ạ?`,
    subject: 'PRJ301',
    subjectCode: 'PRJ301',
    tags: ['PRJ301', 'SpringBoot', 'React', 'CORS', 'SpringSecurity'],
    attachments: [],
    visibility: 'cross_school',
    status: 'Published',
    likesCount: 14,
    likedByMe: false,
    savedByMe: false,
    isSolved: true,
    acceptedCommentId: 'cmt_02',
    commentCount: 3,
    createdAt: '2026-09-24T18:00:00Z',
    updatedAt: '2026-09-24T18:00:00Z',
  },
  {
    id: 'post_03',
    authorId: 'usr_student_02',
    type: 'question',
    title: 'Có ai có mẹo nhớ nhanh các trường hợp xoay cây AVL trong CSD201 không?',
    contentMd: `Mình hay bị nhầm lẫn giữa xoay đơn (Left Rotation / Right Rotation) và xoay kép (Left-Right / Right-Left Rotation) khi cân bằng lại cây AVL sau khi chèn node mới.

Bạn nào có hình minh họa trực quan hoặc câu thần chú dễ nhớ chia sẻ cho mình với ạ! Tuần sau thi Practical rồi.`,
    subject: 'CSD201',
    subjectCode: 'CSD201',
    tags: ['CSD201', 'AVLTree', 'TreeRotation'],
    attachments: [],
    images: [
      'https://images.unsplash.com/photo-1516116211227-bbc13c7a5223?auto=format&fit=crop&w=600&q=80',
    ],
    visibility: 'school',
    status: 'Published',
    likesCount: 22,
    likedByMe: true,
    savedByMe: false,
    isSolved: false,
    commentCount: 2,
    createdAt: '2026-09-25T08:15:00Z',
    updatedAt: '2026-09-25T08:15:00Z',
  },
  {
    id: 'post_04',
    authorId: 'usr_student_03',
    type: 'document',
    title: 'Full Cheatsheet SQL queries & indexing cho môn DBI202 ôn thi PE & FE',
    contentMd: `Mình tổng hợp lại toàn bộ các mẫu câu lệnh SQL nâng cao trong môn DBI202:
- Subqueries, Correlated Subqueries, CTE (WITH clause)
- Window functions: ROW_NUMBER(), RANK(), DENSE_RANK()
- Indexing strategy: Clustered vs Non-clustered Index, tối ưu tốc độ truy vấn
- Stored Procedures và Triggers hay gặp trong đề thi PE Đại học FPT

Tài liệu đính kèm file PDF chất lượng cao, các bạn tải về ôn tập nhé.`,
    subject: 'DBI202',
    subjectCode: 'DBI202',
    tags: ['DBI202', 'SQL', 'Cheatsheet', 'Database'],
    attachments: [
      { name: 'DBI202_Advanced_SQL_Cheatsheet.pdf', url: '#', size: 1024 * 1024 * 3.8 },
      { name: 'Sample_DB_Scripts.sql', url: '#', size: 1024 * 64 },
    ],
    visibility: 'school',
    status: 'Published',
    likesCount: 56,
    likedByMe: false,
    savedByMe: true,
    commentCount: 5,
    createdAt: '2026-09-23T11:20:00Z',
    updatedAt: '2026-09-23T11:20:00Z',
  },
  {
    id: 'post_05',
    authorId: 'usr_mentor_01',
    type: 'discussion',
    title: 'Phân biệt State Management trong React: Khi nào nên dùng Zustand thay vì Redux Toolkit?',
    contentMd: `Trong các đồ án SWP391 và Capstone, việc chọn thư viện quản lý trạng thái rất quan trọng:
1. **Zustand:** Cực nhẹ (~1kB), boilerplate gần như bằng 0, không cần bọc Provider ngoài root, rất thích hợp cho đồ án vừa và nhỏ.
2. **Redux Toolkit:** Mạnh mẽ, chuẩn enterprise, devtools tuyệt vời, nhưng cấu hình ban đầu nhiều hơn.
3. **React Query (TanStack Query):** Dành riêng cho Server State (fetch, cache, sync dữ liệu backend), đừng dùng Zustand/Redux để lưu trữ dữ liệu lấy từ API nếu đã có React Query!

Ý kiến của các bạn thế nào?`,
    subject: 'SWP391',
    subjectCode: 'SWP391',
    tags: ['SWP391', 'React', 'Zustand', 'Frontend'],
    attachments: [],
    visibility: 'school',
    status: 'Published',
    likesCount: 42,
    likedByMe: true,
    savedByMe: false,
    commentCount: 7,
    createdAt: '2026-09-25T07:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
  },
  {
    id: 'post_06',
    authorId: 'usr_student_04',
    type: 'question',
    title: 'Cách tính xác suất có điều kiện và định lý Bayes trong đề thi MAS291?',
    contentMd: `Mình đang ôn tập phần Probability môn MAS291. Có bài toán: 'Một xét nghiệm y tế có độ nhạy 95% và độ đặc hiệu 90%. Tỷ lệ mắc bệnh trong cộng đồng là 1%. Tính xác suất một người dương tính thực sự mắc bệnh?'

Mình dùng công thức Bayes nhưng hay bị nhầm giữa P(A|B) và P(B|A). Ai chỉ mình cách vẽ cây xác suất (tree diagram) để giải quyết bài này nhanh nhất với ạ?`,
    subject: 'MAS291',
    subjectCode: 'MAS291',
    tags: ['MAS291', 'Probability', 'BayesTheorem', 'Math'],
    attachments: [],
    visibility: 'school',
    status: 'Published',
    likesCount: 8,
    likedByMe: false,
    savedByMe: false,
    isSolved: false,
    commentCount: 0,
    createdAt: '2026-09-25T09:30:00Z',
    updatedAt: '2026-09-25T09:30:00Z',
  },
  {
    id: 'post_07',
    authorId: 'usr_student_05',
    type: 'question',
    title: 'Xin cấu hình CI/CD GitHub Actions deploy Spring Boot + PostgreSQL lên Render/Railway?',
    contentMd: `Nhóm mình đang làm SWP391 cần setup pipeline tự động chạy unit test và build docker image deploy lên cloud mỗi khi merge code vào nhánh main. Bạn nào có file workflow .github/workflows/deploy.yml mẫu cho mình xin tham khảo với ạ!`,
    subject: 'SWP391',
    subjectCode: 'SWP391',
    tags: ['SWP391', 'DevOps', 'GitHubActions', 'CI_CD'],
    attachments: [],
    visibility: 'school',
    status: 'Published',
    likesCount: 16,
    likedByMe: false,
    savedByMe: false,
    isSolved: false,
    commentCount: 1,
    createdAt: '2026-09-24T20:10:00Z',
    updatedAt: '2026-09-24T20:10:00Z',
  },
  {
    id: 'post_08',
    authorId: 'usr_student_06',
    type: 'document',
    title: 'Template báo cáo SRS (Software Requirements Specification) chuẩn IEEE 830 cho SWP391',
    contentMd: `Chia sẻ template tài liệu đặc tả yêu cầu phần mềm SRS kèm các sơ đồ Use Case, Activity Diagram và Mockup UI chuẩn theo form chấm điểm của giảng viên FPTU.`,
    subject: 'SWP391',
    subjectCode: 'SWP391',
    tags: ['SWP391', 'SRS', 'Documentation', 'Scrum'],
    attachments: [
      { name: 'SWP391_SRS_Template_Standard.docx', url: '#', size: 1024 * 1024 * 1.2 },
    ],
    visibility: 'school',
    status: 'Published',
    likesCount: 31,
    likedByMe: false,
    savedByMe: true,
    commentCount: 2,
    createdAt: '2026-09-22T16:00:00Z',
    updatedAt: '2026-09-22T16:00:00Z',
  },
  {
    id: 'post_09',
    authorId: 'usr_student_01',
    type: 'discussion',
    title: 'Chia sẻ roadmap tự học .NET Core và Entity Framework chuẩn bị cho kỳ PRN231',
    contentMd: `Dành cho các bạn sắp học kỳ chuyên ngành .NET:
1. Nắm chắc C# OOP, LINQ, Async/Await
2. Hiểu kiến trúc Clean Architecture / Repository Pattern
3. Thực hành EF Core Code-First Migration
4. JWT Authentication & Role-based Authorization
5. Unit Testing với xUnit và Moq`,
    subject: 'PRN231',
    subjectCode: 'PRN231',
    tags: ['PRN231', 'CSharp', 'DotNet', 'Roadmap'],
    attachments: [],
    visibility: 'school',
    status: 'Published',
    likesCount: 29,
    likedByMe: true,
    savedByMe: false,
    commentCount: 3,
    createdAt: '2026-09-25T06:30:00Z',
    updatedAt: '2026-09-25T06:30:00Z',
  },
  {
    id: 'post_10',
    authorId: 'usr_student_07',
    type: 'document',
    title: 'Tổng hợp 100 câu trắc nghiệm ôn tập SWP391 và Scrum Framework',
    contentMd: `Tài liệu ôn tập các câu hỏi trắc nghiệm về Scrum, Agile, Git flow và quy trình phát triển phần mềm chuẩn bị cho kỳ thi Progress Test SWP391.`,
    subject: 'SWP391',
    subjectCode: 'SWP391',
    tags: ['SWP391', 'Scrum', 'Quiz', 'Document'],
    attachments: [
      { name: 'SWP391_Quiz_Collection.docx', url: '#', size: 1024 * 512 },
    ],
    visibility: 'school',
    status: 'PendingReview',
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
    commentCount: 0,
    createdAt: '2026-09-25T10:00:00Z',
    updatedAt: '2026-09-25T10:00:00Z',
  },
  {
    id: 'post_11',
    authorId: 'usr_student_07',
    type: 'question',
    title: 'Tài liệu bị từ chối do vi phạm bản quyền đề thi nội bộ',
    contentMd: `Đề thi trắc nghiệm môn DBI202 bị admin từ chối duyệt do có chứa đề thi nội bộ của bộ môn.`,
    subject: 'DBI202',
    subjectCode: 'DBI202',
    tags: ['DBI202'],
    attachments: [],
    visibility: 'school',
    status: 'Rejected',
    rejectReason: 'Nội dung chứa đề thi nội bộ có bản quyền của bộ môn, không được phép chia sẻ công khai.',
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
    commentCount: 0,
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'post_12',
    authorId: 'usr_student_01',
    type: 'document',
    title: 'Tổng hợp tài liệu ôn tập và đề thi thử Practical môn PRJ301 (Java Web Servlet/JSP)',
    contentMd: `Tài liệu gồm 5 đề thi thử Practical Exam (PE) môn PRJ301 kèm lời giải chi tiết, hướng dẫn cấu hình Apache Tomcat, kết nối Microsoft SQL Server bằng JDBC và xử lý session shopping cart.

Đang đợi kiểm duyệt từ ban quản trị nội dung môn học.`,
    subject: 'PRJ301',
    subjectCode: 'PRJ301',
    tags: ['PRJ301', 'JavaWeb', 'Servlet', 'PE_Practice', 'Cheatsheet'],
    attachments: [
      { name: 'PRJ301_PE_Practice_Set.zip', url: '#', size: 1024 * 1024 * 4.2 },
    ],
    visibility: 'school',
    status: 'PendingReview',
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
    commentCount: 0,
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: '2026-09-29T10:00:00Z',
  },
  {
    id: 'post_13',
    authorId: 'usr_student_01',
    type: 'discussion',
    title: 'Chia sẻ bộ tài liệu tổng hợp đồ án tốt nghiệp khóa trước tham khảo',
    contentMd: `Bộ mã nguồn và báo cáo đồ án tốt nghiệp ngành Kỹ thuật phần mềm khóa K16 để các bạn chuẩn bị làm Capstone SEP490 tham khảo cách viết kiến trúc.`,
    subject: 'SEP490',
    subjectCode: 'SEP490',
    tags: ['SEP490', 'Capstone', 'SourceCode'],
    attachments: [],
    visibility: 'school',
    status: 'Rejected',
    rejectReason: 'Bài viết vi phạm quy chế chia sẻ mã nguồn đồ án tốt nghiệp chưa được sự đồng ý của hội đồng bảo vệ và tác giả.',
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
    commentCount: 0,
    createdAt: '2026-09-20T14:00:00Z',
    updatedAt: '2026-09-21T09:00:00Z',
  },
];

export const seedComments: Comment[] = [
  {
    id: 'cmt_01',
    postId: 'post_01',
    authorId: 'usr_student_01',
    content: 'Cảm ơn anh nhiều, phần giải thích đồ thị Dijkstra rất dễ hiểu!',
    likesCount: 5,
    likedByMe: false,
    createdAt: '2026-09-24T15:20:00Z',
  },
  {
    id: 'cmt_01_nested',
    postId: 'post_01',
    authorId: 'usr_mentor_02',
    parentId: 'cmt_01',
    content: '@Lê Hoàng Long Nếu cần template code Java chạy thử thì nhắn anh qua kênh Mentoring nhé.',
    likesCount: 2,
    likedByMe: true,
    createdAt: '2026-09-24T16:00:00Z',
  },
  {
    id: 'cmt_02',
    postId: 'post_02',
    authorId: 'usr_mentor_02',
    content: `Để giải quyết triệt để lỗi CORS khi gửi kèm Authorization Header trong Spring Boot 3, bạn cần cấu hình bean CorsConfigurationSource trong file SecurityConfig thay vì chỉ dùng @CrossOrigin:

\`\`\`java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:5173"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
\`\`\`

Nhớ khai báo \`http.cors(Customizer.withDefaults())\` trong SecurityFilterChain nhé!`,
    isAcceptedAnswer: true,
    likesCount: 18,
    likedByMe: true,
    createdAt: '2026-09-24T18:45:00Z',
  },
  {
    id: 'cmt_02_reply',
    postId: 'post_02',
    authorId: 'usr_student_01',
    parentId: 'cmt_02',
    content: '@Hoàng Văn Nam Cảm ơn Mentor nhiều ạ! Mình thêm CorsConfigurationSource là chạy được ngay lập tức.',
    likesCount: 3,
    likedByMe: false,
    createdAt: '2026-09-24T19:10:00Z',
  },
  {
    id: 'cmt_03',
    postId: 'post_03',
    authorId: 'usr_mentor_01',
    content: `Mẹo nhớ xoay AVL:
- **Lỗi Left-Left (mất cân bằng lệch trái - trái):** Chỉ cần Xoay Đơn Phải (Right Rotation).
- **Lỗi Right-Right (mất cân bằng lệch phải - phải):** Chỉ cần Xoay Đơn Trái (Left Rotation).
- **Lỗi Left-Right:** Xoay Trái node con trái trước, sau đó Xoay Phải node gốc (Double Left-Right Rotation).
- **Lỗi Right-Left:** Xoay Phải node con phải trước, sau đó Xoay Trái node gốc (Double Right-Left Rotation).`,
    likesCount: 9,
    likedByMe: true,
    createdAt: '2026-09-25T08:40:00Z',
  },
];

export const seedReports: ViolationReport[] = [
  {
    id: 'rep_01',
    postId: 'post_02',
    targetType: 'post',
    targetId: 'post_02',
    targetTitle: 'Lỗi CORS khi gửi kèm Authorization Header trong Spring Boot 3 + React Vite',
    targetAuthorName: 'Vũ Minh Khôi',
    reporterId: 'usr_student_07',
    reporterName: 'Hoàng Trọng Nghĩa',
    reason: 'Gian lận học thuật (mua bán đề thi, học hộ)',
    description: 'Bài viết có đính kèm đoạn bình luận rao nhận làm thuê bài tập lớn PRJ301.',
    contentSnapshot: 'Nhận code hộ project PRJ301/SWP391 cam kết pass 100%, inbox Zalo...',
    reportCount: 5,
    autoHidden: true,
    status: 'Open',
    createdAt: '2026-09-28T09:00:00Z',
  },
  {
    id: 'rep_02',
    targetType: 'opportunity',
    targetId: 'opp_03',
    targetTitle: 'Tuyển Cộng tác viên Tổ chức Ngày hội Văn hóa & Công nghệ Việt - Nhật (Matsuri Tech 2026)',
    targetAuthorName: 'JS Club',
    reporterId: 'usr_newbie_08',
    reporterName: 'Vũ Minh Khôi',
    reason: 'Thông tin sai sự thật / lừa đảo',
    description: 'Cần kiểm tra lại hạn đăng ký thực tế của đợt tuyển CTV.',
    contentSnapshot: 'Tuyển Cộng tác viên Tổ chức Ngày hội Văn hóa & Công nghệ Việt - Nhật...',
    reportCount: 1,
    autoHidden: false,
    status: 'Open',
    createdAt: '2026-09-28T14:20:00Z',
  },
  {
    id: 'rep_03',
    targetType: 'program',
    targetId: 'prog_03',
    targetTitle: 'Tủ Sách Cho Em: Quyên góp & Phân loại sách giáo khoa cho học sinh Ba Vì',
    targetAuthorName: 'Đặng Thu Hà',
    reporterId: 'usr_student_07',
    reporterName: 'Hoàng Trọng Nghĩa',
    reason: 'Thu phí trái phép hoặc không minh bạch',
    description: 'Xin xác minh khoản tiền ăn trưa tự túc 45.000đ/người khi đi điểm trường.',
    contentSnapshot: 'Tự túc bữa trưa 45.000đ/người (thanh toán trực tiếp tại quán ăn địa phương, không thu quỹ trước)',
    reportCount: 2,
    autoHidden: false,
    status: 'Open',
    createdAt: '2026-09-29T08:10:00Z',
  },
];

