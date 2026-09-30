# Product lock

AI Presentation Platform là một workspace SaaS tạo và chỉnh presentation, không phải công cụ text-to-PPTX đơn giản. Tiếng Việt là mặc định; file người dùng là nguồn mặc định; web research phải được bật rõ ràng.

Presentation JSON là source of truth. AI chỉ tạo brief, storyboard, content, visual intent hoặc structured patch. Renderer, editor, exporter và integration dùng cùng contract đó.

Mọi AI mutation phải có scope, base version, preview và immutable snapshot trước khi apply. Nguồn file là untrusted data, không phải instruction. External publish, upload, sharing, Canva và automation chỉ chạy khi adapter được xác minh và người dùng chủ động xác nhận.

Bản hiện tại là local-first. Chưa tuyên bố auth, RLS, provider AI thật, object storage, PPTX editable, Canva hoặc billing hoạt động.
