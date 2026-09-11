import { useState, useCallback } from 'react';
import {
  ConfiguratorState,
  StructureType,
  PergolaConfig,
  DeckConfig,
  DEFAULT_PERGOLA_CONFIG,
  DEFAULT_DECK_CONFIG,
  CONFIGURATOR_STEPS,
} from '@/types/configurator';
import { type Quote } from '@/lib/quotesStore';

const calculatePrice = (state: ConfiguratorState): { min: number; max: number } => {
  let basePrice = 0;
  let maxMultiplier = 1.25;

  if (state.structureType === 'pergola' || state.structureType === 'combo') {
    const { dimensions, material, roofType, panels, lighting } = state.pergola;
    const area = (dimensions.length / 1000) * (dimensions.width / 1000);
    const materialPrices = { wood: 180, aluminum: 280, composite: 220 };
    basePrice += area * materialPrices[material];
    const roofPrices = { open: 0, polycarbonate: 80, solid: 120, louvered: 200, retractable: 250, fabric: 250 };
    basePrice += area * roofPrices[roofType];
    Object.values(panels).forEach(panel => {
      if (panel.enabled && panel.type !== 'open') {
        const panelPrices = { slatted: 60, glass: 150, privacy: 80, open: 0, 'sliding-glass': 220 };
        basePrice += (dimensions.length / 1000) * panelPrices[panel.type];
      }
    });
    if (lighting.ledStrips) basePrice += 120;
    if (lighting.spotlights) basePrice += 80;
    if (lighting.ceilingFan) basePrice += 150;
    if (lighting.heaters) basePrice += 200;
  }

  if (state.structureType === 'deck' || state.structureType === 'combo') {
    const { dimensions, material, railingType, stairs, height } = state.deck;
    const area = (dimensions.length / 1000) * (dimensions.width / 1000);
    const materialPrices = { wood: 120, aluminum: 200, composite: 160 };
    basePrice += area * materialPrices[material];
    if (railingType !== 'none') basePrice += ((dimensions.length + dimensions.width) * 2 / 1000) * (railingType === 'glass' ? 140 : 75);
    basePrice += Object.values(stairs).filter((stair) => stair.enabled).length * 350;
    if (height === 'elevated') basePrice += area * 60;
  }

  return {
    min: Math.round(basePrice * 0.9),
    max: Math.round(basePrice * maxMultiplier),
  };
};

export const useConfigurator = () => {
  const [state, setState] = useState<ConfiguratorState>({
    structureType: null,
    currentStep: 0,
    pergola: DEFAULT_PERGOLA_CONFIG,
    deck: DEFAULT_DECK_CONFIG,
    includeDeck: false,
    estimatedPrice: { min: 0, max: 0 },
  });

  const setStructureType = useCallback((type: StructureType) => {
    setState(prev => {
      const newState = {
        ...prev,
        structureType: type,
        includeDeck: type === 'combo' || type === 'deck',
        currentStep: 1,
      };
      return { ...newState, estimatedPrice: calculatePrice(newState) };
    });
  }, []);

  const updatePergola = useCallback((updates: Partial<PergolaConfig>) => {
    setState(prev => {
      const newState = { ...prev, pergola: { ...prev.pergola, ...updates } };
      return { ...newState, estimatedPrice: calculatePrice(newState) };
    });
  }, []);

  const updateDeck = useCallback((updates: Partial<DeckConfig>) => {
    setState(prev => {
      const newState = { ...prev, deck: { ...prev.deck, ...updates } };
      return { ...newState, estimatedPrice: calculatePrice(newState) };
    });
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, CONFIGURATOR_STEPS.length - 1),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  const toggleDeck = useCallback((include: boolean) => {
    setState(prev => {
      const newState = { ...prev, includeDeck: include };
      return { ...newState, estimatedPrice: calculatePrice(newState) };
    });
  }, []);

  const resetConfigurator = useCallback(() => {
    setState({
      structureType: null,
      currentStep: 0,
      pergola: DEFAULT_PERGOLA_CONFIG,
      deck: DEFAULT_DECK_CONFIG,
      includeDeck: false,
      estimatedPrice: { min: 0, max: 0 },
    });
  }, []);

  const loadFromQuote = useCallback((quote: Quote) => {
    // Parse dimensions string back to numbers
    let length = DEFAULT_PERGOLA_CONFIG.dimensions.length;
    let width = DEFAULT_PERGOLA_CONFIG.dimensions.width;
    let height = DEFAULT_PERGOLA_CONFIG.dimensions.height;
    if (quote.dimensions) {
      const match = quote.dimensions.match(/([\d.]+)m\s*×\s*([\d.]+)m\s*×\s*([\d.]+)m/);
      if (match) {
        length = Math.round(parseFloat(match[1]) * 1000);
        width = Math.round(parseFloat(match[2]) * 1000);
        height = Math.round(parseFloat(match[3]) * 1000);
      }
    }

    const pergola: PergolaConfig = {
      ...DEFAULT_PERGOLA_CONFIG,
      type: (quote.pergola_type as any) || DEFAULT_PERGOLA_CONFIG.type,
      mounting: (quote.mounting as any) || DEFAULT_PERGOLA_CONFIG.mounting,
      mountedSide: (quote.mounted_side as any) || DEFAULT_PERGOLA_CONFIG.mountedSide,
      dimensions: { length, width, height },
      material: (quote.material as any) || DEFAULT_PERGOLA_CONFIG.material,
      frameColor: quote.frame_color || DEFAULT_PERGOLA_CONFIG.frameColor,
      roofType: (quote.roof_type as any) || DEFAULT_PERGOLA_CONFIG.roofType,
      roofColor: quote.roof_color || DEFAULT_PERGOLA_CONFIG.roofColor,
      panels: (quote.panels as any) || DEFAULT_PERGOLA_CONFIG.panels,
      lighting: (quote.lighting as any) || DEFAULT_PERGOLA_CONFIG.lighting,
      automation: (quote.automation as any) || DEFAULT_PERGOLA_CONFIG.automation,
      louveredAngle: quote.louvered_angle ?? DEFAULT_PERGOLA_CONFIG.louveredAngle,
      retractableOpenness: quote.retractable_openness ?? DEFAULT_PERGOLA_CONFIG.retractableOpenness,
    };

    const structureType = (quote.structure_type as StructureType) || 'pergola';

    const newState: ConfiguratorState = {
      structureType,
      currentStep: 1,
      pergola,
      deck: quote.panels && (quote.panels as any).__deck
        ? { ...DEFAULT_DECK_CONFIG, ...(quote.panels as any).__deck }
        : DEFAULT_DECK_CONFIG,
      includeDeck: structureType === 'combo' || structureType === 'deck',
      estimatedPrice: { min: 0, max: 0 },
    };
    newState.estimatedPrice = calculatePrice(newState);
    setState(newState);
  }, []);

  return {
    state,
    setStructureType,
    updatePergola,
    updateDeck,
    setCurrentStep,
    nextStep,
    prevStep,
    toggleDeck,
    resetConfigurator,
    loadFromQuote,
  };
};
