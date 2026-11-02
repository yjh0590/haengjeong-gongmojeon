-- ITDA v4.9 photo uploads. Run in Supabase SQL Editor as project owner.
-- Prerequisite: 001_publication.sql and an authenticated admin in public.itda_admins.
-- IMPORTANT: objects in this bucket are publicly readable by their URLs as soon as uploaded.
-- Never upload private data, faces/plates that should be blurred, or unlicensed map imagery.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('itda-media', 'itda-media', true, 20971520, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only users registered in itda_admins can write to the public media bucket.
drop policy if exists "itda_media_admin_insert" on storage.objects;
create policy "itda_media_admin_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'itda-media'
  and (name like 'maps/%' or name like 'street/%')
  and exists (select 1 from public.itda_admins a where a.user_id = (select auth.uid()))
);

-- Do not enable client overwrite/delete: a live publication might reference older assets.
-- Admin uploads use unique object names. Old objects stay until separately cleaned up.
