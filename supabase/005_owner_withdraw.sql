-- Apply after 004. Lets an owner stop a post for a store assigned to them;
-- administrators can still stop any post. Safe to run more than once.
begin;

create or replace function public.itda_withdraw_promotion(target_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare req public.itda_promotion_requests%rowtype;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  select * into req from public.itda_promotion_requests where id=target_request_id;
  -- One message for "missing" and "not yours", so other stores' posts cannot be probed.
  if not found or not (public.itda_is_admin() or exists (
    select 1 from public.itda_owner_stores o where o.user_id=auth.uid() and o.store_id=req.store_id
  )) then raise exception '담당 점포의 게시만 중단할 수 있습니다.'; end if;
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

revoke all on function public.itda_withdraw_promotion(uuid) from public,anon;
grant execute on function public.itda_withdraw_promotion(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
