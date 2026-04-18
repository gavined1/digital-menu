# Menu item images (Supabase Storage)

1. **Create the bucket** in [Supabase Dashboard](https://supabase.com/dashboard) → Storage → New bucket:
   - **Name:** `menu-items`
   - **Public bucket:** Yes (so the menu can display images)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`

2. **Apply RLS policies** in Dashboard → SQL Editor: run the contents of `migrations/20250220000000_create_menu_items_storage.sql` (the policy statements only; the bucket is created in step 1).

After this, the dashboard can upload menu item images to Supabase Storage.
