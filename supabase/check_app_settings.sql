-- Run in Supabase Dashboard → SQL Editor
-- Project: cnuxtqfzumiracmxwdig
-- URL: https://supabase.com/dashboard/project/cnuxtqfzumiracmxwdig/sql/new
--
-- This creates a function that sets max_tables and bypasses RLS (SECURITY DEFINER).
-- After running this, "Number of tables" Save in the dashboard will work.

-- Ensure table and row exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  max_tables smallint NOT NULL DEFAULT 10 CHECK (max_tables >= 1 AND max_tables <= 100)
);

INSERT INTO public.app_settings (id, max_tables) VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (dashboard loads as authenticated, so without this we get no row → default 10)
DROP POLICY IF EXISTS "Authenticated can read app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can read app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (id = 1);

-- Function runs with definer rights → bypasses RLS
CREATE OR REPLACE FUNCTION public.set_app_max_tables(n smallint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  n := GREATEST(1, LEAST(100, n));
  INSERT INTO public.app_settings (id, max_tables) VALUES (1, n)
  ON CONFLICT (id) DO UPDATE SET max_tables = EXCLUDED.max_tables;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_app_max_tables(smallint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_app_max_tables(smallint) TO anon;
GRANT EXECUTE ON FUNCTION public.set_app_max_tables(smallint) TO service_role;
