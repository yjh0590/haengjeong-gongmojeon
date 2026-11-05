import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

const db = await PGlite.create();
let checks = 0;
const admin = "11111111-1111-4111-8111-111111111111";
const owner = "22222222-2222-4222-8222-222222222222";
const colleague = "33333333-3333-4333-8333-333333333333";
const outsider = "44444444-4444-4444-8444-444444444444";
async function identity(id, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || ""]);
  await db.exec(`set role ${role}`);
}
async function denied(action, pattern) { await assert.rejects(action, pattern); checks++; }
async function publish(storeId, key = randomUUID(), text = "A promotion", offset = 1) {
  const response = await db.query(`select public.itda_publish_owner_promotion($1,'Promotion',$2,'SNS','Script',
    (clock_timestamp() at time zone 'Asia/Seoul')::date + $3::integer,$4) as value`, [storeId, text, offset, key]);
  return response.rows[0].value;
}
async function quota(storeId) { return (await db.query("select public.itda_promotion_quota($1) as value", [storeId])).rows[0].value; }
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;`);
  for (const file of ["001_publication.sql", "002_owner_promotion_workflow.sql", "004_owner_self_publication.sql", "004_owner_self_publication.sql"]) {
    await db.exec(await readFile(new URL(`../supabase/${file}`, import.meta.url), "utf8"));
  }
  await db.query("insert into auth.users(id) select unnest($1::uuid[])", [[admin, owner, colleague, outsider]]);
  await db.query("insert into public.itda_admins values($1)", [admin]);
  await db.query("insert into public.itda_owner_stores values($1,1),($2,1),($2,2),($1,3)", [owner, colleague]);
  await db.exec(`insert into public.itda_publication(id,payload) values('main','{"stores":[{"id":1},{"id":2},{"id":3}]}');`);
  checks++;
  await identity(null, "anon");
  await denied(() => publish(1), /permission denied/);
  await identity(outsider);
  await denied(() => publish(1), /담당 점포/);
  await identity(owner);
  await denied(() => publish(2), /담당 점포/);
  await denied(() => quota(2), /담당 점포/);
  await denied(() => db.exec("select public.itda_set_promotion_policy(30,true)"), /관리자/);
  await denied(() => db.exec("insert into public.itda_promotion_requests(store_id,title,street_copy,ends_on) values(1,'Bypass','Bypass',current_date+1)"), /permission denied/);
  assert.equal((await db.exec("select * from public.itda_promotion_policy"))[0].rows.length, 0); checks++;
  const key = randomUUID();
  const first = await publish(1, key);
  assert.equal(first.remaining, 2); checks++;
  const retry = await publish(1, key);
  assert.equal(retry.id, first.id); assert.equal(retry.used, 1); checks++;
  await denied(() => publish(1, key, "Different content"), /다른 내용/);
  await identity(colleague);
  const second = await publish(1);
  const third = await publish(1);
  assert.equal(second.remaining, 1); assert.equal(third.remaining, 0); checks++;
  await denied(() => publish(1), /한도 3회/);
  const independent = await publish(2);
  assert.equal(independent.used, 1); checks++;
  await identity(owner);
  assert.equal((await quota(1)).used, 3); checks++;
  assert.equal((await publish(1, key)).id, first.id); checks++;
  await identity(null, "anon");
  const publicRows = await db.exec("select store_id,street_copy,ends_on,active from public.itda_live_promotions order by store_id");
  assert.equal(publicRows[0].rows.length, 2); checks++;
  await denied(() => db.exec("select request_id from public.itda_live_promotions"), /permission denied/);
  await denied(() => db.exec("select * from public.itda_promotion_requests"), /permission denied/);
  await identity(owner);
  await denied(() => db.query("select public.itda_withdraw_promotion($1)", [third.id]), /관리자/);
  await identity(admin);
  await db.query("select public.itda_withdraw_promotion($1)", [first.id]);
  assert.equal((await db.exec("select active from public.itda_live_promotions where store_id=1"))[0].rows[0].active, true); checks++;
  await db.query("select public.itda_withdraw_promotion($1)", [third.id]);
  assert.equal((await db.exec("select active from public.itda_live_promotions where store_id=1"))[0].rows[0].active, false); checks++;
  assert.equal((await quota(1)).used, 3); checks++;
  await db.exec("select public.itda_set_promotion_policy(4,true)");
  await identity(owner);
  const fourth = await publish(1);
  assert.equal(fourth.remaining, 0); checks++;
  await identity(admin);
  await db.exec("select public.itda_set_promotion_policy(5,false)");
  await identity(owner);
  await denied(() => publish(1), /일시 중지/);
  await identity(admin);
  await db.exec("select public.itda_set_promotion_policy(5,true)");
  await identity(owner);
  await denied(() => publish(1, randomUUID(), "A promotion", -1), /종료일/);
  await denied(() => publish(1, randomUUID(), "A promotion", 91), /종료일/);
  await denied(() => publish(1, randomUUID(), " "), /길이/);
  assert.equal((await quota(1)).used, 4); checks++;
  await db.exec("reset role");
  await db.query(`insert into public.itda_promotion_requests(user_id,store_id,title,street_copy,ends_on,status,publication_mode,posted_at)
    values($1,3,'Yesterday','Old',current_date+1,'withdrawn','self',date_trunc('day',clock_timestamp() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul' - interval '1 microsecond'),
      ($1,3,'Today','Current',current_date+1,'withdrawn','self',date_trunc('day',clock_timestamp() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')`, [owner]);
  await identity(owner);
  const boundary = await quota(3);
  assert.equal(boundary.used, 1); assert.equal(boundary.remaining, 4); checks++;
  const midnight = new Date(boundary.resets_at);
  assert.equal(midnight.getUTCHours(), 15); checks++;
  await db.exec("reset role");
  await db.exec(`update public.itda_publication set payload='{"stores":[{"id":1,"event":"Old admin draft"},{"id":3}]}';`);
  await identity(null, "anon");
  const surviving = (await db.exec("select store_id,street_copy,ends_on,active from public.itda_live_promotions"))[0].rows;
  assert.equal(surviving.length, 1); assert.equal(surviving[0].store_id, 1); checks++;

  const source = await readFile(new URL("../src/data/publicPromotions.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  const { applyPromotionOverrides, koreanDate } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
  const stores = [{id:1,event:"Old event",eventUntil:"2099-01-01"}];
  assert.equal(applyPromotionOverrides(stores,[{store_id:1,street_copy:"New",ends_on:"2099-01-01",active:true}],"2026-11-05")[0].event,"New"); checks++;
  assert.equal(applyPromotionOverrides(stores,[{store_id:1,street_copy:"New",ends_on:"2099-01-01",active:false}],"2026-11-05")[0].event,undefined); checks++;
  assert.equal(applyPromotionOverrides(stores,[{store_id:1,street_copy:"New",ends_on:"2026-11-04",active:true}],"2026-11-05")[0].event,undefined); checks++;
  assert.equal(koreanDate(new Date("2026-11-05T14:59:59Z")),"2026-11-05");
  assert.equal(koreanDate(new Date("2026-11-05T15:00:00Z")),"2026-11-06"); checks++;
  console.log(`Passed ${checks} PostgreSQL and publication checks (permissions, quotas, retries, KST reset, withdrawal, catalog overrides).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await db.close(); }
