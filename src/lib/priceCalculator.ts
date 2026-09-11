import { ConfiguratorState } from "@/types/configurator";

export interface PriceBreakdown {
  base_price: number;
  roof_price: number;
  panel_price: number;
  lighting_price: number;
  total_price: number;
}

export function calculatePriceBreakdown(state: ConfiguratorState): PriceBreakdown {
  let base_price = 0;
  let roof_price = 0;
  let panel_price = 0;
  let lighting_price = 0;

  if (state.structureType === "pergola" || state.structureType === "combo") {
    const { dimensions, material, roofType, panels, lighting } = state.pergola;
    const area = (dimensions.length / 1000) * (dimensions.width / 1000);

    const materialPrices = { wood: 180, aluminum: 280, composite: 220 };
    base_price += area * materialPrices[material];

    const roofPrices = { open: 0, polycarbonate: 80, solid: 120, louvered: 200, retractable: 250, fabric: 250 };
    roof_price += area * roofPrices[roofType];

    Object.values(panels).forEach((panel) => {
      if (panel.enabled && panel.type !== "open") {
        const panelPrices = { slatted: 60, glass: 150, privacy: 80, open: 0, "sliding-glass": 220 };
        panel_price += (dimensions.length / 1000) * (panelPrices[panel.type] || 0);
      }
    });

    if (lighting.ledStrips) lighting_price += 120;
    if (lighting.spotlights) lighting_price += 80;
    if (lighting.ceilingFan) lighting_price += 150;
    if (lighting.heaters) lighting_price += 200;
  }

  if (state.structureType === "deck" || state.structureType === "combo") {
    const { dimensions, material, railingType, stairs, height } = state.deck;
    const area = (dimensions.length / 1000) * (dimensions.width / 1000);
    const materialPrices = { wood: 120, aluminum: 200, composite: 160 };
    base_price += area * materialPrices[material];
    if (railingType !== "none") base_price += ((dimensions.length + dimensions.width) * 2 / 1000) * (railingType === "glass" ? 140 : 75);
    base_price += Object.values(stairs).filter((stair) => stair.enabled).length * 350;
    if (height === "elevated") base_price += area * 60;
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
