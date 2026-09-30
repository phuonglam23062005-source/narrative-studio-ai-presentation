# Security boundary

Không có secret trong client bundle, browser storage, fixture hoặc log. File là untrusted input: phase backend phải kiểm MIME/extension, size, checksum, quarantine và parser sandbox.

Server target phải dùng least privilege, RLS cross-tenant tests, CSRF/session protection, idempotency cho charge/publish/delete và audit log cho action có hậu quả.

Phase 0 chỉ xử lý dữ liệu local trong browser và không tuyên bố tenant isolation vì chưa có server authorization.
