
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS edit_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  ADD COLUMN IF NOT EXISTS is_qualified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS sales_rep_email text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS email_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS structure_type text,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS design_image text,
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- Storage buckets for designs and PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('designs', 'designs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('quotes-pdf', 'quotes-pdf', true) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to both buckets
CREATE POLICY "Public read designs" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'designs');
CREATE POLICY "Authenticated upload designs" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'designs');
CREATE POLICY "Public read quotes-pdf" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'quotes-pdf');
CREATE POLICY "Authenticated upload quotes-pdf" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'quotes-pdf');
