# SCS UI demo

React + TypeScript + Vite, dùng MSW để mô phỏng API. Repo chưa chứa backend chạy PostgreSQL/MongoDB.

## Chạy và kiểm tra

Yêu cầu Node.js 24 trở lên. Từ thư mục `ui-demo`:

```powershell
npm ci
npm run dev -- --host 127.0.0.1
npm run build
npm run lint
npm test
```

Mở địa chỉ Vite in trong terminal. `.env.development` bật mock. Build chỉ bật mock khi `VITE_USE_MOCK=true`; không dùng cấu hình mock để triển khai thật.

`npm test` dùng Node test runner. `tests/source-loader.mjs` xử lý TypeScript và alias giống Vite. Lint chỉ quét `src`, không quét thư viện và output build.

## Vai trò demo

Dùng bộ chọn tài khoản demo ở trang đăng nhập. Sinh viên đăng ký chương trình và gửi đề xuất; `manager@fpt.edu.vn` có vai trò Event Manager để xét duyệt, tạo và quản lý chương trình. Quyền sửa từng đối tượng còn phụ thuộc chủ sở hữu. Panel Dev chỉ hiện trong môi trường phát triển.

## Dữ liệu và giới hạn

- Mock cập nhật mảng seed trong bộ nhớ. Thao tác có hiệu lực trong phiên demo; tải lại trang sẽ dựng lại seed. Chưa lưu vào database.
- Auth dùng token mô phỏng và tài khoản seed. Cần thay bằng backend trước khi triển khai thật.
- Các trang tải theo route; trạng thái chờ có thông báo và giữ navigation hiện tại.
- Lịch dùng cùng múi giờ local với giờ hiển thị. Không chuyển ngày dân sự sang UTC để làm khóa ô lịch.

## Tài liệu

- [Danh mục route](../specs/ui/SCREEN_INVENTORY.md), sinh lại bằng `node tools/generate-screen-inventory.mjs` từ gốc repo.
- [FE06](../specs/flows/FE06_Community_Program_Registration.md).
- [Thiết kế database](../specs/database/database-design.md).
- [Registry trạng thái](../docs/conventions/ENUM_STATUS_ERROR_REGISTRY.md).

`public/mockServiceWorker.js` là asset MSW; không ghi đè khi chỉ sửa nghiệp vụ UI.
