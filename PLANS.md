# ExecPlan AI Presentation Platform

## Phase 0 Foundation

### Mục tiêu

Đưa vertical slice local-first hiện có về trạng thái có context triển khai bền vững, cấu hình minh bạch, kiểm tra tự động và boundary an toàn trước khi mở rộng sang backend/auth.

### Phạm vi

- Giữ Presentation JSON làm source of truth và không bật integration chưa được xác minh.
- Bổ sung bộ tài liệu repository ngắn, authoritative cho các phase sau.
- Thêm env contract không chứa secret, feature flags và error boundary phía trình duyệt.
- Bổ sung CI kiểm tra syntax, smoke test và static build.
- Giữ acceptance flow local: project → sources → brief → agent → editor patch → restore → export.

### Không làm trong phase này

- Không tạo auth giả, Supabase/RLS giả hoặc backend giả.
- Không gọi Gemini, Canva, payment, webhook hay upload ra ngoài.
- Không thay đổi Presentation JSON canonical để phục vụ renderer.

### Trạng thái

- [x] Inspect repository và xác nhận release local-first hiện tại.
- [x] Chốt boundary trong `docs/00_PRODUCT_LOCK.md` và `docs/01_ARCHITECTURE.md`.
- [x] Thêm env contract, foundation runtime và CI.
- [x] Hoàn thiện local readiness matrix, drag-and-drop ingestion và quota fallback có runtime test.
- [x] Chạy `npm run check`, `npm test`, `npm run build`.
- [ ] Browser acceptance đầy đủ trên mọi trình duyệt mục tiêu.

### Verification

```bash
npm run check
npm test
npm run build
```

### Exit criteria

Build tĩnh tạo đủ asset, smoke test kiểm tra các bất biến kiến trúc, runtime có fallback khi localStorage lỗi, không có secret trong source và các giới hạn chưa triển khai được ghi rõ cho phase tiếp theo.

### Next phase

Phase 1 chỉ bắt đầu sau khi có Supabase development project và sẽ triển khai auth, workspace membership, migration và RLS test thật. Không dùng localStorage thay cho tenant authorization.

## Next execution plan

### Slice A — Contract boundary (đang triển khai)

- [x] Tách serialization và validation của `presentation-json.v1` khỏi DOM runtime.
- [x] Thêm test độc lập cho serialization, stable IDs, sourceRefs và invalid element IDs.
- [x] Dùng cùng domain contract cho local agent artifact và export path.

### Slice B — Local acceptance gate

- [ ] Browser test project → source → brief → generate → patch → restore → export.
- [ ] Chốt trạng thái manual acceptance cho `file://` và HTTP preview.
- [ ] Kiểm tra reload giữ project/version graph mà không có network egress.

### Slice C — Phase 1 live gate

- [ ] Nhận development project ref và public anon key; không nhận service-role key trong client.
- [ ] Apply migration, chạy pgTAP và cross-tenant test với hai user thật.
- [ ] Chỉ sau khi pass mới nối browser auth/workspace dashboard.

### Slice D — Server ingestion and AI

- [ ] Signed upload + quarantine + checksum + parser worker theo từng loại file.
- [ ] Server-only provider adapter với structured output, retry, quota và audit.
- [ ] Giữ `sourceRefs`, fact-level citation và patch/version boundary qua toàn bộ pipeline.

## Phase 1 preparation status

- [x] Thiết kế migration profiles/workspaces/members/projects.
- [x] Thêm RLS policies, restricted grants và helper functions có `auth.uid()`.
- [x] Thêm static RLS contract test và pgTAP test template.
- [ ] Apply vào Supabase development project.
- [ ] Chạy cross-tenant test với hai user thật.
- [ ] Nối browser auth và dashboard workspace.

Phase 1 chỉ được đánh dấu complete sau ba mục cuối có evidence live.
