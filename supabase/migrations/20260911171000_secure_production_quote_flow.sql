CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP POLICY IF EXISTS "Allow all access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can select quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public read access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public update access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public delete access to quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow all select" ON public.quotes;
DROP POLICY IF EXISTS "Allow all insert" ON public.quotes;
DROP POLICY IF EXISTS "Allow all update" ON public.quotes;
DROP POLICY IF EXISTS "Allow all delete" ON public.quotes;

CREATE POLICY "Admins can select quotes" ON public.quotes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert quotes" ON public.quotes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update quotes" ON public.quotes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete quotes" ON public.quotes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow all select" ON public.lead_pipeline;
DROP POLICY IF EXISTS "Allow all insert" ON public.lead_pipeline;
DROP POLICY IF EXISTS "Allow all update" ON public.lead_pipeline;
DROP POLICY IF EXISTS "Allow all delete" ON public.lead_pipeline;

CREATE POLICY "Admins can select lead pipeline" ON public.lead_pipeline
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert lead pipeline" ON public.lead_pipeline
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lead pipeline" ON public.lead_pipeline
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lead pipeline" ON public.lead_pipeline
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow all select" ON public.lead_activities;
DROP POLICY IF EXISTS "Allow all insert" ON public.lead_activities;
DROP POLICY IF EXISTS "Allow all update" ON public.lead_activities;
DROP POLICY IF EXISTS "Allow all delete" ON public.lead_activities;

CREATE POLICY "Admins can select lead activities" ON public.lead_activities
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert lead activities" ON public.lead_activities
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lead activities" ON public.lead_activities
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lead activities" ON public.lead_activities
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.create_public_quote(payload jsonb)
RETURNS public.quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_quote public.quotes;
BEGIN
  INSERT INTO public.quotes (
    quote_number, customer_name, customer_email, customer_address, customer_phone,
    sales_rep, sales_rep_email, order_description, price, status, is_hot, is_viewed,
    is_sent, is_archived, is_draft, budget, timeline, email_consent, structure_type,
    dimensions, material, style, design_image, roof_type, panels, lighting, frame_color,
    roof_color, mounting, mounted_side, pergola_type, automation, louvered_angle,
    retractable_openness, notes, base_price, roof_price, panel_price, lighting_price,
    total_price
  )
  VALUES (
    payload->>'quote_number',
    payload->>'customer_name',
    payload->>'customer_email',
    payload->>'customer_address',
    payload->>'customer_phone',
    payload->>'sales_rep',
    payload->>'sales_rep_email',
    payload->>'order_description',
    COALESCE((payload->>'price')::numeric, 0),
    COALESCE(payload->>'status', 'Quote'),
    COALESCE((payload->>'is_hot')::boolean, false),
    COALESCE((payload->>'is_viewed')::boolean, false),
    COALESCE((payload->>'is_sent')::boolean, false),
    COALESCE((payload->>'is_archived')::boolean, false),
    COALESCE((payload->>'is_draft')::boolean, false),
    payload->>'budget',
    payload->>'timeline',
    COALESCE((payload->>'email_consent')::boolean, true),
    payload->>'structure_type',
    payload->>'dimensions',
    payload->>'material',
    payload->>'style',
    payload->>'design_image',
    payload->>'roof_type',
    payload->'panels',
    payload->'lighting',
    payload->>'frame_color',
    payload->>'roof_color',
    payload->>'mounting',
    payload->>'mounted_side',
    payload->>'pergola_type',
    payload->>'automation',
    (payload->>'louvered_angle')::numeric,
    (payload->>'retractable_openness')::numeric,
    payload->>'notes',
    COALESCE((payload->>'base_price')::numeric, 0),
    COALESCE((payload->>'roof_price')::numeric, 0),
    COALESCE((payload->>'panel_price')::numeric, 0),
    COALESCE((payload->>'lighting_price')::numeric, 0),
    COALESCE((payload->>'total_price')::numeric, 0)
  )
  RETURNING * INTO new_quote;

  INSERT INTO public.lead_pipeline (quote_id, stage, quote_expires_at)
  VALUES (new_quote.id, 'New', now() + interval '30 days')
  ON CONFLICT (quote_id) DO NOTHING;

  INSERT INTO public.lead_activities (quote_id, type, body)
  VALUES (new_quote.id, 'system', 'Quote request submitted from the website.');

  RETURN new_quote;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_quote_by_token(quote_id_input uuid, token_input text)
RETURNS public.quotes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.quotes
  WHERE id = quote_id_input
    AND edit_token = token_input
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.update_quote_by_token(quote_id_input uuid, token_input text, payload jsonb)
RETURNS public.quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_quote public.quotes;
BEGIN
  UPDATE public.quotes
  SET
    customer_name = COALESCE(payload->>'customer_name', customer_name),
    customer_email = COALESCE(payload->>'customer_email', customer_email),
    customer_address = COALESCE(payload->>'customer_address', customer_address),
    customer_phone = COALESCE(payload->>'customer_phone', customer_phone),
    order_description = COALESCE(payload->>'order_description', order_description),
    price = COALESCE((payload->>'price')::numeric, price),
    status = COALESCE(payload->>'status', status),
    is_qualified = COALESCE((payload->>'is_qualified')::boolean, is_qualified),
    budget = COALESCE(payload->>'budget', budget),
    timeline = COALESCE(payload->>'timeline', timeline),
    pdf_url = COALESCE(payload->>'pdf_url', pdf_url),
    structure_type = COALESCE(payload->>'structure_type', structure_type),
    dimensions = COALESCE(payload->>'dimensions', dimensions),
    material = COALESCE(payload->>'material', material),
    style = COALESCE(payload->>'style', style),
    design_image = COALESCE(payload->>'design_image', design_image),
    roof_type = COALESCE(payload->>'roof_type', roof_type),
    panels = COALESCE(payload->'panels', panels),
    lighting = COALESCE(payload->'lighting', lighting),
    frame_color = COALESCE(payload->>'frame_color', frame_color),
    roof_color = COALESCE(payload->>'roof_color', roof_color),
    mounting = COALESCE(payload->>'mounting', mounting),
    mounted_side = COALESCE(payload->>'mounted_side', mounted_side),
    pergola_type = COALESCE(payload->>'pergola_type', pergola_type),
    automation = COALESCE(payload->>'automation', automation),
    louvered_angle = COALESCE((payload->>'louvered_angle')::numeric, louvered_angle),
    retractable_openness = COALESCE((payload->>'retractable_openness')::numeric, retractable_openness),
    notes = COALESCE(payload->>'notes', notes),
    base_price = COALESCE((payload->>'base_price')::numeric, base_price),
    roof_price = COALESCE((payload->>'roof_price')::numeric, roof_price),
    panel_price = COALESCE((payload->>'panel_price')::numeric, panel_price),
    lighting_price = COALESCE((payload->>'lighting_price')::numeric, lighting_price),
    total_price = COALESCE((payload->>'total_price')::numeric, total_price),
    updated_at = now()
  WHERE id = quote_id_input
    AND edit_token = token_input
  RETURNING * INTO updated_quote;

  IF updated_quote.id IS NULL THEN
    RAISE EXCEPTION 'Quote not found or token invalid';
  END IF;

  RETURN updated_quote;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_quote(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_quote_by_token(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_quote_by_token(uuid, text, jsonb) TO anon, authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'neel@scaleaura.info'
ON CONFLICT (user_id, role) DO NOTHING;
