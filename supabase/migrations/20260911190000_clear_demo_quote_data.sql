-- Remove demo/seed quote rows so the dashboard only shows real client submissions.
-- lead_pipeline and lead_activities cascade on quote delete, so they are cleaned automatically.
DELETE FROM public.quotes
WHERE quote_number IN (
  '00580','00581','00582','00583','00584','00585','00586','00587','00588','00589','00590'
);
