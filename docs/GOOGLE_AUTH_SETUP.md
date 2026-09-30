# Bật Google login trên Vercel

Luồng Google không dùng tài khoản giả. Browser nhận ID token từ Google Identity Services; endpoint Vercel `/api/auth/google` kiểm tra chữ ký, issuer, audience, thời hạn và `email_verified`, sau đó cấp session cookie HttpOnly.

## 1. Tạo Web OAuth Client ID

Trong Google Cloud Console, tạo OAuth Client ID loại **Web application**. Thêm đúng các origin đang dùng, tối thiểu:

- `https://narrative-studio-ai-presentation.vercel.app`
- `http://127.0.0.1:4173`
- `http://localhost:4173`

Chỉ đưa **Client ID** vào cấu hình public; không đưa Client Secret vào repository hoặc browser.

## 2. Đặt biến môi trường Vercel

Trong project `narrative-studio-ai-presentation`, đặt các biến cho Production và Preview:

```text
PUBLIC_GOOGLE_CLIENT_ID=<Web client ID>
GOOGLE_CLIENT_ID=<cùng Web client ID>
GOOGLE_ADMIN_EMAILS=<email Google admin, phân cách bằng dấu phẩy>
AUTH_SESSION_SECRET=<chuỗi ngẫu nhiên dài, tối thiểu 32 ký tự>
```

`GOOGLE_ADMIN_EMAILS` là allowlist phía server. Mọi tài khoản Google khác nhận role `customer`; browser không thể tự nâng thành admin.

## 3. Kiểm tra

Sau khi redeploy, `/api/auth/config` phải trả `serverAuth: true` và Google button phải được render. Đăng nhập thành công phải tạo cookie `narrative_session` với `HttpOnly`, `Secure`, `SameSite=Lax`; không lưu ID token vào localStorage.

Nếu thiếu một trong các biến trên, UI hiển thị trạng thái chưa sẵn sàng và không tạo phiên Google giả.
