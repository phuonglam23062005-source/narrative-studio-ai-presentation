# ADR 001 Local First Release Boundary

## Decision

The first public deployment is a static, local-first application. Presentation JSON, source metadata, version snapshots, audit events and agent checkpoints persist in the browser only.

## Why

The supplied specification requires server-side authorization, durable queues, storage, encrypted OAuth tokens and RLS before claiming a multi-tenant production SaaS. Those services are not configured in this workspace. Shipping a static build with mock claims would be misleading and would weaken the security model.

## Consequences

- The deployed app is usable for private, browser-local presentation creation and editing.
- It does not upload documents, call paid AI, publish, share or connect Canva automatically.
- A future backend release must add auth, workspace RLS, secure storage, JobRunner and server-only provider adapters before enabling those controls.
