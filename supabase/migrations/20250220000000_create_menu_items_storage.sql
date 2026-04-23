-- Menu item images: create bucket "menu-items" in Dashboard (Storage → New bucket)
-- Name: menu-items, Public: yes, File size limit: 5MB, Allowed MIME: image/jpeg, image/png, image/gif, image/webp
-- Then run the policies below in SQL Editor.

-- RLS: allow authenticated users to upload, update, delete
create policy "Authenticated can upload menu item images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-items');

create policy "Authenticated can update menu item images"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-items');

create policy "Authenticated can delete menu item images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-items');

-- Public URLs for a public bucket do not require a SELECT policy on storage.objects.
-- A broad SELECT here enables listing all objects (Supabase advisor 0025). See migration 20250224100000.
