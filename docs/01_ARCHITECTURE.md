# Architecture

## Hiện tại

Static browser runtime gồm project state, source metadata, version graph, local deterministic agent và renderer. `docs/presentation.schema.json` định nghĩa payload export `presentation-json.v1`; DOM chỉ là projection.

## Đích đến

Next.js/TypeScript frontend, server-only provider adapters, Supabase Postgres/Auth/RLS, object storage adapter, durable JobRunner, Presentation JSON domain package và exporter dùng chung. Gemini/Gemini-compatible provider, Canva và payment phải nằm sau interface có fake implementation.

## Luồng canonical

`source files → source map → adaptive interview → approved brief → storyboard → presentation JSON → editor/PPTX/Canva`.

AI edit đi theo `command → validated patch → preview → snapshot → apply → QA → new version`.

## Giới hạn phase 0

Không thêm dependency provider hoặc backend khi chưa có credentials và integration test. Local fallback phải giữ được dữ liệu và hiển thị capability truthfully.
