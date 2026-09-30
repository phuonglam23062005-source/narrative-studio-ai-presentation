# Phase 0 Foundation

## Mục tiêu nghiệm thu

Một người dùng có thể mở bản local-first, tạo và chỉnh một presentation mẫu, xem version history, restore, export JSON và nhận trạng thái lỗi rõ ràng nếu browser storage hoặc runtime gặp sự cố.

## In scope

- TypeScript/JavaScript runtime strict syntax checks.
- Static build reproducible vào `dist/`.
- Public configuration chỉ chứa giá trị không nhạy cảm.
- Feature flag boundary cho các integration chưa được xác minh.
- Global error boundary và `unhandledrejection` reporting trong UI.
- Local storage quota fallback, readiness matrix và drag-and-drop ingestion boundary.
- CI pull-request workflow.

## Acceptance criteria

1. `npm run check`, `npm test` và `npm run build` pass.
2. `npm run check` xác nhận `.env.example` có default public và các secret placeholder đều rỗng; build không copy `.env` hoặc secret file.
3. `Presentation JSON` vẫn là contract export; DOM không trở thành domain model.
4. Runtime local-only hiển thị đúng boundary và không tự gửi dữ liệu ra ngoài.
5. Lỗi JavaScript chưa bắt được không làm mất hoàn toàn khả năng báo lỗi cho người dùng.
6. Các phase backend/provider chưa được mô tả như đã hoàn thành.
