import { supabase } from "@/integrations/supabase/client";
import type { ConfiguratorState, PanelType, RoofType } from "@/types/configurator";

export type PricingConfig = {
  pergolaMaterialPerSqm: Record<string, number>;
  deckMaterialPerSqm: Record<string, number>;
  roofPerSqm: Record<string, number>;
  panelPerLinearM: Record<string, number>;
  extras: Record<string, number>;
  railingPerLinearM: Record<string, number>;
  deckStairEach: number;
  elevatedDeckPerSqm: number;
  estimateMinMultiplier: number;
  estimateMaxMultiplier: number;
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  pergolaMaterialPerSqm: {
    wood: 260,
    aluminum: 340,
    composite: 300,
  },
  deckMaterialPerSqm: {
    wood: 180,
    aluminum: 260,
    composite: 220,
  },
  roofPerSqm: {
    open: 0,
    polycarbonate: 130,
    solid: 170,
    louvered: 290,
    "louvered-200": 330,
    retractable: 360,
    fabric: 260,
    insulated: 240,
    "non-insulated": 180,
  },
  panelPerLinearM: {
    open: 0,
    slatted: 110,
    "slats-wall": 120,
    glass: 220,
    privacy: 140,
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
    "blind-windsor": 220,
  },
  extras: {
    ledStrips: 400,
    spotlights: 300,
    ceilingFan: 350,
    heaters: 450,
  },
  railingPerLinearM: {
    aluminum: 120,
    glass: 220,
  },
  deckStairEach: 450,
  elevatedDeckPerSqm: 90,
  estimateMinMultiplier: 0.9,
  estimateMaxMultiplier: 1.25,
};

function mergePricingConfig(input: unknown): PricingConfig {
  const value = input && typeof input === "object" ? (input as Partial<PricingConfig>) : {};
  return {
    pergolaMaterialPerSqm: { ...DEFAULT_PRICING_CONFIG.pergolaMaterialPerSqm, ...(value.pergolaMaterialPerSqm || {}) },
    deckMaterialPerSqm: { ...DEFAULT_PRICING_CONFIG.deckMaterialPerSqm, ...(value.deckMaterialPerSqm || {}) },
    roofPerSqm: { ...DEFAULT_PRICING_CONFIG.roofPerSqm, ...(value.roofPerSqm || {}) },
    panelPerLinearM: { ...DEFAULT_PRICING_CONFIG.panelPerLinearM, ...(value.panelPerLinearM || {}) },
    extras: { ...DEFAULT_PRICING_CONFIG.extras, ...(value.extras || {}) },
    railingPerLinearM: { ...DEFAULT_PRICING_CONFIG.railingPerLinearM, ...(value.railingPerLinearM || {}) },
    deckStairEach: Number(value.deckStairEach ?? DEFAULT_PRICING_CONFIG.deckStairEach),
    elevatedDeckPerSqm: Number(value.elevatedDeckPerSqm ?? DEFAULT_PRICING_CONFIG.elevatedDeckPerSqm),
    estimateMinMultiplier: Number(value.estimateMinMultiplier ?? DEFAULT_PRICING_CONFIG.estimateMinMultiplier),
    estimateMaxMultiplier: Number(value.estimateMaxMultiplier ?? DEFAULT_PRICING_CONFIG.estimateMaxMultiplier),
  };
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const rpc = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: unknown }>)("get_pricing_config");
  if (rpc.error || !rpc.data) return DEFAULT_PRICING_CONFIG;
  return mergePricingConfig(rpc.data);
}

export async function savePricingConfig(config: PricingConfig): Promise<boolean> {
  const { error } = await (supabase.rpc as unknown as (
    fn: string,
    args: { payload: PricingConfig }
  ) => Promise<{ data: unknown; error: unknown }>)("save_pricing_config", { payload: config });
  if (error) {
    console.error("Failed to save pricing config:", error);
    return false;
  }
  return true;
}

const priceOf = (source: Record<string, number>, key: string | null | undefined) => source[key || ""] ?? 0;

export function calculatePriceBreakdownWithConfig(state: ConfiguratorState, pricing: PricingConfig = DEFAULT_PRICING_CONFIG) {
  let base_price = 0;
  let roof_price = 0;
  let panel_price = 0;
  let lighting_price = 0;

  if (state.structureType === "pergola" || state.structureType === "combo") {
    const { dimensions, material, roofType, panels, lighting } = state.pergola;
    const area = (dimensions.length / 1000) * (dimensions.width / 1000);

    base_price += area * priceOf(pricing.pergolaMaterialPerSqm, material);
    roof_price += area * priceOf(pricing.roofPerSqm, roofType as RoofType);

    Object.values(panels).forEach((panel) => {
      if (panel.enabled && panel.type !== "open") {
        const sideLength = panel.type.includes("left") || panel.type.includes("right") ? dimensions.width : dimensions.length;
        panel_price += (sideLength / 1000) * priceOf(pricing.panelPerLinearM, panel.type as PanelType);
      }
    });

    if (lighting.ledStrips) lighting_price += priceOf(pricing.extras, "ledStrips");
    if (lighting.spotlights) lighting_price += priceOf(pricing.extras, "spotlights");
    if (lighting.ceilingFan) lighting_price += priceOf(pricing.extras, "ceilingFan");
    if (lighting.heaters) lighting_price += priceOf(pricing.extras, "heaters");
  }

  if (state.structureType === "deck" || state.structureType === "combo") {
    const { dimensions, material, railingType, stairs, height } = state.deck;
    const area = (dimensions.length / 1000) * (dimensions.width / 1000);
    base_price += area * priceOf(pricing.deckMaterialPerSqm, material);
    if (railingType !== "none") {
      base_price += (((dimensions.length + dimensions.width) * 2) / 1000) * priceOf(pricing.railingPerLinearM, railingType);
    }
    base_price += Object.values(stairs).filter((stair) => stair.enabled).length * pricing.deckStairEach;
    if (height === "elevated") base_price += area * pricing.elevatedDeckPerSqm;
  }

  const total_price = base_price + roof_price + panel_price + lighting_price;

  return {
    base_price: Math.round(base_price),
    roof_price: Math.round(roof_price),
    panel_price: Math.round(panel_price),
    lighting_price: Math.round(lighting_price),
    total_price: Math.round(total_price),
  };
}

export function calculateEstimateRange(total: number, pricing: PricingConfig = DEFAULT_PRICING_CONFIG) {
  return {
    min: Math.round(total * pricing.estimateMinMultiplier),
    max: Math.round(total * pricing.estimateMaxMultiplier),
  };
}
