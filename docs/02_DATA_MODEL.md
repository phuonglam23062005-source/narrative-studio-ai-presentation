# Data model boundary

## Canonical browser payload

Project local giữ `brief`, `sources`, `sourceMap`, `theme`, `slides`, `qa`, `versions` và `audit`. Export chuyển thành `presentation-json.v1` với slide/element IDs ổn định, speaker notes và sourceRefs.

## Server target

Các bảng tenant tối thiểu: `profiles`, `workspaces`, `workspace_members`, `projects`, `source_files`, `source_chunks`, `source_refs`, `presentation_versions`, `ai_commands`, `jobs`, `audit_logs`, `credit_ledger`. Mọi bảng business có `workspace_id` hoặc liên kết tenant rõ ràng.

## Bất biến

Version immutable; restore tạo version mới; credit ledger append-only; schema change đi kèm migration, RLS policy và test isolation.
