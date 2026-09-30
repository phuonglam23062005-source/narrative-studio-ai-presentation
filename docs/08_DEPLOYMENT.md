# Deployment

Static build hiện tại có thể preview trên một static host. `npm run build` tạo `dist/`; Vercel config chỉ phục vụ asset tĩnh. Không dùng deployment này để suy ra auth, backend hoặc production SaaS readiness.

Mục tiêu sau: local → preview/staging → production, secrets tách theo environment, migration review/reversible khi có thể, rollback và production smoke test.
