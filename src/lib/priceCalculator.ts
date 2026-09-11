import { ConfiguratorState } from "@/types/configurator";
import { calculatePriceBreakdownWithConfig, type PricingConfig } from "./pricingConfig";

export interface PriceBreakdown {
  base_price: number;
  roof_price: number;
  panel_price: number;
  lighting_price: number;
  total_price: number;
}

export function calculatePriceBreakdown(state: ConfiguratorState, pricing?: PricingConfig): PriceBreakdown {
  return calculatePriceBreakdownWithConfig(state, pricing);
}
