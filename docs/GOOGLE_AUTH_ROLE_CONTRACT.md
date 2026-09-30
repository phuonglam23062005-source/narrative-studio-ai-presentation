# Google login và role contract

## Browser

`auth-runtime.js` tải Google Identity Services chỉ khi `auth-config.js` có `googleClientId`. Credential nhận được từ Google được gửi qua HTTPS tới `googleVerifyEndpoint`; browser không tự giải mã rồi tin email để cấp admin.

## Server endpoint

`POST <googleVerifyEndpoint>` nhận JSON:

```json
{ "credential": "<Google ID token>" }
```

Server phải dùng thư viện Google Auth để verify chữ ký, `aud`, `iss` và `exp`. Sau đó dùng `sub` làm định danh Google ổn định, tra workspace membership/role trong database và trả JSON tối thiểu:

```json
{
  "user": {
    "id": "usr_123",
    "name": "Tên người dùng",
    "email": "user@example.com",
    "role": "admin",
    "picture": "https://..."
  }
}
```

`role` chỉ nhận `admin` hoặc `customer`; giá trị khác sẽ bị browser hạ xuống `customer`. Không trả ID token vào localStorage. Production cần session cookie HttpOnly/SameSite, CSRF protection, RLS policy và audit log.

## Hai luồng

- `customer`: tạo dự án, đính kèm nguồn và tạo/chỉnh sửa slide.
- `admin`: toàn bộ luồng customer và khu vực `Quản trị` để xem trạng thái tài khoản/OAuth; các thao tác thay đổi quyền phải thực hiện tại backend/RLS.

Khi thiếu `googleClientId` hoặc endpoint verify, giao diện hiển thị trạng thái chưa cấu hình và không tạo phiên Google giả.
