export type StructureType = 'deck' | 'pergola' | 'combo';

export type PergolaType = 'pro' | 'luxe' | 'sky' | 'fabric' | 'glass' | 'builder' | 'enclosure';
export type MountingType = 'freestanding' | 'wall-mounted' | 'integrated' | 'corner-mounted' | 'wall-nested' | 'flyover';
export type MountedSide = 'longer' | 'shorter';
export type MaterialType = 'wood' | 'aluminum' | 'composite';
export type RoofType = 'open' | 'polycarbonate' | 'solid' | 'louvered' | 'louvered-200' | 'retractable' | 'fabric' | 'insulated' | 'non-insulated';
export type RoofProfile = 'trimdek' | 'cgi';
export type PanelType = 'open' | 'slatted' | 'slats-wall' | 'glass' | 'privacy' | 'sliding-glass' | 'sliding-glass-door' | 'guillotine-glass' | 'fixed-glass-wall' | 'panelink-full' | 'panelink-dwarf' | 'dwarf-windows' | 'stacker-glass' | 'outdoor-blind' | 'blind-regent' | 'blind-windsor';
export type FloorFinish = 'as-is' | 'concrete' | 'tiling' | 'composite';
export type DeckShape = 'square' | 'notched' | 'l-left' | 'l-right' | 't-shape';
export type DeckHeight = 'ground' | 'elevated';
export type DeckSide = 'front' | 'back' | 'left' | 'right';
export type RailingType = 'none' | 'aluminum' | 'glass';
export type HandrailType = 'none' | 'aluminum' | 'timber';
export type GarageDoorType = 'none' | 'panel-lift' | 'garage-door';

export interface Dimensions {
  length: number; // in mm
  width: number;  // in mm
  height: number; // in mm
}

export interface SidePanel {
  enabled: boolean;
  type: PanelType;
  color: string;
  openness: number; // 0-100, how far sliding glass doors are open
  frameColor?: string; // blind side-track / cassette colour
  fabricOpenness?: 1 | 5 | 15; // blind fabric weave openness percentage
  operation?: 'motorised' | 'manual'; // blind operation
}

export interface SidePanels {
  front: SidePanel;
  back: SidePanel;
  left: SidePanel;
  right: SidePanel;
}

export interface PergolaConfig {
  type: PergolaType;
  mounting: MountingType;
  mountedSide: MountedSide;
  dimensions: Dimensions;
  material: MaterialType;
  frameColor: string;
  roofType: RoofType;
  roofColor: string;
  roofProfile: RoofProfile; // steel sheeting profile for insulated / non-insulated roofs
  roofSheetColor: string; // CGI single-sided roofing palette colour for steel sheets
  floorFinish: FloorFinish; // live floor finish shown in the 3D model
  skylight: boolean; // natural-light strips auto-placed at insulated panel joins
  panels: SidePanels;
  lighting: {
    ledStrips: boolean;
    louverLedCount: number; // Number of louver LED strips (1-10)
    spotlights: boolean;
    ceilingFan: boolean;
    heaters: boolean;
  };
  automation: 'remote' | 'app';
  carSpaces: number; // 1-3 car spaces (carport sizing)
  garageDoor: GarageDoorType;
  garageDoorOpenness: number; // 0-100, how far the selected garage door is raised
  roofPitch: number; // 0-25 degrees, flyover roof slope
  louveredAngle: number; // 0-90 degrees for louvered slat control
  retractableOpenness: number; // 0-100, how far retractable roof is open
}

export interface DeckConfig {
  shape: DeckShape;
  height: DeckHeight;
  dimensions: Dimensions;
  material: MaterialType;
  color: string;
  colorName: string;
  boardDirection: 'horizontal' | 'vertical';
  stairs: Record<DeckSide, { enabled: boolean; width: number }>;
  railingType: RailingType;
  handrailType: HandrailType;
}

export interface ConfiguratorState {
  structureType: StructureType | null;
  currentStep: number;
  pergola: PergolaConfig;
  deck: DeckConfig;
  includeDeck: boolean;
  estimatedPrice: {
    min: number;
    max: number;
  };
}

export const DEFAULT_PERGOLA_CONFIG: PergolaConfig = {
  type: 'pro',
  mounting: 'freestanding',
  mountedSide: 'longer',
  dimensions: {
    length: 4200,
    width: 3500,
    height: 3000,
  },
  material: 'aluminum',
  frameColor: '#474747', // Graphite
  roofType: 'louvered',
  roofColor: '#474747', // Match frame
  roofProfile: 'trimdek',
  roofSheetColor: '#B7B8B4', // Gull Grey
  floorFinish: 'as-is',
  skylight: false,
  panels: {
    front: { enabled: false, type: 'open', color: '#8B5A2B', openness: 0 },
    back: { enabled: false, type: 'open', color: '#8B5A2B', openness: 0 },
    left: { enabled: false, type: 'open', color: '#8B5A2B', openness: 0 },
    right: { enabled: false, type: 'open', color: '#8B5A2B', openness: 0 },
  },
  lighting: {
    ledStrips: false,
    louverLedCount: 3,
    spotlights: false,
    ceilingFan: false,
    heaters: false,
  },
  automation: 'remote',
  carSpaces: 1,
  garageDoor: 'none',
  garageDoorOpenness: 0,
  roofPitch: 8, // flyover roof slope in degrees
  louveredAngle: 0, // 0 = horizontal/closed
  retractableOpenness: 0, // 0 = fully closed
};

export const DEFAULT_DECK_CONFIG: DeckConfig = {
  shape: 'square',
  height: 'ground',
  dimensions: {
    length: 4000,
    width: 3000,
    height: 200,
  },
  material: 'wood',
  color: '#C2A278',
  colorName: 'Natural Oak',
  boardDirection: 'horizontal',
  stairs: {
    front: { enabled: false, width: 1200 },
    back: { enabled: false, width: 1200 },
    left: { enabled: false, width: 1200 },
    right: { enabled: false, width: 1200 },
  },
  railingType: 'none',
  handrailType: 'none',
};

export const DIMENSION_LIMITS = {
  pergola: {
    length: { min: 2000, max: 9000 },
    width: { min: 2000, max: 7000 },
    height: { min: 2200, max: 3000 },
  },
  deck: {
    length: { min: 2000, max: 8000 },
    width: { min: 2000, max: 6000 },
    height: { min: 100, max: 1500 },
  },
};

export const CONFIGURATOR_STEPS = [
  { id: 'type', label: 'Structure' },
  { id: 'style', label: 'Style' },
  { id: 'dimensions', label: 'Dimensions' },
  { id: 'materials', label: 'Materials' },
  { id: 'panels', label: 'Panels' },
  { id: 'roof', label: 'Roof' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'deck', label: 'Deck' },
  { id: 'summary', label: 'Summary' },
];
