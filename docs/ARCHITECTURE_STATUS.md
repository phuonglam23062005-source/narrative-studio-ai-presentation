# Đối chiếu kiến trúc với tài liệu A và đặc tả B

## Phần đã chỉnh và có thể chạy trong local-first vertical slice

| Quyết định trong tài liệu A | Hiện trạng |
|---|---|
| Presentation JSON là source of truth | Có presentation-json.v1, renderer đọc từ project state và export theo schema. |
| LLM không vẽ trực tiếp | Local provider tạo slide model; renderer dựng HTML; không dùng screenshot làm dữ liệu lõi. |
| AI command là structured patch | Có presentation-patch.v1, baseVersionId, scope slide, preview/apply và kiểm tra revision. |
| Snapshot trước mutation | Mọi generation, brief lock, manual edit, restore, undo/redo, AI patch đều tạo version. |
| Version graph/branch/restore | Có parentVersionId, branchKey, restore thành version mới, undo/redo qua snapshot. |
| Adaptive interview | Có 3 câu hỏi sau source map; câu trả lời được lưu vào brief và khóa trước generation. |
| Ưu tiên tiếng Việt | language: "vi" là mặc định; có chuyển en cho nội dung slide mẫu. |
| Multi-file ingestion | Có file picker local cho PDF/DOCX/PPTX/XLSX/CSV/TXT/ảnh; TXT/CSV được đọc preview, file khác đi vào queue local. |
| Command-first UX | Có luồng tiếng Việt tối giản: đính kèm file, nhập lệnh, sinh deck local 6 slide, mở editor và lưu chỉnh sửa thành version mới. |
| Light release UI | Giao diện sáng là mặc định; các view chưa có hành vi production được ẩn khỏi navigation chính. |
| Auth and role UX | Có Google Identity Services adapter, local auth fallback và UI tách `customer`/`admin`; browser không tự cấp quyền production. |
| Source map/provenance | Có source manifest, insight, facts, conflicts, sourceRefs trên slide và element. |
| Render QA/content QA | Có QA rule local cho title/subtitle/provenance và trạng thái cảnh báo trên canvas. |
| Autosave | Project state lưu trong localStorage; reload đã được kiểm thử. |
| Free/no paid | Không có provider key, không gọi API trả phí, không upload file ra ngoài trong bản này. |
| Autonomous agent team | Có Manager + 5 specialist, graph hữu hạn, message trace, source/brief/story/composer/evaluator/finalizer, checkpoint và artifact summary. |
| Durable local run | Run state, completedStages, budget và trace lưu localStorage; pause/resume sau reload tiếp tục từ checkpoint đã lưu. |
| Safety boundary | Budget stop, explicit termination, local-only egress và không publish/send mặc định. |
| Editor core mở rộng | Có add, duplicate, delete và reorder slide; tất cả tạo snapshot và giữ version history. |
| Patch hardening | Release layer kiểm baseVersionId, schema, operation allow-list và current slide scope trước apply. |
| Release build | Có build tĩnh, Vercel headers, AGENTS.md, smoke test và ADR nêu rõ local-first boundary. |
| Local readiness | Có matrix hiển thị capability local đang dùng được và production gate còn chờ Auth/RLS, provider AI, publish. |
| Domain contract boundary | `presentation-domain.js` giữ serialization/validation của `presentation-json.v1` độc lập với DOM; export hiện gọi qua boundary này. |

## Chưa thể đánh dấu production-ready trong workspace hiện tại

Các phần dưới đây cần backend và quyền dịch vụ thật; không được giả lập thành đã hoàn tất:

- Production auth/session, Google ID-token verification, workspace membership, User/Manager/Admin và Supabase RLS. Auth gate/role allowlist hiện tại chỉ là local preview để kiểm thử journey.
- Signed upload, object storage, MIME sniffing, quarantine, checksum server-side và retention.
- Durable queue/workflow, retry, idempotency, correlation ID và worker crash recovery.
- Gemini/AIProvider thật, structured-output validation bằng server-side schema và model routing.
- Parser native cho PDF/DOCX/PPTX/XLSX, asset extraction và fact-level citation.
- Fabric.js/canvas editor đầy đủ: multi-select, drag/resize/rotate, group/layer, image, chart editor.
- PPTX editable bằng PptxGenJS.
- Canva OAuth PKCE, Design Import, Autofill và Canva AI Sidebar.
- Credits ledger, plans, coupons, billing abstraction, analytics và admin controls.
- Security/evals/load test/backup/runbook trước khi public beta.

## Ranh giới triển khai tiếp theo

1. Apply `supabase/migrations/0001_workspace_foundation.sql` vào development project và chạy live RLS tests.
2. Nối browser auth + workspace dashboard sau khi cross-tenant isolation pass.
3. Tách domain model/schema khỏi browser runtime thành package dùng chung.
4. Thêm API server với append-only audit/credit ledger.
5. Thay LocalAIProvider bằng adapter Gemini sau khi người dùng cấu hình key/free quota.
6. Thêm parser/worker theo từng loại file, giữ sourceRefs và không gửi web research khi chưa bật.
7. Dùng Fabric.js cho interaction layer; giữ renderer/Presentation JSON làm nguồn chính.
8. Thêm export PPTX rồi mới mở Canva Free import path; Pro/Edu Autofill là nhánh riêng.
