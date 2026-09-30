# Canva boundary

Canva là external branch, không phải database của web. Target integration dùng OAuth Authorization Code + PKCE, encrypted server-side refresh token, capability detection và Design Import fallback. Autofill chỉ dùng khi capability/plan và template fields được xác minh.

Phase 0 không gọi Canva, không lưu token và không hiển thị connected state giả.
