GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_pipeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;

GRANT ALL ON public.quotes TO service_role;
GRANT ALL ON public.lead_pipeline TO service_role;
GRANT ALL ON public.lead_activities TO service_role;
