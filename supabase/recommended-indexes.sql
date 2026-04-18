-- Recommended index for filtered menu lists: WHERE category_id = ? ORDER BY id ASC
-- (keyset pagination uses id). Apply via Supabase SQL editor or migrations.

create index if not exists menu_items_category_id_id_idx
  on public.menu_items (category_id, id);
