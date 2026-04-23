# Menu item images (Supabase Storage)

1. **Create the bucket** in [Supabase Dashboard](https://supabase.com/dashboard) → Storage → New bucket:
   - **Name:** `menu-items`
   - **Public bucket:** Yes (so the menu can display images)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`

2. **Apply RLS policies** in Dashboard → SQL Editor: run `migrations/20250220000000_create_menu_items_storage.sql` (authenticated upload/update/delete only; the bucket is created in step 1).  
3. Run **`migrations/20250224100000_security_advisor_rls_storage.sql`** if you previously added a public `SELECT` policy on `storage.objects` — it removes bucket-wide listing while keeping **public URL** access for a public bucket.

After this, the dashboard can upload menu item images to Supabase Storage.
