-- Bypass RLS for setting max_tables: run as definer so it always works.
-- Run in Supabase Dashboard → SQL Editor (project cnuxtqfzumiracmxwdig).

-- Ensure table and row exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  max_tables smallint NOT NULL DEFAULT 10 CHECK (max_tables >= 1 AND max_tables <= 100)
);

INSERT INTO public.app_settings (id, max_tables) VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (keep existing policies for read/update if any)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Function runs with definer rights, so it bypasses RLS
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

-- Allow authenticated and anon to call (server action may use either)
GRANT EXECUTE ON FUNCTION public.set_app_max_tables(smallint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_app_max_tables(smallint) TO anon;

-- Optional: allow service role
GRANT EXECUTE ON FUNCTION public.set_app_max_tables(smallint) TO service_role;
