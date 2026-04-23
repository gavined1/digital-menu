-- Harden RLS for Supabase security advisors:
-- 0024_permissive_rls_policy (writes must not use bare TRUE)
-- 0025_public_bucket_allows_listing (drop broad public SELECT on storage.objects)
--
-- Apply in SQL Editor or via CLI after earlier migrations.
-- Safe to re-run: DROP POLICY IF EXISTS then CREATE.

-- ---------------------------------------------------------------------------
-- public.app_settings (singleton: id = 1)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can insert app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can insert app_settings"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (id = 1);

DROP POLICY IF EXISTS "Authenticated can update app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can update app_settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (id = 1)
  WITH CHECK (id = 1);

DROP POLICY IF EXISTS "Authenticated can read app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can read app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (id = 1);

-- ---------------------------------------------------------------------------
-- public.hero_section (singleton: id = 1)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can update hero_section" ON public.hero_section;
CREATE POLICY "Authenticated can update hero_section"
  ON public.hero_section FOR UPDATE TO authenticated
  USING (id = 1)
  WITH CHECK (id = 1);

-- ---------------------------------------------------------------------------
-- public.categories / public.menu_items
-- Schema has no per-user ownership; require a real JWT (not bare TRUE).
-- Uses (select auth.uid()) for stable initplan (see advisor 0003).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can insert categories" ON public.categories;
CREATE POLICY "Authenticated can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can update categories" ON public.categories;
CREATE POLICY "Authenticated can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can delete categories" ON public.categories;
CREATE POLICY "Authenticated can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert menu_items" ON public.menu_items;
CREATE POLICY "Authenticated can insert menu_items"
  ON public.menu_items FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can update menu_items" ON public.menu_items;
CREATE POLICY "Authenticated can update menu_items"
  ON public.menu_items FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can delete menu_items" ON public.menu_items;
CREATE POLICY "Authenticated can delete menu_items"
  ON public.menu_items FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ---------------------------------------------------------------------------
-- storage: public bucket object URLs work without a blanket SELECT policy;
-- that policy allowed listing all object names (advisor 0025).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read menu item images" ON storage.objects;
