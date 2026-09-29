# Narrative Studio — AI Presentation Workspace

Đây là bản release local-first, miễn phí, được xây theo tài liệu kiến trúc A và đặc tả B. Tiếng Việt là mặc định.

## Chạy local

```bash
npm run check
npm test
npm run build
npm run dev
```

Mở `http://127.0.0.1:4173`.

## Đã hiện thực trong bản này

- Presentation JSON là dữ liệu nguồn của renderer, không dùng screenshot làm source of truth.
- 6 slide mẫu với các layout: cover, stats, insight, data, process, closing.
- Slide rail, canvas 16:9, inline text editing, inspector và phiên bản bất biến.
- Adaptive interview modal với 3 câu hỏi; thao tác “Lock brief” tạo version.
- AI copilot local deterministic: tạo `baseVersionId`, `scope`, `operations`, preview rồi mới apply.
- Source map UI, add-source local flow, trạng thái phân tích và source trail.
- Export JSON theo presentation-json.v1, có brief, theme, element IDs, notes, sourceRefs và QA.
- Autosave localStorage; reload giữ dự án, brief, version graph và ngôn ngữ.
- Tạo dự án mới, adaptive interview, lock brief, generation, QA status, undo/redo, restore và branch.
- Editor có thêm/nhân bản/xóa/sắp xếp slide; mọi thao tác tạo snapshot mới và không xóa lịch sử.
- Source queue có retry và remove theo version; UI có empty/loading/retry trạng thái cục bộ.
- Có schema/đối chiếu kiến trúc trong docs/presentation.schema.json và docs/ARCHITECTURE_STATUS.md.
- Có Đội AI agent tự vận hành: Manager route goal, specialist pipeline, A2A-like trace, checkpoint, pause/resume, budget, QA repair và artifact cuối.
- Đặc tả vận hành của đội agent nằm trong docs/agent-system.md.
- Integration registry minh bạch cho Microsoft Designer, Figma, Lovable, v0, Make, Zapier.

## Ranh giới release hiện tại

- Chưa có backend, auth, Postgres/RLS, object storage, worker queue, Gemini/AI provider thật, PPTX exporter, Canva OAuth/sidebar, billing/admin.
- Không gọi dịch vụ trả phí, không upload file và không gửi dữ liệu ra ngoài trình duyệt.
- Figma adapter cần OAuth; các công cụ còn lại chưa có connector callable trong phiên làm việc hiện tại.

Chi tiết quyết định phát hành có tại docs/ADR-001-local-first-release.md. Đây chưa phải multi-tenant SaaS production; cần backend, RLS, job runner và adapter OAuth thật trước khi bật các tính năng đó.
