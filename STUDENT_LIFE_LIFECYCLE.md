# Nhắc kiểm tra nhu cầu và ẩn/hiện bài viết

Ngày hoàn thành dự kiến là mốc nhắc cá nhân, không phải hạn tự đóng bài. Chỉ tác giả quyết định ẩn/hiện; không có trạng thái hoặc nút Đã pass/Đã tặng, Đã hoàn thành hay Hết hạn.

| Loại tin | Mốc dự kiến | Thông báo |
| --- | --- | --- |
| Tìm phòng, ở ghép, nhượng phòng | Chọn ngày, gợi ý 30 ngày sau | Vào ngày đã chọn |
| Pass/tặng đồ | Chọn ngày, gợi ý 14 ngày sau | Vào ngày đã chọn |
| Ghép xe | Lấy ngày, giờ xuất phát | Khi đến giờ đi |
| Kinh nghiệm ở trọ, ăn uống, kinh nghiệm sinh viên, tâm sự/câu hỏi | Không áp dụng | Không nhắc nhu cầu |

Ngày nhắc của tin trọ/đồ dùng bắt đầu lúc 00:00 theo giờ Việt Nam. Người đăng có thể tắt nhắc. Đây là giá trị gợi ý của bản demo, không phải thời hạn bắt buộc ẩn bài.

- Đến mốc: gửi riêng tác giả một thông báo “Bạn đã xong nhu cầu trong bài viết chưa?”. Liên kết dẫn về bài, có nút Ẩn bài và Sửa bài / đổi ngày nhắc.
- Bài vẫn xuất hiện trong bảng tin, hồ sơ và kết quả tìm kiếm; vẫn nhận trao đổi. Không tự ẩn, tự đóng hay tự đánh dấu hoàn thành.
- Nếu xong: tác giả bấm Ẩn bài. Người khác không xem qua bảng tin, tìm kiếm, hồ sơ, danh sách đã lưu hoặc liên kết trực tiếp. Tác giả quản lý trong Bài của tôi → Đã ẩn.
- Nếu còn nhu cầu: giữ bài như hiện tại hoặc sửa ngày dự kiến. Có thể Hiện bài dù ngày cũ đã qua. Sửa nội dung không bắt buộc đổi ngày nhắc cũ.
- Không nhắc bài đang ẩn, chưa được duyệt, bị gỡ hoặc đã tắt nhắc. Mỗi bài/mốc dự kiến nhắc một lần. Đọc thông báo được lưu; tải lại không gửi trùng. Đổi ngày loại thông báo cũ khỏi danh sách và tạo một lịch nhắc mới.
- Ẩn/hiện, sửa nội dung và đổi ngày giữ nguyên thời điểm xuất bản đầu tiên, tránh tạo thông báo giả “bài mới” cho người theo dõi tìm kiếm.
- Ẩn/hiện chỉ dành tác giả và không vượt kiểm duyệt. Bài chờ duyệt/bị từ chối/bị gỡ cần được duyệt; sửa lại gửi duyệt lại.

## Tương thích dữ liệu cũ

Bài từng đánh dấu hoàn thành được chuyển sang Đã ẩn để không tự xuất hiện trở lại. Dữ liệu legacy closed chỉ còn phục vụ chuyển đổi; form và API mới không tạo trạng thái này. Hiện lại sẽ xóa cờ legacy đó. Ngày hết hạn cũ được chuyển sang ngày dự kiến, không còn làm thay đổi hiển thị. Thông báo hết hạn/nhắc trước hạn cũ được thay bằng thông báo kiểm tra nhu cầu.

API tạo/sửa bài dùng expectedCompletionAt và remindOnExpectedDate. PUT /posts/:id/visibility nhận { hidden: boolean }. Endpoint completion cũ trả 410 và hướng dẫn dùng Ẩn bài.

## Phạm vi demo và kiểm tra

Các thay đổi được lưu tại trình duyệt. Chuông kiểm tra mỗi 15 giây, Bài của tôi và chi tiết bài mỗi 30 giây khi mở ứng dụng. Chưa có backend worker/email/push khi đóng ứng dụng; khi mở lại, ứng dụng kiểm tra các lịch nhắc đã đến.

Nguyễn Văn An (usr_student_01) có mẫu tin đang hiển thị, đã ẩn và đến ngày dự kiến tại /knowledge?tab=mine&topic=marketplace&status=all. Ma trận life_demo_* phục vụ bộ lọc không gửi hàng nghìn thông báo; bản ghi được chỉnh sửa chủ động sẽ tham gia nhắc bình thường.

Kiểm tra nghiệp vụ: tests/student-life-reminders.test.mjs. Chạy npm test và npm run build.
