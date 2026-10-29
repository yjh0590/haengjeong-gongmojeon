-- ITDA v4 publication schema. Run once in Supabase SQL Editor as the project owner.
-- DO NOT expose service_role or sb_secret_* keys to the browser.

create table if not exists public.itda_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.itda_publication (
  id text primary key check (id = 'main'),
  payload jsonb not null,
  published_at timestamptz not null default now()
);

alter table public.itda_admins enable row level security;
alter table public.itda_publication enable row level security;

-- Explicit least privilege. Reject anonymous writes regardless of RLS policies.
revoke all on table public.itda_admins from anon, authenticated;
revoke all on table public.itda_publication from anon, authenticated;
grant select on table public.itda_admins to authenticated;
grant select on table public.itda_publication to anon, authenticated;
grant insert, update on table public.itda_publication to authenticated;

-- A signed-in user can only see whether their own account is an administrator.
drop policy if exists "itda_admin_read_self" on public.itda_admins;
create policy "itda_admin_read_self"
on public.itda_admins for select to authenticated
using (user_id = (select auth.uid()));

-- Only the published catalog, not unpublished drafts, is present in this table.
drop policy if exists "itda_public_read" on public.itda_publication;
create policy "itda_public_read"
on public.itda_publication for select to anon, authenticated
using (true);

drop policy if exists "itda_admin_insert" on public.itda_publication;
create policy "itda_admin_insert"
on public.itda_publication for insert to authenticated
with check (exists (
  select 1 from public.itda_admins where user_id = (select auth.uid())
));

drop policy if exists "itda_admin_update" on public.itda_publication;
create policy "itda_admin_update"
on public.itda_publication for update to authenticated
using (exists (
  select 1 from public.itda_admins where user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.itda_admins where user_id = (select auth.uid())
));

-- AFTER creating a Supabase Auth user (Authentication -> Users),
-- register only your own trusted admin email via the SQL Editor:
-- insert into public.itda_admins(user_id)
-- select id from auth.users where email = 'your-admin-email@example.com'
-- on conflict (user_id) do nothing;
-- Replace the example email first. Never place an email/password inside source code.
