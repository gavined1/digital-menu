-- Allow authenticated users to read app_settings (dashboard loads as authenticated).
-- Without this, SELECT returns no rows and the UI shows default 10 instead of DB value.
DROP POLICY IF EXISTS "Authenticated can read app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can read app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (true);
