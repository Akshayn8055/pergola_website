CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can delete app settings" ON public.app_settings;

CREATE POLICY "Admins can select app settings" ON public.app_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert app settings" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update app settings" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete app settings" ON public.app_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER set_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value)
VALUES (
  'pricing_config',
  '{
    "pergolaMaterialPerSqm": { "wood": 260, "aluminum": 340, "composite": 300 },
    "deckMaterialPerSqm": { "wood": 180, "aluminum": 260, "composite": 220 },
    "roofPerSqm": {
      "open": 0,
      "polycarbonate": 130,
      "solid": 170,
      "louvered": 290,
      "louvered-200": 330,
      "retractable": 360,
      "fabric": 260,
      "insulated": 240,
      "non-insulated": 180
    },
    "panelPerLinearM": {
      "open": 0,
      "slatted": 110,
      "slats-wall": 120,
      "glass": 220,
      "privacy": 140,
      "sliding-glass": 280,
      "sliding-glass-door": 360,
      "guillotine-glass": 420,
      "fixed-glass-wall": 300,
      "panelink-full": 260,
      "panelink-dwarf": 190,
      "dwarf-windows": 280,
      "stacker-glass": 380,
      "outdoor-blind": 160,
      "blind-regent": 190,
      "blind-windsor": 220
    },
    "extras": { "ledStrips": 400, "spotlights": 300, "ceilingFan": 350, "heaters": 450 },
    "railingPerLinearM": { "aluminum": 120, "glass": 220 },
    "deckStairEach": 450,
    "elevatedDeckPerSqm": 90,
    "estimateMinMultiplier": 0.9,
    "estimateMaxMultiplier": 1.25
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_pricing_config()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value
  FROM public.app_settings
  WHERE key = 'pricing_config'
$$;

CREATE OR REPLACE FUNCTION public.save_pricing_config(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update pricing settings';
  END IF;

  INSERT INTO public.app_settings (key, value)
  VALUES ('pricing_config', payload)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value;

  RETURN payload;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pricing_config() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_pricing_config(jsonb) TO authenticated;
