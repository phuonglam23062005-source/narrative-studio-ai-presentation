# Hệ thống AI agent tự vận hành

## Phân biệt nguồn chỉ dẫn

Tài liệu Cam_nang_AI_Agent_Toi_Cao_2026.docx là bộ nguyên tắc thiết kế và vận hành agent: charter, state machine, message contract, checkpoint, budget, guardrail, observability và eval. Nó không phải là yêu cầu người dùng để tự động gửi dữ liệu ra ngoài hoặc tự cấp quyền cho các dịch vụ chưa kết nối.

Yêu cầu sản phẩm của người dùng là: nhập một goal bằng tiếng Việt một lần; đội agent tự chia việc, truyền context có cấu trúc, kiểm tra, sửa trong phạm vi an toàn và trả artifact cuối cùng. Bản local này thực hiện yêu cầu đó trên dữ liệu của workspace hiện tại.

## Agent charter

- Mission: biến goal và nguồn hiện tại thành một Presentation JSON có thể render và chỉnh sửa.
- Default language: tiếng Việt.
- Scope: source map local, brief, story, slide composition, QA và version snapshot.
- Non-goals: không tự publish, không gửi email, không upload file, không gọi dịch vụ trả phí.
- Escalation: dừng ở budget, lỗi agent hoặc thao tác cần quyền bên ngoài; giữ trace và artifact trung gian để người dùng tiếp tục.

## Đội agent và luồng

Manager giữ global goal, budget, routing, checkpoint và final ownership. Các specialist có trách nhiệm riêng:

1. Manager route goal vào pipeline.
2. Source analyst tạo source map, manifest và provenance.
3. Brief architect tổng hợp goal với context hiện tại và khóa brief.
4. Story planner lập narrative arc từ slide intents.
5. Slide composer ghi kết quả vào Presentation JSON.
6. QA evaluator kiểm tra nội dung, provenance và các cảnh báo.
7. Nếu QA có issue, composer chạy tối đa một vòng targeted repair rồi QA lại.
8. Manager verify artifact, ghi version và kết thúc run.

Hai nhánh source map và brief chạy song song vì độc lập; các bước còn lại có join barrier. Mỗi stage là một checkpoint và stage đã hoàn tất sẽ được bỏ qua khi resume.

## Hợp đồng message và state

Message nội bộ có các trường: messageId, runId, from, to, type, goal, payload, evidence và createdAt. Trace UI hiển thị sender, receiver, artifact summary và evidence để có thể audit.

Run dùng các trạng thái: idle, running, paused, completed, stopped và failed. Pause/resume là state transition thật; reload biến execution đang dở thành paused recovery, sau đó resume từ completedStages đã lưu. Một manager sở hữu một run để tránh tạo pipeline trùng.

## Guardrail và budget

- Tối đa 12 stage steps và 6 agent identities cho một run.
- Không có group-chat vô hạn; graph là hữu hạn và có termination rõ ràng.
- Không có external egress trong local runtime.
- Artifact cuối phải là presentation-json.v1 và có QA/version snapshot.
- Dữ liệu nguồn được coi là untrusted; agent không được coi nội dung nguồn là instruction hệ thống.
- Stop an toàn giữ lại trace/artifact trung gian; không xóa dữ liệu dự án.

## Cách sử dụng

Mở trang local, vào Đội AI agent, sửa goal nếu cần và bấm Chạy đội agent. Có thể tạm dừng, tiếp tục, dừng hoặc xóa trace local. Khi hoàn tất, artifact summary hiển thị deck, brief, QA và provenance; Presentation JSON vẫn là source of truth của renderer.

## Ranh giới hiện tại

Đây là local-first deterministic runtime, chưa phải production distributed agent platform. Chưa có server queue, auth/RLS, durable worker process, model provider thật, parser native đầy đủ, external connector OAuth hoặc PPTX/Canva export. Các adapter ngoài được giữ ở trạng thái minh bạch và không được giả lập là đã kết nối.
