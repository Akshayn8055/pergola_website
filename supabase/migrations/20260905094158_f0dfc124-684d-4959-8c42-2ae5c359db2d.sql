CREATE TABLE public.lead_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL UNIQUE REFERENCES public.quotes(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'New',
  assigned_to text,
  labels text[] NOT NULL DEFAULT '{}',
  next_call_at timestamptz,
  meeting_at timestamptz,
  quote_expires_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_pipeline TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_pipeline TO authenticated;
GRANT ALL ON public.lead_pipeline TO service_role;

ALTER TABLE public.lead_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON public.lead_pipeline FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert" ON public.lead_pipeline FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.lead_pipeline FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Allow all delete" ON public.lead_pipeline FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON public.lead_activities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert" ON public.lead_activities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.lead_activities FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Allow all delete" ON public.lead_activities FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX lead_activities_quote_id_idx ON public.lead_activities(quote_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lead_pipeline_updated_at
BEFORE UPDATE ON public.lead_pipeline
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();