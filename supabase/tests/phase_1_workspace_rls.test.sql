-- Live database test template for Supabase's pgTAP runner.
-- Run only after applying the migration to a development project.
-- This file is intentionally separate from the static contract test because it
-- requires a real Postgres/Auth fixture and must never be mistaken for a live pass.

begin;

select plan(8);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'workspaces', 'workspaces exists');
select has_table('public', 'workspace_members', 'workspace_members exists');
select has_table('public', 'projects', 'projects exists');
select is((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), true, 'profiles RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.workspaces'::regclass), true, 'workspaces RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.workspace_members'::regclass), true, 'workspace_members RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.projects'::regclass), true, 'projects RLS enabled');

select * from finish();
rollback;
