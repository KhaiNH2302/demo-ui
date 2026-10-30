# Đời sống sinh viên — bản UI thử nghiệm

Bản này được clone riêng từ `https://github.com/KhaiNH2302/demo-ui.git`, commit nguồn `b884d5f`.

## Hướng sản phẩm

Sinh viên chia sẻ trải nghiệm thực tế, hỏi kinh nghiệm và trò chuyện về cuộc sống quanh trường. Nội dung được tổ chức theo chủ đề và campus. Môn học không còn là trường bắt buộc của bài đăng.

- Chuyện ở trọ
- Hôm nay ăn gì
- Tìm bạn ghép xe
- Chuyện quanh trường
- Kinh nghiệm sinh viên
- Tâm sự & trò chuyện

Ba loại bài là **Chia sẻ**, **Hỏi kinh nghiệm** và **Review quán**. Review thuộc chủ đề Hôm nay ăn gì, có tên quán, món gọi, mức chi/người, điểm cá nhân và ngày ghé. Có thể lọc review theo ngân sách. Bài hỏi cần tiêu đề để người đọc hiểu vấn đề ngay trên bảng tin. Người hỏi có thể đánh dấu một phản hồi hữu ích, và có thể bỏ đánh dấu. Nhãn “Đã được hỗ trợ” không chứng nhận thông tin là đúng hoặc đã được nhà trường xác minh.

## Các luồng có thể thử

1. Mở `/knowledge`, chọn chủ đề/campus hoặc tìm từ khóa có dấu và không dấu.
2. Ô “Viết bài” dưới các tab mở trang riêng `/knowledge/new`; quay lại hoặc tải lại trang để kiểm tra nháp chữ. Chủ đề, campus và loại bài đang chọn được chuyển sang trang soạn.
3. Trong tab “Đang theo dõi”, chọn “Chỉnh sửa chủ đề” để thêm/bớt chủ đề, thay đổi lưu ngay. Bảng tin dùng một cột; đã bỏ các thẻ phụ bên phải và khối chủ đề theo dõi lặp lại trên điện thoại.
4. Lưu/bỏ lưu một bài và kiểm tra tab “Đã lưu”.
5. Mở bài hỏi của Nguyễn Văn An, đánh dấu/bỏ đánh dấu phản hồi hữu ích.
6. Mở “Bài của tôi” để sửa bài đã đăng hoặc chỉnh bài bị từ chối và gửi lại.
7. Nút Tạo mới → Đặt câu hỏi / Chia sẻ bài viết mở trực tiếp form mới.

Đường dẫn `/knowledge` và tên kiểu dữ liệu `KnowledgePost` được giữ để các link, hồ sơ và module khác tiếp tục hoạt động. Giao diện hiển thị tên “Đời sống sinh viên”.

## Chạy local

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Mở `http://127.0.0.1:5174/knowledge`.

```powershell
npm run build
npm test
npm run lint
```

## Giới hạn của demo

- Bài đăng, bình luận và tương tác dùng MSW/in-memory, được dựng lại khi tải lại trang. Nháp chữ lưu trên trình duyệt theo tài khoản.
- File và ảnh tải lên là URL tạm trong phiên trình duyệt; chưa có dịch vụ lưu trữ.
- Nội dung mẫu chỉ minh họa tình huống sinh viên, không phải quảng cáo hay đánh giá chỗ trọ/quán ăn thực tế.
- Chức năng này tập trung vào chia sẻ, hỏi kinh nghiệm và thảo luận. Chưa có đặt phòng, thanh toán hoặc xử lý giao dịch thuê trọ.

## Tham khảo thiết kế và văn phong

Xem [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) để biết sản phẩm tham khảo, nguyên tắc viết demo và nguồn ảnh. Bài seed dùng tên quán thật và giá tham khảo có nguồn, ghi nhãn nội dung biên soạn. Không hiển thị số sao hay ngày ghé giả. Review do người dùng tự đăng vẫn có điểm cá nhân, không tổng hợp thành điểm quán. Bảng tin tiếp tục tự hiện thêm bài khi cuộn.

Chuyện ở trọ bao gồm trải nghiệm chỗ ở, chi phí, ký túc xá và chuyện sống chung. Bài chia sẻ có thể thêm chi phí/người/tháng, thời gian đã ở, điểm phù hợp và điều cần cân nhắc. Thông tin này không dùng số sao hoặc xếp hạng chỗ trọ; tên chủ đề và mã `housing` giữ thống nhất trên bộ lọc, form và bài viết.

Trang soạn và sửa bài đều dùng trang riêng: `/knowledge/new` và `/knowledge/:id/edit`. Ô mở bài trên bảng tin, Trang chủ và các lối tắt tạo bài cùng dẫn đến trang soạn. “Lưu nháp & quay lại” trở về đúng bảng tin/bộ lọc trước đó. Đăng xong chuyển đến Bài của tôi; sửa xong mở chi tiết bài.

Bảng tin chỉ giữ hàng chủ đề; đã bỏ thanh “Mọi bài viết / Hỏi kinh nghiệm / Chia sẻ / Review quán”. Tìm bạn ghép xe tập trung vào tìm chuyến/còn chỗ, tuyến đi, giờ hẹn và cách chia chi phí; đây là bài đăng cộng đồng, chưa có luồng đặt xe.

## Nội dung có nguồn và phạm vi quán ăn

Đã bỏ khối quán ăn bên phải. Tên quán/món trong bài tham khảo là dữ kiện có nguồn công khai; không có danh bạ, trang quán, quảng cáo hay điểm xếp hạng chung. Xem [DEMO_CONTENT_SOURCES.md](DEMO_CONTENT_SOURCES.md). Bài demo ghi rõ được biên soạn lại; không hiển thị điểm hoặc ngày ghé giả.
