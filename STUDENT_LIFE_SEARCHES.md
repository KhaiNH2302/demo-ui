# Theo dõi tìm kiếm Đời sống sinh viên

## Mục đích

Lưu các điều kiện đang tìm để nhận thông báo khi có bài mới phù hợp. “Lưu bài viết” giữ một bài đã thấy; “Theo dõi tìm kiếm” chờ các bài chưa xuất hiện. Bản đầu tiên lưu đúng điều kiện người dùng chọn, không tự suy luận hoặc ghép người.

## Cách thử trên giao diện

1. Vào Đời sống sinh viên → Bảng tin → Chuyện ở trọ.
2. Chọn Hòa Lạc, Xã Hạ Bằng, Tìm người ở ghép, mức chi và số người.
3. Bấm “Theo dõi tìm kiếm này”. Đặt tên; nếu có giá trọ thì chọn rõ theo phòng hay theo người. Xác nhận bật thông báo.
4. Mở “Tìm kiếm đã lưu” để mở kết quả, sửa điều kiện, tạm dừng, bật lại hoặc xóa.
5. Trong bản demo, bấm “Thử thông báo”. Một bài mô phỏng có nhãn sẽ được tạo bởi tài khoản sinh viên khác. Chuông thông báo nhận bài này; bấm thông báo mở đúng bài.

Có thể thử tương tự cho Ăn uống, Ghép xe, Pass đồ và Kinh nghiệm. Chức năng theo dõi yêu cầu đăng nhập và chọn một cơ sở cụ thể.

## Quy tắc

- Tất cả điều kiện được lưu phải khớp. Loại tin được giữ nguyên: chọn “Tìm người ở ghép” sẽ không nhận tin “Tìm phòng”.
- Giá trọ phải cùng đơn vị phòng/người. Không tự chia giá phòng theo số người.
- Chỉ xét bài xuất bản sau lúc bật hoặc lưu lại điều kiện. Không gửi hàng loạt thông báo về dữ liệu đang có.
- Không báo bài của chính người theo dõi; không báo bài đang chờ duyệt hoặc bị ẩn. Ngày hoàn thành dự kiến chỉ dùng nhắc tác giả, không tự rút bài. Tôn trọng phạm vi cùng trường của bài.
- Bài chờ duyệt được xét khi lần đầu xuất bản. Sửa bài đã xuất bản không tạo lại thông báo.
- Một người nhận tối đa một thông báo cho một bài, kể cả khi bài khớp nhiều tìm kiếm.
- Bật lại sau tạm dừng chỉ nhận bài xuất bản từ lúc bật lại; không phát lại bài trong thời gian tạm dừng.
- Sắp xếp không được lưu. Riêng “Câu hỏi chưa có lời giải” là điều kiện lọc nên vẫn được giữ.
- Không lưu GPS hoặc bán kính “Gần tôi”. Cần bỏ chế độ Gần tôi trước khi theo dõi.
- Tìm kiếm theo tháng tự hết hiệu lực khi tháng đó kết thúc; theo ngày đi hết hiệu lực khi ngày đó kết thúc, theo giờ Việt Nam. Không tự chuyển tháng sang năm mới. Đây là thời hạn tìm kiếm, chưa phải chức năng quản lý vòng đời toàn bộ bài đăng.
- Tối đa 10 tìm kiếm cho mỗi tài khoản. Có thể sửa, tạm dừng hoặc xóa.

## Tổ chức mã

- `src/lib/lifeSearches.ts`: chuẩn hóa điều kiện, so khớp, thời hạn và nhãn trình bày; dùng chung cho UI và mock API.
- `src/components/shared/LifeSearchWatch.tsx`: xác nhận theo dõi, danh sách quản lý và luồng sửa điều kiện bằng bộ lọc hiện có.
- `src/mocks/lifeSearches.ts`: lưu theo tài khoản, xét lần xuất bản, chống trùng và đồng bộ trạng thái đã đọc.
- `src/mocks/handlers/lifeSearches.ts`: API tạo/sửa/xóa và tạo bài mô phỏng.
- `tests/student-life-searches.test.mjs`: kiểm thử hợp đồng dữ liệu, phân quyền, thông báo, tạm dừng, duyệt bài và lưu trữ demo.

API: `GET/POST /community/searches`, `PATCH/DELETE /community/searches/:id`. Endpoint `/community/searches/:id/demo` chỉ có trong chế độ mock. Thông báo dùng nguồn `StudentLifeSearch` của chuông và trang Thông báo hiện tại.

## Giới hạn của bản demo

Tìm kiếm và thông báo được lưu trong trình duyệt, tách theo tài khoản mock. Việc xét bài diễn ra khi xuất bản, duyệt bài hoặc khi ứng dụng tải thông báo. Không có dịch vụ nền, email hay thông báo đẩy khi đóng ứng dụng; dữ liệu không đồng bộ giữa các máy.

Để dùng thực tế, giữ hợp đồng điều kiện này và chuyển lưu trữ sang backend; phát sự kiện lần đầu xuất bản, kiểm tra quyền xem, ghi nhận giao thông báo duy nhất theo người nhận/bài và xử lý bằng worker. Dữ liệu mô phỏng chỉ để kiểm tra chức năng, không phải bằng chứng nhu cầu sử dụng.
