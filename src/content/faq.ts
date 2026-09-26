export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'account' | 'swap' | 'knowledge' | 'groups' | 'clubs' | 'mentoring';
}

export const faqCategories = [
  { key: 'account', label: 'Tài khoản & Xác minh' },
  { key: 'swap', label: 'Đổi lớp học phần' },
  { key: 'knowledge', label: 'Chia sẻ kiến thức' },
  { key: 'groups', label: 'Tìm nhóm kết nối' },
  { key: 'clubs', label: 'Câu lạc bộ' },
  { key: 'mentoring', label: 'Mentoring' },
] as const;

export const faqList: FaqItem[] = [
  // 1. Tài khoản
  {
    id: 'account-email',
    category: 'account',
    question: 'Tại sao bắt buộc phải sử dụng email trường để đăng ký?',
    answer:
      'SCS là mạng lưới kết nối nội bộ sinh viên. Việc xác minh qua email trường giúp đảm bảo 100% người dùng trong hệ thống là sinh viên thực thụ, tạo môi trường trao đổi an toàn và tin cậy.',
  },
  {
    id: 'account-privacy',
    category: 'account',
    question: 'Dữ liệu cá nhân và tiêu chí matching của tôi được bảo mật như thế nào?',
    answer:
      'Dữ liệu hồ sơ và lịch rảnh chỉ được dùng để tính toán điểm tương thích matching. Bạn có toàn quyền bật/tắt quyền dùng dữ liệu cho từng tính năng (Đổi lớp, Tìm nhóm, Mentor) trong phần Cài đặt quyền riêng tư.',
  },

  // 2. Đổi lớp
  {
    id: 'swap-gia-tri-hoc-vu',
    category: 'swap',
    question: 'Kết nối đổi lớp trên SCS có thay thế thủ tục chính thức của phòng đào tạo không?',
    answer:
      'Không. SCS chỉ đóng vai trò là nền tảng kết nối thông tin và tìm đối tác có nhu cầu hoán đổi lớp học phần tương ứng. Sau khi hai bên xác nhận kết nối thành công, bạn và đối tác vẫn phải tự thực hiện thủ tục chuyển lớp theo đúng quy định của Nhà trường.',
  },
  {
    id: 'swap-ai-matching',
    category: 'swap',
    question: 'Điểm tương thích AI trong tìm kiếm đối tác đổi lớp được tính như thế nào?',
    answer:
      'Hệ thống đối chiếu mã lớp hiện tại, mã lớp mong muốn và sự trùng khớp trong lịch rảnh tự khai giữa hai sinh viên để đưa ra % phù hợp và lý do gợi ý cụ thể.',
  },

  // 3. Kiến thức
  {
    id: 'pending-review',
    category: 'knowledge',
    question: 'Tại sao bài viết của tôi lại ở trạng thái "Đang chờ kiểm duyệt"?',
    answer:
      'Để duy trì chất lượng học thuật và phòng chống nội dung độc hại, hệ thống có cơ chế kiểm duyệt tự động dựa trên từ khóa và quy định cộng đồng. Các bài viết cần rà soát thêm sẽ được Quản trị viên duyệt trong vòng 24 giờ trước khi hiển thị công khai.',
  },
  {
    id: 'knowledge-formats',
    category: 'knowledge',
    question: 'Tôi có thể tải lên những định dạng tài liệu nào?',
    answer:
      'Hệ thống hỗ trợ các định dạng tệp PDF, DOCX, PPTX, PNG, JPG với dung lượng tối đa 10MB cho mỗi tệp đính kèm.',
  },

  // 4. Nhóm
  {
    id: 'groups-join-mode',
    category: 'groups',
    question: 'Chế độ tham gia nhóm "Trực tiếp" và "Cần duyệt" khác nhau thế nào?',
    answer:
      'Với chế độ Trực tiếp, bạn sẽ trở thành thành viên ngay khi bấm Tham gia (nếu nhóm còn chỗ). Với chế độ Cần duyệt, chủ nhóm sẽ xem xét hồ sơ và phê duyệt yêu cầu của bạn.',
  },

  // 5. CLB
  {
    id: 'clubs-apply',
    category: 'clubs',
    question: 'Quy trình xét tuyển vào Câu lạc bộ diễn ra như thế nào?',
    answer:
      'Khi ứng tuyển vào đợt tuyển của CLB, đơn của bạn sẽ trải qua các bước: Đã nộp → Cần bổ sung (nếu thiếu thông tin) → Sơ loại hồ sơ → Phỏng vấn → Trúng tuyển. Bạn có thể theo dõi tiến độ tại mục "Đơn ứng tuyển CLB".',
  },

  // 6. Mentoring
  {
    id: 'ai-fallback',
    category: 'mentoring',
    question: 'Nếu tính năng gợi ý AI gặp sự cố thì tôi tìm kiếm Mentor thế nào?',
    answer:
      'Khi dịch vụ AI không khả dụng hoặc bị quá tải, hệ thống sẽ tự động chuyển sang chế độ Duyệt danh sách thủ công kết hợp bộ lọc theo lĩnh vực và môn học để đảm bảo trải nghiệm của bạn không bị gián đoạn.',
  },
];
