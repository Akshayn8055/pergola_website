
-- Drop all existing policies on quotes
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can select quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public read access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public update access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public delete access to quotes" ON public.quotes;

-- Create permissive policies for full public access (dev mode)
CREATE POLICY "Allow all select" ON public.quotes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert" ON public.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.quotes FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Allow all delete" ON public.quotes FOR DELETE TO anon, authenticated USING (true);
