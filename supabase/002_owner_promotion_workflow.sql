-- ITDA v4.5: owner -> administrator -> consumer, with database-enforced store ownership.
-- Run AFTER 001_publication.sql, in the Supabase project's SQL Editor.
-- Never put service_role / sb_secret credentials in the browser.

create table if not exists public.itda_owner_stores (
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id integer not null check (store_id > 0),
  primary key (user_id, store_id)
);

create table if not exists public.itda_promotion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  store_id integer not null check (store_id > 0),
  title text not null check (char_length(title) between 1 and 120),
  street_copy text not null check (char_length(street_copy) between 1 and 450),
  sns_copy text not null default '' check (char_length(sns_copy) <= 2000),
  short_script text not null default '' check (char_length(short_script) <= 2000),
  ends_on date not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists itda_promotion_requests_status_created
  on public.itda_promotion_requests(status, created_at desc);
create index if not exists itda_promotion_requests_owner_created
  on public.itda_promotion_requests(user_id, created_at desc);
-- One pending request per owner/store prevents accidental repeat submissions.
create unique index if not exists itda_one_pending_promotion_per_owner_store
  on public.itda_promotion_requests(user_id,store_id) where status='pending';

alter table public.itda_owner_stores enable row level security;
alter table public.itda_promotion_requests enable row level security;
revoke all on public.itda_owner_stores from public, anon, authenticated;
revoke all on public.itda_promotion_requests from public, anon, authenticated;
grant select on public.itda_owner_stores to authenticated;
grant select, insert on public.itda_promotion_requests to authenticated;
-- Do not grant update/delete of submissions to normal signed-in users.

create or replace function public.itda_is_admin()
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (select 1 from public.itda_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.itda_is_admin() from public, anon;
grant execute on function public.itda_is_admin() to authenticated;

drop policy if exists itda_owner_store_read on public.itda_owner_stores;
create policy itda_owner_store_read on public.itda_owner_stores
for select to authenticated
using (user_id = (select auth.uid()) or public.itda_is_admin());

drop policy if exists itda_promotion_read on public.itda_promotion_requests;
create policy itda_promotion_read on public.itda_promotion_requests
for select to authenticated
using (user_id = (select auth.uid()) or public.itda_is_admin());

drop policy if exists itda_promotion_submit on public.itda_promotion_requests;
create policy itda_promotion_submit on public.itda_promotion_requests
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and reviewed_at is null
  and reviewed_by is null
  and ends_on >= current_date
  and ends_on <= current_date + 90
  and exists (
    select 1 from public.itda_owner_stores owners
    where owners.user_id = (select auth.uid()) and owners.store_id = itda_promotion_requests.store_id
  )
  and exists (
    select 1 from public.itda_publication published,
         lateral jsonb_array_elements(published.payload->'stores') as store(entry)
    where published.id='main'
      and store.entry->>'id' = itda_promotion_requests.store_id::text
  )
);

-- Perform approval and published-store update in ONE transaction. No cross-client
-- local draft needs to be copied; new requests cannot overwrite other stores.
create or replace function public.itda_review_promotion(
  request_id uuid, approve boolean
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  req public.itda_promotion_requests%rowtype;
  catalog jsonb;
  target_idx integer;
  changed_at timestamptz := clock_timestamp();
begin
  if (select auth.uid()) is null or not public.itda_is_admin() then
    raise exception 'ITDA 관리자 권한이 필요합니다.';
  end if;

  select * into req from public.itda_promotion_requests where id=request_id for update;
  if not found then raise exception '제출 정보를 찾을 수 없습니다.'; end if;
  if req.status <> 'pending' then raise exception '이미 검토된 홍보안입니다.'; end if;

  if approve then
    if req.ends_on < current_date then
      raise exception '홍보 종료일이 지났습니다. 점주에게 새 홍보안을 요청하세요.';
    end if;
    select payload into catalog from public.itda_publication where id='main' for update;
    if catalog is null then raise exception '먼저 점포 목록을 전체 게시해 주세요.'; end if;
    select (store.ordinality - 1)::integer into target_idx
    from jsonb_array_elements(catalog->'stores') with ordinality as store(entry, ordinality)
    where store.entry->>'id' = req.store_id::text limit 1;
    if target_idx is null then raise exception '현재 공개 중인 점포 목록에 해당 가게가 없습니다.'; end if;

    catalog := jsonb_set(catalog, array['stores',target_idx::text,'event'], to_jsonb(req.street_copy),true);
    catalog := jsonb_set(catalog, array['stores',target_idx::text,'eventUntil'],to_jsonb(req.ends_on::text),true);
    update public.itda_publication set payload=catalog, published_at=changed_at where id='main';
  end if;

  update public.itda_promotion_requests
  set status=case when approve then 'approved' else 'rejected' end,
      reviewed_at=changed_at, reviewed_by=(select auth.uid())
  where id=request_id;
  return jsonb_build_object('id',request_id,'status',case when approve then 'approved' else 'rejected' end,'store_id',req.store_id);
end;
$$;
revoke all on function public.itda_review_promotion(uuid, boolean) from public, anon;
grant execute on function public.itda_review_promotion(uuid, boolean) to authenticated;

-- After making an invited owner account in Authentication -> Users,
-- assign ONLY its own store (example below, replace BOTH values):
-- insert into public.itda_owner_stores (user_id, store_id)
-- select id, 1 from auth.users where email='owner@example.com'
-- on conflict do nothing;
-- Store ID must match an ID in the already published store catalog.
