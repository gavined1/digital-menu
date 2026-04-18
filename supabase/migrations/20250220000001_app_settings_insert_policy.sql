-- Allow authenticated users to insert the app_settings row (for upsert when row is missing).
-- Run this in Supabase Dashboard → SQL Editor.
drop policy if exists "Authenticated can insert app_settings" on public.app_settings;
create policy "Authenticated can insert app_settings"
  on public.app_settings for insert to authenticated
  with check (true);
