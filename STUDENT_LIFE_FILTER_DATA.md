# Dữ liệu demo cho bộ lọc Đời sống sinh viên

## Tập dữ liệu

Sinh từ `src/mocks/data/studentLifeFilterFixtures.ts`, ghép vào bài viết và bình luận đang có. Mỗi lần tải ứng dụng, ngày đi và năm chuyển vào được tính theo múi giờ Việt Nam. ID ổn định theo trường hợp mẫu, không dùng số ngẫu nhiên.

| Chủ đề | Bài mới | Phạm vi |
| --- | ---: | --- |
| Chuyện ở trọ | 5.545 | 35 khu vực × 3 nhu cầu × 4 số người × 12 tháng; thêm các mức giá cao hơn, tin kết thúc và bài kinh nghiệm |
| Kinh nghiệm sinh viên | 1.695 | 6 phân loại × 3 nhu cầu × có/không có tệp tại mọi khu vực; tài liệu có PRJ301, CSD201, MAS291 |
| Hôm nay ăn gì | 610 | Các mức 25k, 45k, 65k, 95k; tọa độ mô phỏng trong/ngoài bán kính và bài chưa gắn vị trí |
| Tìm bạn ghép xe | 715 | Cần ghép/còn chỗ, chiều đi/về, hôm nay/ngày mai/+2/+7/+14 ngày tại mọi khu vực |
| Chuyện quanh trường | 120 | Bài chia sẻ, câu hỏi chưa có lời giải và câu hỏi đã có phản hồi |
| Tâm sự & trò chuyện | 120 | Bài trò chuyện, câu hỏi và phản hồi tại mọi khu vực |
| **Tổng** | **8.805** | Thêm 2.310 bình luận; các số trên bao gồm 90 bài cho trạng thái “Bài của tôi” |

## Ví dụ thao tác

- Trọ: chọn bất kỳ campus/khu vực → một trong ba nhu cầu (tìm phòng, ở ghép, nhượng phòng) → 1–4 người → tháng 1–12 → mức giá tối đa → chọn một hoặc nhiều tiện ích. Có mẫu mở giá dưới 1 triệu/người và đủ tiện ích cho mỗi tổ hợp rời rạc này. Các mẫu đó là dữ liệu kiểm thử, không đại diện giá thị trường.
- Còn phòng: bỏ/bật công tắc để đối chiếu các mẫu đã kết thúc.
- Kinh nghiệm: thử lần lượt OJT, Đồ án tốt nghiệp, Tài liệu & ôn thi, CV & phỏng vấn, Thủ tục sinh viên, Kinh nghiệm khác; mỗi phân loại có chia sẻ/câu hỏi/xin tài liệu và có/không có tệp.
- Tài liệu: chọn PRJ301, CSD201 hoặc MAS291; bật “Có tài liệu đính kèm”. Sáu tệp thật nằm trong `public/demo/student-life/` và có thể tải từ bài viết.
- Ăn uống: thử giá tối đa 30k/50k/80k, giá tăng/giảm, được yêu thích và được bàn luận. Các mẫu có lượt thích và số bình luận khác nhau; mỗi bình luận đều có bản ghi tương ứng.
- Gần tôi: tọa độ quán là điểm mô phỏng quanh các mốc demo xuất trong `DEMO_CAMPUS_LOCATIONS`. Các khoảng cách 0,3/2/4,5/7 km giúp đối chiếu bán kính 1/3/5 km. Quán mô phỏng không có nút chỉ đường ra Google Maps. GPS ngoài vùng mẫu có thể không có kết quả.
- Ghép xe: “Hôm nay”, “Ngày mai” và “Chọn ngày khác” ở +2/+7/+14 ngày đều có hai nhu cầu và hai chiều đi/về. Ví dụ điểm đi: Mỹ Đình, Suối Tiên, Bến xe trung tâm Đà Nẵng, Bến Ninh Kiều, Trung tâm Quy Nhơn.
- Bài của tôi: tài khoản `usr_student_01` có Đã đăng/Chờ duyệt/Bị từ chối cho cả sáu chủ đề tại năm campus.
- Đã lưu: khởi tạo các mẫu đã lưu ở mọi chủ đề/khu vực; bỏ lưu vẫn hoạt động bình thường.
- Đang theo dõi: chỉ hiển thị các chủ đề người dùng đã theo dõi. Mặc định là trọ và kinh nghiệm; cần theo dõi thêm chủ đề khác để có bài ở các chủ đề đó.

## Giới hạn có chủ đích

Đây là dữ liệu mô phỏng để đánh giá giao diện và logic lọc. Không phải tin Facebook, phòng cho thuê, giá thị trường hoặc quán ăn đã xác minh. Tìm kiếm văn bản tùy ý, ngày đi ngoài các ngày mẫu, điều kiện mâu thuẫn và vị trí ngoài vùng tọa độ demo vẫn có thể cho kết quả trống.

## Kiểm tra

`tests/student-life-filter-data.test.mjs` đối chiếu tập dữ liệu với chính danh sách bộ lọc, kiểm tra 20.160 tổ hợp trọ về giá/tháng/số người/tiện ích, các phân loại tài liệu, bán kính, ngày tương đối, tệp tải xuống, ID và quan hệ bình luận.
