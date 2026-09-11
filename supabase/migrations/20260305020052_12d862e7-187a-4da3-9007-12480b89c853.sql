-- Allow public read access to quotes (temporary, for dev without auth)
CREATE POLICY "Public read access to quotes"
ON public.quotes FOR SELECT
TO anon
USING (true);

-- Allow public update access to quotes
CREATE POLICY "Public update access to quotes"
ON public.quotes FOR UPDATE
TO anon
USING (true);

-- Allow public delete access to quotes
CREATE POLICY "Public delete access to quotes"
ON public.quotes FOR DELETE
TO anon
USING (true);
