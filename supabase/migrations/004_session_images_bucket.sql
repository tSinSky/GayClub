-- 004_session_images_bucket.sql
-- Public bucket for inline images uploaded via the WYSIWYG editor in /admin.
-- Server actions use SUPABASE_SERVICE_ROLE_KEY (via createAdminClient), which
-- bypasses RLS, so we only need a public SELECT policy for readers.

insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', true)
on conflict (id) do nothing;

create policy "public can read session images"
  on storage.objects for select
  using (bucket_id = 'session-images');
