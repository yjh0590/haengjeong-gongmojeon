-- Apply after 001, 002 and 003. Owner self-publication, three posts/store/KST day.
-- All writes pass through authenticated RPCs; browser clocks/counters are not trusted.
begin;

alter table public.itda_promotion_requests
  drop constraint if exists itda_promotion_requests_status_check;
alter table public.itda_promotion_requests
  add constraint itda_promotion_requests_status_check
  check (status in ('pending','approved','rejected','published','superseded','withdrawn'));
alter table public.itda_promotion_requests
  add column if not exists publication_mode text not null default 'legacy',
  add column if not exists posted_at timestamptz,
  add column if not exists client_request_id uuid;
create unique index if not exists itda_promotion_idempotency
  on public.itda_promotion_requests(user_id,client_request_id)
  where client_request_id is not null;
create index if not exists itda_promotion_daily_usage
  on public.itda_promotion_requests(store_id,posted_at)
  where publication_mode='self';

create table if not exists public.itda_promotion_policy (
  id text primary key default 'main' check (id='main'),
  daily_limit integer not null default 3 check (daily_limit between 1 and 30),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.itda_promotion_policy(id) values ('main') on conflict do nothing;

-- Separate overrides survive an administrator republishing an older catalog draft.
-- An inactive row is a tombstone: withdrawing a post must not revive an old event.
create table if not exists public.itda_live_promotions (
  store_id integer primary key check (store_id>0),
  request_id uuid not null references public.itda_promotion_requests(id),
  street_copy text not null check (char_length(street_copy) between 1 and 450),
  ends_on date not null,
  active boolean not null default true
);
alter table public.itda_promotion_policy enable row level security;
alter table public.itda_live_promotions enable row level security;
revoke all on public.itda_promotion_policy from public, anon, authenticated;
revoke all on public.itda_live_promotions from public, anon, authenticated;
grant select on public.itda_promotion_policy to authenticated;
grant select(store_id,street_copy,ends_on,active) on public.itda_live_promotions to anon, authenticated;
drop policy if exists itda_policy_admin_read on public.itda_promotion_policy;
create policy itda_policy_admin_read on public.itda_promotion_policy
  for select to authenticated using (public.itda_is_admin());
drop policy if exists itda_live_promotion_read on public.itda_live_promotions;
create policy itda_live_promotion_read on public.itda_live_promotions
  for select to anon, authenticated using (exists (
    select 1 from public.itda_publication p,
    lateral jsonb_array_elements(p.payload->'stores') s(entry)
    where p.id='main' and s.entry->>'id'=store_id::text
  ));

-- Retire the old pending-request entry point, including old browser clients.
drop policy if exists itda_promotion_submit on public.itda_promotion_requests;
revoke insert,update,delete on public.itda_promotion_requests from anon,authenticated;
revoke all on function public.itda_review_promotion(uuid,boolean) from public,anon,authenticated;

create or replace function public.itda_promotion_quota(target_store_id integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  policy public.itda_promotion_policy%rowtype;
  day date := (clock_timestamp() at time zone 'Asia/Seoul')::date;
  used integer;
begin
  if auth.uid() is null or not (public.itda_is_admin() or exists (
    select 1 from public.itda_owner_stores o where o.user_id=auth.uid() and o.store_id=target_store_id
  )) then raise exception '담당 점포의 게시 횟수만 확인할 수 있습니다.'; end if;
  select * into strict policy from public.itda_promotion_policy where id='main';
  select count(*)::integer into used from public.itda_promotion_requests r
    where r.store_id=target_store_id and r.publication_mode='self'
      and r.posted_at >= (day::timestamp at time zone 'Asia/Seoul')
      and r.posted_at < ((day+1)::timestamp at time zone 'Asia/Seoul');
  return jsonb_build_object('store_id',target_store_id,'daily_limit',policy.daily_limit,
    'used',used,'remaining',greatest(0,policy.daily_limit-used),'enabled',policy.enabled,
    'quota_date',day,'resets_at',((day+1)::timestamp at time zone 'Asia/Seoul'));
end;
$$;

create or replace function public.itda_publish_owner_promotion(
  target_store_id integer, promotion_title text, street_text text,
  sns_text text, script_text text, end_date date, request_key uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  policy public.itda_promotion_policy%rowtype;
  previous public.itda_promotion_requests%rowtype;
  created public.itda_promotion_requests%rowtype;
  day date;
  posted_now timestamptz;
  used integer;
  catalog jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.itda_owner_stores o where o.user_id=auth.uid() and o.store_id=target_store_id
  ) then raise exception '담당 점포로 인증한 점주만 게시할 수 있습니다.'; end if;
  if request_key is null then raise exception '게시 요청 식별자가 필요합니다.'; end if;

  -- One transaction per store, shared by EVERY owner account for that store.
  perform pg_advisory_xact_lock(731004,target_store_id);
  select * into previous from public.itda_promotion_requests
    where user_id=auth.uid() and client_request_id=request_key;
  if found then
    if previous.store_id<>target_store_id or previous.title is distinct from btrim(promotion_title)
      or previous.street_copy is distinct from btrim(street_text)
      or previous.sns_copy is distinct from coalesce(sns_text,'')
      or previous.short_script is distinct from coalesce(script_text,'')
      or previous.ends_on is distinct from end_date then
      raise exception '같은 요청 식별자로 다른 내용을 게시할 수 없습니다.';
    end if;
    return public.itda_promotion_quota(target_store_id)
      || jsonb_build_object('id',previous.id,'status',previous.status,'duplicate',true);
  end if;
  select * into strict policy from public.itda_promotion_policy where id='main' for share;
  if not policy.enabled then raise exception '점주 직접 게시가 일시 중지되었습니다.'; end if;
  if promotion_title is null or char_length(btrim(promotion_title)) not between 1 and 120
    or street_text is null or char_length(btrim(street_text)) not between 1 and 450
    or char_length(coalesce(sns_text,''))>2000 or char_length(coalesce(script_text,''))>2000 then
    raise exception '홍보 제목과 문구의 길이를 확인해 주세요.';
  end if;
  select payload into catalog from public.itda_publication where id='main' for share;
  if catalog is null or not exists (
    select 1 from jsonb_array_elements(catalog->'stores') s(entry)
    where s.entry->>'id'=target_store_id::text
  ) then raise exception '현재 공개된 점포 목록에 해당 가게가 없습니다.'; end if;
  posted_now := clock_timestamp();
  day := (posted_now at time zone 'Asia/Seoul')::date;
  if end_date is null or end_date<day or end_date>day+90 then
    raise exception '종료일은 한국시간 오늘부터 90일 이내로 지정해 주세요.';
  end if;
  select count(*)::integer into used from public.itda_promotion_requests r
    where r.store_id=target_store_id and r.publication_mode='self'
      and r.posted_at >= (day::timestamp at time zone 'Asia/Seoul')
      and r.posted_at < ((day+1)::timestamp at time zone 'Asia/Seoul');
  if used>=policy.daily_limit then
    raise exception '오늘 게시 한도 %회를 모두 사용했습니다. 한국시간 자정 이후 다시 이용해 주세요.',policy.daily_limit;
  end if;

  insert into public.itda_promotion_requests(user_id,store_id,title,street_copy,sns_copy,
    short_script,ends_on,status,publication_mode,posted_at,client_request_id)
    values(auth.uid(),target_store_id,btrim(promotion_title),btrim(street_text),coalesce(sns_text,''),
      coalesce(script_text,''),end_date,'published','self',posted_now,request_key)
    returning * into created;
  update public.itda_promotion_requests set status='superseded'
    where id in (select request_id from public.itda_live_promotions where store_id=target_store_id)
      and status='published';
  insert into public.itda_live_promotions(store_id,request_id,street_copy,ends_on,active)
    values(target_store_id,created.id,created.street_copy,end_date,true)
    on conflict(store_id) do update set request_id=excluded.request_id,
      street_copy=excluded.street_copy,ends_on=excluded.ends_on,active=true;
  return jsonb_build_object('id',created.id,'status','published','duplicate',false,
    'store_id',target_store_id,'daily_limit',policy.daily_limit,'used',used+1,
    'remaining',greatest(0,policy.daily_limit-used-1),'enabled',policy.enabled,
    'quota_date',day,'resets_at',((day+1)::timestamp at time zone 'Asia/Seoul'));
end;
$$;

create or replace function public.itda_set_promotion_policy(new_daily_limit integer, publishing_enabled boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.itda_is_admin() then raise exception '관리자 권한이 필요합니다.'; end if;
  if new_daily_limit is null or new_daily_limit not between 1 and 30 or publishing_enabled is null then
    raise exception '게시 한도는 하루 1~30회로 지정해 주세요.';
  end if;
  update public.itda_promotion_policy set daily_limit=new_daily_limit,enabled=publishing_enabled,
    updated_at=clock_timestamp(),updated_by=auth.uid() where id='main';
  return jsonb_build_object('daily_limit',new_daily_limit,'enabled',publishing_enabled);
end;
$$;

create or replace function public.itda_withdraw_promotion(target_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare req public.itda_promotion_requests%rowtype;
begin
  if auth.uid() is null or not public.itda_is_admin() then raise exception '관리자 권한이 필요합니다.'; end if;
  select * into req from public.itda_promotion_requests where id=target_request_id;
  if not found then raise exception '게시 내역을 찾을 수 없습니다.'; end if;
  perform pg_advisory_xact_lock(731004,req.store_id);
  select * into req from public.itda_promotion_requests where id=target_request_id for update;
  -- An older history entry must never remove a newer live post for the same store.
  update public.itda_live_promotions set active=false
    where store_id=req.store_id and request_id=req.id;
  update public.itda_promotion_requests set status='withdrawn',reviewed_at=clock_timestamp(),reviewed_by=auth.uid()
    where id=req.id and status in ('published','superseded','pending');
  return jsonb_build_object('id',req.id,'status','withdrawn');
end;
$$;

revoke all on function public.itda_promotion_quota(integer) from public,anon;
revoke all on function public.itda_publish_owner_promotion(integer,text,text,text,text,date,uuid) from public,anon;
revoke all on function public.itda_set_promotion_policy(integer,boolean) from public,anon;
revoke all on function public.itda_withdraw_promotion(uuid) from public,anon;
grant execute on function public.itda_promotion_quota(integer) to authenticated;
grant execute on function public.itda_publish_owner_promotion(integer,text,text,text,text,date,uuid) to authenticated;
grant execute on function public.itda_set_promotion_policy(integer,boolean) to authenticated;
grant execute on function public.itda_withdraw_promotion(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
