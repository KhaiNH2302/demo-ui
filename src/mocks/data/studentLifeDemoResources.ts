// Source text for downloadable demo attachments in public/demo/student-life/.
export const studentLifeDemoResources = {
  ojt: {
    name: "Checklist chuẩn bị OJT.txt",
    url: "/demo/student-life/ojt-checklist.txt",
    content: "TÀI LIỆU DEMO — CHECKLIST CHUẨN BỊ OJT\n\n1. Xem yêu cầu OJT do trường công bố cho kỳ của bạn.\n2. Chuẩn bị CV và mô tả phần việc bạn trực tiếp làm.\n3. Lưu lịch ứng tuyển, phỏng vấn và thông tin người liên hệ.\n4. Ghi nhật ký công việc và các câu hỏi cần trao đổi với người hướng dẫn.\n\nĐây là ví dụ cho giao diện, không phải quy định chính thức của FPT.\n",
  },
  graduation: {
    name: "Checklist đồ án tốt nghiệp.txt",
    url: "/demo/student-life/graduation-checklist.txt",
    content: "TÀI LIỆU DEMO — ĐỒ ÁN TỐT NGHIỆP\n\n1. Thống nhất mục tiêu và phạm vi với người hướng dẫn.\n2. Chia đầu việc, thời hạn và người chịu trách nhiệm.\n3. Chuẩn bị dữ liệu demo và kiểm tra luồng chính.\n4. Luyện trình bày, hỏi đáp và phương án xử lý lỗi khi demo.\n\nĐối chiếu yêu cầu thực tế của kỳ học. Đây không phải biểu mẫu của trường.\n",
  },
  materials: {
    name: "Gợi ý tự ôn PRJ301.txt",
    url: "/demo/student-life/materials-checklist.txt",
    content: "TÀI LIỆU DEMO — GỢI Ý TỰ ÔN PRJ301\n\n- Vẽ luồng request và response cho một chức năng.\n- Phân biệt session với request attribute bằng ví dụ của bạn.\n- Tự viết một form có kiểm tra dữ liệu đầu vào.\n- Ôn kết nối cơ sở dữ liệu và cách xử lý lỗi.\n\nĐây là ghi chú tự học minh họa, không phải đề thi hoặc đáp án.\n",
  },
  career: {
    name: "Checklist CV và phỏng vấn.txt",
    url: "/demo/student-life/career-checklist.txt",
    content: "TÀI LIỆU DEMO — CV VÀ PHỎNG VẤN\n\n1. Ghi rõ vai trò và kết quả trong từng dự án.\n2. Kiểm tra đường dẫn portfolio và thông tin liên hệ.\n3. Chuẩn bị ví dụ về một vấn đề bạn đã giải quyết.\n4. Tìm hiểu công việc và chuẩn bị câu hỏi cho nhà tuyển dụng.\n\nNội dung minh họa cho tính năng tài liệu đính kèm.\n",
  },
  procedures: {
    name: "Checklist hỏi thủ tục sinh viên.txt",
    url: "/demo/student-life/procedures-checklist.txt",
    content: "TÀI LIỆU DEMO — THỦ TỤC SINH VIÊN\n\n- Xác định giấy tờ hoặc xác nhận bạn cần.\n- Tìm đầu mối liên hệ trong thông báo chính thức của cơ sở.\n- Hỏi thời hạn, cách nộp và giấy tờ đi kèm.\n- Lưu mã yêu cầu và thời điểm gửi.\n\nKhông dùng tài liệu này thay cho hướng dẫn của trường.\n",
  },
  other: {
    name: "Checklist học tập và sinh hoạt.txt",
    url: "/demo/student-life/student-checklist.txt",
    content: "TÀI LIỆU DEMO — KINH NGHIỆM SINH VIÊN\n\n- Chọn ba việc cần hoàn thành trong tuần.\n- Ghi lại các khoản chi để biết ngân sách còn lại.\n- Chừa thời gian nghỉ và trao đổi với bạn cùng nhóm.\n- Khi hỏi cộng đồng, nêu rõ tình huống và điều bạn đã thử.\n\nTệp mẫu dùng kiểm tra chức năng xem và tải tài liệu.\n",
  },
} as const;

export function demoAttachment(category: keyof typeof studentLifeDemoResources) {
  const file = studentLifeDemoResources[category];
  return { name: file.name, url: file.url, size: new TextEncoder().encode(file.content).length };
}
