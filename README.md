# Narrative Studio — AI Presentation Workspace

Đây là bản release local-first, miễn phí, được xây theo tài liệu kiến trúc A và đặc tả B. Tiếng Việt là mặc định. Phase 0 có ExecPlan tại `PLANS.md` và acceptance criteria tại `tasks/PHASE_0_FOUNDATION.md`.

## Chạy local

```bash
npm run check
npm test
npm run build
npm run dev
```

Mở `http://127.0.0.1:4173`.

Có thể mở trực tiếp `index.html` bằng `file://`; nếu browser hạn chế `localStorage`, runtime sẽ tự chuyển sang fallback trong phiên và hiển thị trạng thái tương ứng. Preview qua HTTP được khuyến nghị để kiểm thử persistence.

### Cấu hình Google và hai luồng quyền

`auth-config.js` là cấu hình public để nối Google Identity Services:

- `googleClientId`: Web OAuth Client ID, không phải secret.
- `googleVerifyEndpoint`: endpoint server nhận credential Google, xác thực ID token và trả về user cùng `role` (`admin` hoặc `customer`).
- `localAdminEmails`: allowlist chỉ dành cho local preview; không dùng nó để bảo vệ admin production.

Khách hàng chỉ thấy luồng tạo/chỉnh sửa slide. Admin thấy thêm `Quản trị`, nơi hiển thị tài khoản và trạng thái OAuth. Role production phải do server/RLS cấp sau khi verify Google; browser không tự phong admin từ email.

## Đã hiện thực trong bản này

- Presentation JSON là dữ liệu nguồn của renderer, không dùng screenshot làm source of truth.
- 6 slide mẫu với các layout: cover, stats, insight, data, process, closing.
- Slide rail, canvas 16:9, inline text editing, inspector và phiên bản bất biến.
- Adaptive interview modal với 3 câu hỏi; thao tác “Lock brief” tạo version.
- AI copilot local deterministic: tạo `baseVersionId`, `scope`, `operations`, preview rồi mới apply.
- Source map UI, add-source local flow, trạng thái phân tích và source trail.
- Local composer đọc preview TXT/CSV và metadata nguồn để tạo source map, fact candidates và deck 6 slide có sourceRefs; đây là fallback deterministic, không phải Gemini production.
- Ingestion local kiểm tra phần mở rộng/MIME, hỗ trợ chọn file hoặc kéo-thả, giữ file chưa parse ở trạng thái chờ và chặn export nếu Presentation JSON không qua contract validation.
- Luồng chính đã được rút gọn theo hướng command-first: đính kèm tài liệu, nhập một câu lệnh tiếng Việt, sinh deck local 6 slide rồi chỉnh sửa bằng inspector và version history.
- Giao diện mặc định là light theme; các khu vực chưa có hành vi production (Agents, Projects, Integrations, Activity và các nút publish/chia sẻ) được ẩn khỏi luồng chính để giảm nhiễu.
- Auth boundary có Google Identity Services adapter, role badge và hai luồng `customer`/`admin`; khi chưa có client ID + endpoint verify, nút Google hiển thị trạng thái chưa cấu hình và không tạo phiên giả.
- Export JSON theo presentation-json.v1, có brief, theme, element IDs, notes, sourceRefs và QA.
- Autosave localStorage; reload giữ dự án, brief, version graph và ngôn ngữ.
- Tạo dự án mới, adaptive interview, lock brief, generation, QA status, undo/redo, restore và branch.
- Editor có thêm/nhân bản/xóa/sắp xếp slide; mọi thao tác tạo snapshot mới và không xóa lịch sử.
- Có chế độ Xem trước chỉ đọc với chuyển slide trước/sau; canvas hỗ trợ zoom 60–120% bằng nút hoặc phím `+`, `-`.
- Vùng chân canvas giữ lại hành động thường dùng là `＋ Slide`; thao tác ít dùng được gom vào menu `•••` để giảm nhiễu. Các lượt render UI được gom theo `requestAnimationFrame` để tránh render lặp trong cùng một frame.
- Các công cụ chỉnh hình/shape và nút chia sẻ chưa có hành vi production được ẩn khỏi luồng chính; chỉ bật lại sau khi có implementation và quyền kết nối thật.
- Source queue có retry và remove theo version; UI có empty/loading/retry trạng thái cục bộ.
- Có schema/đối chiếu kiến trúc trong docs/presentation.schema.json và docs/ARCHITECTURE_STATUS.md.
- Có Đội AI agent tự vận hành: Manager route goal, specialist pipeline, A2A-like trace, checkpoint, pause/resume, budget, QA repair và artifact cuối.
- Có foundation runtime: feature flags local-only, storage fallback trong phiên và error boundary hiển thị cho người dùng.
- Trang Kết nối có local-readiness matrix: tách capability đang chạy được khỏi Auth/RLS, AI provider và publish còn chờ cấu hình thật.
- UI có workflow progress, glass panels, ambient motion, focus/hover states, responsive layout, preview modal và `prefers-reduced-motion`.
- Đặc tả vận hành của đội agent nằm trong docs/agent-system.md.
- Integration registry minh bạch cho Microsoft Designer, Figma, Lovable, v0, Make, Zapier.

## Ranh giới release hiện tại

- Có auth gate local-only, role UI và adapter Google phục vụ kiểm thử; chưa có server verify Google, backend auth, Postgres/RLS live, object storage, worker queue, Gemini/AI provider thật, PPTX exporter, Canva OAuth/sidebar, billing/admin.
- Không gọi dịch vụ trả phí, không upload file và không gửi dữ liệu ra ngoài trình duyệt.
- Figma adapter cần OAuth; các công cụ còn lại chưa có connector callable trong phiên làm việc hiện tại.

Chi tiết quyết định phát hành có tại docs/ADR-001-local-first-release.md. Đây chưa phải multi-tenant SaaS production; cần backend, RLS, job runner và adapter OAuth thật trước khi bật các tính năng đó.
