# Phase 1 Auth Workspace RLS

## Mục tiêu

Tạo boundary multi-tenant thật: authenticated user có profile, tạo workspace, thêm membership và chỉ đọc/sửa project thuộc workspace của mình.

## Đã triển khai trong repo

- Migration `supabase/migrations/0001_workspace_foundation.sql`.
- RLS contract test tĩnh và pgTAP smoke template.
- Role `user`, `manager`, `admin` ở workspace.
- Policies cho profiles, workspaces, workspace_members và projects.

## Chưa thể xác minh trong workspace hiện tại

- Chưa có Supabase development project, CLI hoặc database URL.
- Chưa chạy migration trên Postgres thật.
- Chưa chạy test hai user ở hai workspace và chưa nối browser auth.

## Acceptance bắt buộc trước khi gọi Phase 1 hoàn tất

1. Email/password hoặc magic-link auth hoạt động trên development project.
2. User tạo workspace và tự trở thành owner/member.
3. Hai user khác workspace không đọc/sửa project của nhau qua API trực tiếp.
4. Migration + RLS pgTAP pass bằng `supabase test db`.
5. Client không chứa service-role key.
6. Dashboard chỉ hiển thị project của workspace hiện hành.

## Cách tiếp tục khi có project

```bash
supabase link --project-ref <development-project-ref>
supabase db push
supabase test db
```

Không đi sang upload/AI trước khi cross-tenant test pass.
