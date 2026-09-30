import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/migrations/0001_workspace_foundation.sql', import.meta.url), 'utf8');
const requiredTables = ['profiles', 'workspaces', 'workspace_members', 'projects'];
const missingTables = requiredTables.filter((table) => !migration.includes(`create table public.${table}`));
const missingRls = requiredTables.filter((table) => !migration.includes(`alter table public.${table} enable row level security`));
const missingPolicies = requiredTables.filter((table) => !new RegExp(`create policy [\\s\\S]+?on public\\.${table}\\s+for`, 'i').test(migration));
const unsafe = /create policy[\\s\\S]{0,500}?using\\s*\(\s*true\s*\)/i.test(migration);
const checks = {
  tables: missingTables.length === 0,
  rlsEnabled: missingRls.length === 0,
  policies: missingPolicies.length === 0,
  authUidBoundary: migration.includes('(select auth.uid())'),
  securityDefinerHelpers: migration.includes('security definer') && migration.includes('set search_path = public') && migration.includes('is_workspace_owner'),
  grantsRestricted: migration.includes('revoke all on table') && migration.includes('grant select, insert, update, delete on table public.projects to authenticated'),
  ownerImmutable: migration.includes('workspace owner is immutable'),
  noPublicAllowAllPolicy: !unsafe,
  liveTestTemplate: fs.existsSync(new URL('../supabase/tests/phase_1_workspace_rls.test.sql', import.meta.url))
};

if (missingTables.length || missingRls.length || missingPolicies.length || unsafe || Object.values(checks).some((value) => !value)) {
  console.error(JSON.stringify({ checks, missingTables, missingRls, missingPolicies, unsafe }, null, 2));
  process.exit(1);
}

console.log('RLS contract passed:', Object.keys(checks).length, 'static checks; live Supabase isolation remains unverified.');
