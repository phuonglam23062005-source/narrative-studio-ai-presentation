-- Phase 1 foundation. Apply only to a Supabase development project first.
-- The browser must use the publishable/anon key; service_role stays server-side.

create extension if not exists pgcrypto;

create type public.workspace_role as enum ('user', 'manager', 'admin');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'vi' check (locale in ('vi', 'en')),
  system_role public.workspace_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 200),
  language text not null default 'vi' check (language in ('vi', 'en')),
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'archived')),
  presentation jsonb,
  schema_version text not null default 'presentation-json.v1',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index workspace_members_user_idx on public.workspace_members(user_id);
create index projects_workspace_idx on public.projects(workspace_id, updated_at desc);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role = any(allowed_roles)
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_id = (select auth.uid())
  );
$$;

create or replace function public.prevent_workspace_owner_change()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'workspace owner is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'vi')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute procedure public.set_updated_at();

create trigger workspaces_owner_immutable
  before update on public.workspaces
  for each row execute procedure public.prevent_workspace_owner_change();

create trigger workspace_members_set_updated_at
  before update on public.workspace_members
  for each row execute procedure public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;

revoke all on table public.profiles, public.workspaces, public.workspace_members, public.projects from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy workspaces_select_member
  on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));

create policy workspaces_insert_owner
  on public.workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy workspaces_update_manager
  on public.workspaces for update to authenticated
  using (public.has_workspace_role(id, array['manager', 'admin']::public.workspace_role[]))
  with check (owner_id is not null);

create policy workspaces_delete_owner
  on public.workspaces for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy workspace_members_select_member
  on public.workspace_members for select to authenticated
  using (user_id = (select auth.uid()) or public.has_workspace_role(workspace_id, array['manager', 'admin']::public.workspace_role[]));

create policy workspace_members_insert_self_or_manager
  on public.workspace_members for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and public.is_workspace_owner(workspace_id))
    or public.has_workspace_role(workspace_id, array['manager', 'admin']::public.workspace_role[])
  );

create policy workspace_members_update_manager
  on public.workspace_members for update to authenticated
  using (public.has_workspace_role(workspace_id, array['manager', 'admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['manager', 'admin']::public.workspace_role[]));

create policy workspace_members_delete_manager
  on public.workspace_members for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['manager', 'admin']::public.workspace_role[]));

create policy projects_select_member
  on public.projects for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy projects_insert_member
  on public.projects for insert to authenticated
  with check (created_by = (select auth.uid()) and public.is_workspace_member(workspace_id));

create policy projects_update_member
  on public.projects for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy projects_delete_member
  on public.projects for delete to authenticated
  using (public.is_workspace_member(workspace_id));
