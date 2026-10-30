export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'account' | 'knowledge' | 'groups' | 'clubs' | 'mentoring';
}

export const faqCategories = [
  { key: 'account', label: 'Tài khoản & Xác minh' },
  { key: 'knowledge', label: 'Đời sống sinh viên' },
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
      'Dữ liệu hồ sơ và lịch rảnh chỉ được dùng để tính toán điểm tương thích matching. Bạn có toàn quyền bật/tắt quyền dùng dữ liệu cho từng tính năng (Tìm nhóm, Mentor) trong phần Cài đặt quyền riêng tư.',
  },

  // 2. Kiến thức
  {
    id: 'pending-review',
    category: 'knowledge',
    question: 'Tại sao bài viết của tôi lại ở trạng thái "Đang chờ kiểm duyệt"?',
    answer:
      'Để duy trì chất lượng thảo luận và phòng chống nội dung độc hại, hệ thống có cơ chế kiểm duyệt tự động dựa trên từ khóa và quy định cộng đồng. Các bài viết cần rà soát thêm sẽ được Quản trị viên duyệt trong vòng 24 giờ trước khi hiển thị công khai.',
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
      'Chọn đợt tuyển thành viên hoặc cộng tác viên trong mục Câu lạc bộ, gửi hồ sơ và theo dõi tại tab "Đơn của tôi". CLB có thể chuyển đơn sang Đang xem xét, yêu cầu bổ sung, nhận hoặc từ chối kèm phản hồi. Nếu quá hạn dự kiến, đơn hiển thị "CLB chưa phản hồi đúng hạn" và bạn có thể gửi nhắc nhở. Sau khi được nhận, đơn hiển thị đầu mối liên hệ và lịch gặp mặt nếu CLB đã công bố.',
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
