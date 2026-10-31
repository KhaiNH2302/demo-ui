# Luồng CLB

Phạm vi: khám phá CLB, tuyển thành viên và cộng tác viên. Sự kiện được dẫn sang `/programs`; các URL sự kiện CLB cũ vẫn xem được để giữ liên kết và hồ sơ cũ.

## Sinh viên

1. Mở `/clubs`, chọn thành viên hoặc cộng tác viên. Bộ lọc gồm ban chuyên môn, từ khóa kỹ năng, mức cam kết, lĩnh vực và tình trạng nhận hồ sơ. Điều kiện được giữ trong URL.
2. Lưu cơ hội ở từng thẻ; xem lại trong tab **Đã lưu**. Theo dõi CLB trên danh sách hoặc hồ sơ để nhận thông báo đợt tuyển mới.
3. Xem hạn nhận đơn, hạn trả kết quả và vị trí trong trang chi tiết. Hỏi đáp công khai gắn với từng đợt; chỉ đại diện đúng CLB được trả lời.
4. Gửi hồ sơ với thông tin tài khoản tự điền. Có thể lưu nháp, bổ sung, xem lịch sử hoặc rút đơn.
5. Quá hạn dự kiến không tự biến thành từ chối/hết hạn. Đơn chờ xử lý hiển thị **CLB chưa phản hồi đúng hạn**; sinh viên được gửi một nhắc nhở trong 24 giờ.
6. Sau khi được nhận, đơn hiển thị người phụ trách thật trong danh sách đại diện. Nút nhắn tin tạo hoặc mở đúng cuộc trò chuyện giữa sinh viên và người phụ trách. Nếu CLB công bố lịch gặp mặt, tải được tệp iCalendar `.ics` với ngày, giờ, địa điểm của lịch đó.

## Đại diện CLB

- Tài khoản demo `clubrep@fpt.edu.vn`: chọn Trần Minh Cường tại trang đăng nhập.
- `/clubs?tab=manage`: quản lý đợt tuyển, tìm hồ sơ, lọc trạng thái, xem cảnh báo trễ hạn và xuất CSV danh sách đã nhận.
- `/clubs/manage/new`: bốn bước từ thông tin, chỉ tiêu/thời hạn, câu hỏi đến xem trước/công bố. Hai mẫu khởi tạo chỉ chứa gợi ý để CLB điền nội dung thực tế.
- Tái sử dụng lấy nội dung và câu hỏi từ đúng đợt tuyển được chọn của CLB đang đại diện. Không sao chép ID, số đã nhận, lịch onboarding hoặc hạn cũ.
- Các vị trí có chỉ tiêu riêng; tổng bằng chỉ tiêu đợt tuyển. Hạn trả kết quả không trước hạn nhận đơn. Khi có hồ sơ, khóa loại và bộ câu hỏi; không giảm chỉ tiêu dưới số đã được nhận.
- Đại diện vẫn được trả kết quả sau hạn dự kiến; yêu cầu bổ sung và từ chối cần phản hồi. Sinh viên nhận thông báo trong ứng dụng khi có quyết định.

## Giới hạn demo

API dùng MSW. Hồ sơ, hỏi đáp, hội thoại và thông báo nằm trong bộ nhớ, khởi tạo lại khi tải lại trang. Riêng lưu cơ hội và theo dõi CLB được lưu theo tài khoản trong localStorage của trình duyệt này. Không có thay đổi backend/database hoặc gửi email thật.

Nhắc đại diện trước hạn 24 giờ và khi trễ hạn được đối chiếu lúc đọc dữ liệu CLB; mỗi thông báo chỉ tạo một lần trong phiên. Đây chưa phải bộ lập lịch chạy nền. Dữ liệu tuyển mẫu có ngày tương đối để luôn có cả đợt đang mở và ví dụ trả kết quả trễ.

## Kiểm tra

```powershell
npm run build
node --import ./tests/source-loader.mjs --test tests/club-recruitment.test.mjs tests/program-club.test.mjs
```

Bộ test mới kiểm tra phân quyền, cô lập dữ liệu theo tài khoản/đợt, thông báo theo dõi, tái sử dụng, thời hạn/chỉ tiêu, bổ sung sau hạn dự kiến, nhắc nhở, xử lý kết quả trễ, hội thoại sau trúng tuyển và tệp lịch.
