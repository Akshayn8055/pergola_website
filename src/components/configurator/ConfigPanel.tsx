import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
  ConfiguratorState, 
  DIMENSION_LIMITS,
  MaterialType,
  RoofType,
  PergolaType,
  MountingType,
  MountedSide,
  PanelType,
  FloorFinish,
} from '@/types/configurator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Ruler, 
  Palette, 
  Grid3X3, 
  Home, 
  Lightbulb,
  Layers,
  FileText,
  Check,
  Smartphone,
  Settings,
  Minus,
  Plus,
  DoorClosed,
} from 'lucide-react';
import { QuoteFormDialog } from './QuoteFormDialog';
import { formatCurrency } from '@/lib/businessConfig';
import type { PricingConfig } from '@/lib/pricingConfig';

// Material images
import woodCedarImg from '@/assets/materials/wood-cedar.jpg';
import aluminumSilverImg from '@/assets/materials/aluminum-silver.jpg';
import compositeBrownImg from '@/assets/materials/composite-brown.jpg';

// Lighting images  
import ledStripsImg from '@/assets/lighting/led-strips.jpg';
import spotlightsImg from '@/assets/lighting/spotlights.jpg';
import ceilingFanImg from '@/assets/lighting/ceiling-fan.jpg';
import heatersImg from '@/assets/lighting/heaters.jpg';

// Pergola style images (mounting types only)

interface ConfigPanelProps {
  config: ConfiguratorState;
  onUpdatePergola: (updates: any) => void;
  onUpdateDeck: (updates: any) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSetStep: (step: number) => void;
  onToggleDeck: (include: boolean) => void;
  onReset: () => void;
  onCaptureDesign?: () => string | null;
  pricing: PricingConfig;
  editMode?: boolean;
  editQuoteId?: string;
  editToken?: string;
}

const PANELINK_COLORS = [
  { name: 'Pearl White', hex: '#F5F3EC' },
  { name: 'Cream', hex: '#EFE6CE' },
  { name: 'Merino', hex: '#D8CBB2' },
  { name: 'Off White', hex: '#F0EDE4' },
  { name: 'Smooth Cream', hex: '#EBDFC4' },
  { name: 'Dusk', hex: '#8E9297' },
  { name: 'Gull Grey', hex: '#A9ACA8' },
  { name: 'Birch Grey', hex: '#C4C2B8' },
  { name: 'Armour Grey', hex: '#6E7476' },
  { name: 'Wallaroo', hex: '#7A7D80' },
  { name: 'Gulf', hex: '#5E7282' },
  { name: 'Basal', hex: '#4C5153' },
  { name: 'Slate Grey', hex: '#5C6670' },
  { name: 'Mist Green', hex: '#A7B39A' },
  { name: 'Heritage Red', hex: '#8E3B2F' },
  { name: 'Mountain Blue', hex: '#5D7A96' },
  { name: 'Iron Grey', hex: '#4A4E52' },
  { name: 'Monolith', hex: '#333639' },
  { name: 'Ebony', hex: '#1E2022' },
];

const PRIVACY_SCREEN_COLORS = [
  { name: 'Charcoal', hex: '#3E3E3C' },
  { name: 'Shale Grey', hex: '#B6B7B0' },
  { name: 'Surfmist', hex: '#E4E2D5' },
  { name: 'Monument', hex: '#323233' },
  { name: 'Jasper', hex: '#6C5D53' },
];

// Stratco Ambient blind fabric colours
const BLIND_FABRIC_COLORS = [
  { name: 'Charcoal', hex: '#3E3E3C' },
  { name: 'Shale Grey', hex: '#B6B7B0' },
  { name: 'Surfmist', hex: '#E4E2D5' },
  { name: 'Monument', hex: '#323233' },
  { name: 'Jasper', hex: '#8A7B6B' },
];

// Blind frame / side-track colours (Stratco Outback palette)
const BLIND_FRAME_COLORS = [
  { name: 'Alpine', hex: '#EDEAE0' },
  { name: 'Sand Dune', hex: '#D2C4A6' },
  { name: 'Desert', hex: '#B49B76' },
  { name: 'Earth', hex: '#7A6A56' },
  { name: 'Storm', hex: '#8E9294' },
  { name: 'Thunder', hex: '#6A6C6E' },
  { name: 'Deep Space', hex: '#3B3F42' },
  { name: 'Sylvanite', hex: '#2E3033' },
];

const WIZARD_STEPS = [
  { id: 'type', label: 'Type', icon: Grid3X3, description: 'Choose structure type' },
  { id: 'style', label: 'Style', icon: Grid3X3, description: 'Choose pergola style' },
  { id: 'dimensions', label: 'Size', icon: Ruler, description: 'Set dimensions' },
  { id: 'materials', label: 'Materials', icon: Palette, description: 'Select materials' },
  { id: 'panels', label: 'Panels', icon: Layers, description: 'Configure panels' },
  { id: 'roof', label: 'Roof', icon: Home, description: 'Choose roof type' },
  { id: 'lighting', label: 'Extras', icon: Lightbulb, description: 'Add accessories' },
  { id: 'deck', label: 'Deck', icon: Layers, description: 'Configure deck' },
  { id: 'summary', label: 'Quote', icon: FileText, description: 'Get your quote' },
];

export const ConfigPanel = ({
  config,
  onUpdatePergola,
  onUpdateDeck,
  onNextStep,
  onPrevStep,
  onSetStep,
  onToggleDeck,
  onReset,
  onCaptureDesign,
  pricing,
  editMode,
  editQuoteId,
  editToken,
}: ConfigPanelProps) => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [dimensionMode, setDimensionMode] = useState<'standard' | 'custom'>('standard');
  const currentStep = WIZARD_STEPS[config.currentStep];
  const showPergolaOptions = config.structureType === 'pergola' || config.structureType === 'combo';
  const showDeckOptions = config.structureType === 'deck' || config.structureType === 'combo';
  const limits = showPergolaOptions ? DIMENSION_LIMITS.pergola : DIMENSION_LIMITS.deck;

  // Enclosures only support freestanding, wall-mounted, and wall-nested mounting
  useEffect(() => {
    if (config.pergola.type === 'enclosure' && ['integrated', 'corner-mounted', 'flyover'].includes(config.pergola.mounting)) {
      onUpdatePergola({ mounting: 'freestanding' });
    }
    // Polycarbonate Roof Pergola (carport) supports freestanding and wall-mounted only
    if (config.pergola.type === 'luxe' && ['integrated', 'corner-mounted', 'wall-nested', 'flyover'].includes(config.pergola.mounting)) {
      onUpdatePergola({ mounting: 'freestanding' });
    }
  }, [config.pergola.type, config.pergola.mounting, onUpdatePergola]);

  const formatDimension = (mm: number) => `${(mm / 1000).toFixed(2)}m`;
  const formatPrice = (price: number) => formatCurrency(price);

  // Type step - Structure type selection (this is shown at step 0, before structure is chosen)
  const renderTypeStep = () => {
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold mb-4 block">Select Your Structure</Label>
        <p className="text-sm text-muted-foreground">This step is typically handled by the StructureSelection component. If you're seeing this, please go back to start.</p>
      </div>
    );
  };

  // Style step - Pergola style, mounting type, and louver angle
  const renderStyleStep = () => {
    if (!showPergolaOptions) {
      const shapes = [
        { value: 'square', label: 'Square', clip: 'polygon(0 0,100% 0,100% 100%,0 100%)' },
        { value: 'notched', label: 'Notched', clip: 'polygon(0 0,100% 0,100% 55%,58% 55%,58% 100%,0 100%)' },
        { value: 'l-left', label: 'L-Shaped Left', clip: 'polygon(0 0,50% 0,50% 50%,100% 50%,100% 100%,0 100%)' },
        { value: 'l-right', label: 'L-Shaped Right', clip: 'polygon(50% 0,100% 0,100% 100%,0 100%,0 50%,50% 50%)' },
        { value: 't-shape', label: 'T-Shaped', clip: 'polygon(0 0,100% 0,100% 48%,70% 48%,70% 100%,30% 100%,30% 48%,0 48%)' },
      ];
      return (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-4 block">Deck Shape</Label>
            <div className="grid grid-cols-2 gap-3">
              {shapes.map((shape) => (
                <Button
                  key={shape.value}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-28 flex-col gap-3 transition-all",
                    config.deck.shape === shape.value 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60"
                  )}
                  onClick={() => onUpdateDeck({ shape: shape.value })}
                >
                  <span className="block h-12 w-20 bg-primary" style={{ clipPath: shape.clip }} />
                  <span className="text-xs font-semibold">{shape.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const isEnclosure = config.pergola.type === 'enclosure';
    const isCarport = config.pergola.type === 'luxe';
    const hideExtraMounts = isEnclosure || isCarport || config.pergola.type === 'fabric';
    const mountingTypes: { value: MountingType; label: string; description: string }[] = [
      { value: 'freestanding', label: 'Freestanding', description: 'Independent structure with 4 posts' },
      { value: 'wall-mounted', label: 'Wall-mounted', description: 'Attached to existing wall' },
      ...(!hideExtraMounts ? [{ value: 'integrated' as MountingType, label: 'Integrated', description: 'Built into the house with no support posts' }] : []),
      ...(!hideExtraMounts ? [{ value: 'corner-mounted' as MountingType, label: 'Corner mounted', description: 'Attached to the house and one side wall' }] : []),
      ...(!hideExtraMounts ? [{ value: 'wall-nested' as MountingType, label: 'Wall nested', description: 'Fitted between two side walls with no posts' }] : []),
      // Flyover is available on the Louvered Roof Pergola and Louvre Roof Builder only
      ...(!isEnclosure && (config.pergola.type === 'pro' || config.pergola.type === 'builder')
        ? [{ value: 'flyover' as MountingType, label: 'Flyover', description: 'Wall-attached roof pitched down towards the front posts' }]
        : []),
    ];

    return (
      <div className="space-y-6">
        {/* Mounting Type Selection */}
        <div>
          <Label className="text-base font-semibold mb-4 block text-center">Type <span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-2 gap-3">
            {mountingTypes.map((type) => {
              const selected = config.pergola.mounting === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onUpdatePergola({ mounting: type.value })}
                  className={cn(
                    "w-full rounded-2xl px-4 py-4 text-base font-medium transition-all duration-200",
                    selected
                      ? "bg-background border-2 border-primary text-primary shadow-[var(--shadow-sm)]"
                      : "bg-muted/60 border border-transparent text-foreground hover:bg-muted"
                  )}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roof pitch - only for flyover */}
        {config.pergola.mounting === 'flyover' && (
          <div>
            <Label className="text-base font-semibold mb-2 block">
              Pitch: <span className="font-normal text-muted-foreground">Range from 0° to 25°</span>
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[config.pergola.roofPitch ?? 8]}
                min={0}
                max={25}
                step={1}
                onValueChange={([v]) => onUpdatePergola({ roofPitch: v })}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                max={25}
                value={config.pergola.roofPitch ?? 8}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(25, Number(e.target.value) || 0));
                  onUpdatePergola({ roofPitch: v });
                }}
                className="w-20 text-center"
              />
            </div>
          </div>
        )}

        {/* Mounted Side Selection - only when wall-mounted */}
        {config.pergola.mounting === 'wall-mounted' && (
          <div>
            <Label className="text-base font-semibold mb-4 block text-center">Mounted side</Label>
            <div className="space-y-3">
              {([
                { value: 'longer' as MountedSide, label: 'Longer side', description: 'Wall attaches along the longer dimension' },
                { value: 'shorter' as MountedSide, label: 'Shorter side', description: 'Wall attaches along the shorter dimension' },
              ]).map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    "hover:shadow-[var(--shadow-md)]",
                    config.pergola.mountedSide === option.value
                      ? "border-primary ring-2 ring-primary/20 shadow-[var(--shadow-md)]"
                      : "border-border/60 hover:border-primary/40"
                  )}
                  onClick={() => onUpdatePergola({ mountedSide: option.value })}
                >
                  <CardContent className="p-4">
                    <div className="font-semibold text-foreground">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderDimensionsStep = () => {
    const dims = showPergolaOptions ? config.pergola.dimensions : config.deck.dimensions;
    const isCarport = showPergolaOptions && config.pergola.type === 'luxe';
    const carSizes = [
      { cars: 1, length: 3000, width: 6000 },
      { cars: 2, length: 6000, width: 6000 },
      { cars: 3, length: 9000, width: 6000 },
    ];
    const standardSizes = [
      { length: 7000, width: 3000, label: '7m × 3m' },
      { length: 8000, width: 3000, label: '8m × 3m' },
      { length: 7000, width: 4000, label: '7m × 4m' },
      { length: 8000, width: 4000, label: '8m × 4m' },
      { length: 6000, width: 5000, label: '6m × 5m' },
      { length: 7000, width: 5000, label: '7m × 5m' },
      { length: 7000, width: 6000, label: '7m × 6m' },
      { length: 7000, width: 7000, label: '7m × 7m' },
    ];

    const handleDimChange = (field: 'length' | 'width' | 'height', value: number) => {
      const clamped = Math.max(limits[field].min, Math.min(limits[field].max, value));
      if (showPergolaOptions) {
        onUpdatePergola({ dimensions: { ...config.pergola.dimensions, [field]: clamped } });
      } else {
        onUpdateDeck({ dimensions: { ...config.deck.dimensions, [field]: clamped } });
      }
    };

    const dimFields: { key: 'length' | 'width' | 'height'; label: string }[] = [
      { key: 'length', label: 'Length (cm)' },
      { key: 'width', label: 'Width (cm)' },
      { key: 'height', label: 'Height (cm)' },
    ];
    
    const selectStandardSize = (length: number, width: number) => {
      const dimensions = { length, width, height: showPergolaOptions ? 2500 : config.deck.dimensions.height };
      if (showPergolaOptions) {
        onUpdatePergola({ dimensions });
      } else {
        onUpdateDeck({ dimensions });
      }
    };

    return (
      <div className="space-y-7">
        {!showPergolaOptions && (
          <div>
            <Label className="text-base font-semibold mb-3 block">Deck Shape</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['square', 'Square'], ['notched', 'Notched'], ['l-left', 'L-Shaped Left'], ['l-right', 'L-Shaped Right'], ['t-shape', 'T-Shaped'],
              ] as const).map(([value, label]) => <Button key={value} type="button" variant="outline" onClick={() => onUpdateDeck({ shape: value })} className={cn('h-auto min-h-11 whitespace-normal text-xs', config.deck.shape === value && 'border-primary text-primary')}>{label}</Button>)}
            </div>
          </div>
        )}
        {!showPergolaOptions && (
          <div>
            <Label className="text-base font-semibold mb-3 block">Deck Material</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => onUpdateDeck({ material: 'composite', color: '#817C73', colorName: 'Silver Gum' })} className={cn(config.deck.material === 'composite' && 'border-primary text-primary')}>Composite Deck</Button>
              <Button type="button" variant="outline" onClick={() => onUpdateDeck({ material: 'wood', color: '#C2A278', colorName: 'Natural Oak' })} className={cn(config.deck.material === 'wood' && 'border-primary text-primary')}>Timber Deck</Button>
            </div>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-semibold text-center text-foreground">Dimensions</h2>
          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            {[
              { value: formatDimension(dims.length), label: 'Width' },
              { value: formatDimension(dims.width), label: 'Depth' },
              { value: formatDimension(dims.height), label: 'Height' },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xl font-bold text-foreground">{item.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-lg border border-border bg-muted/60 p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDimensionMode('standard')}
            className={cn(
              "h-11 text-base",
              dimensionMode === 'standard' && "bg-background text-primary shadow-sm hover:bg-background"
            )}
          >
            Standard
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDimensionMode('custom')}
            className={cn(
              "h-11 text-base",
              dimensionMode === 'custom' && "bg-background text-primary shadow-sm hover:bg-background"
            )}
          >
            Custom
          </Button>
        </div>

        {dimensionMode === 'standard' && isCarport ? (
          <div className="grid grid-cols-3 gap-3">
            {carSizes.map((size) => {
              const selected = (config.pergola.carSpaces ?? 1) === size.cars;
              return (
                <button
                  key={size.cars}
                  type="button"
                  onClick={() =>
                    onUpdatePergola({
                      carSpaces: size.cars,
                      dimensions: { length: size.length, width: size.width, height: 2500 },
                    })
                  }
                  className={cn(
                    "rounded-xl border-2 p-2 transition-all duration-200",
                    selected ? "border-primary bg-background" : "border-transparent bg-muted/40 hover:bg-muted"
                  )}
                >
                  <div className="rounded-lg bg-muted/70 py-3 flex items-center justify-center gap-1">
                    {Array.from({ length: size.cars }).map((_, i) => (
                      <svg key={i} viewBox="0 0 24 44" className="w-5 h-9" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="40" rx="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M5 15 Q12 10 19 15 L19 19 Q12 17 5 19 Z" fill="currentColor" opacity="0.35" />
                        <path d="M5 30 Q12 36 19 30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                      </svg>
                    ))}
                  </div>
                  <div className={cn("mt-2 text-sm font-medium", selected ? "text-primary" : "text-foreground")}>
                    {size.cars} {size.cars === 1 ? 'car' : 'cars'}
                  </div>
                </button>
              );
            })}
          </div>
        ) : dimensionMode === 'standard' ? (
          <div className="grid grid-cols-2 gap-3">
            {standardSizes.map((size) => {
              const selected = dims.length === size.length && dims.width === size.width && dims.height === 2500;
              return (
                <Button
                  key={size.label}
                  type="button"
                  variant="outline"
                  onClick={() => selectStandardSize(size.length, size.width)}
                  className={cn(
                    "h-14 text-base font-medium",
                    selected && "border-2 border-primary text-primary bg-background"
                  )}
                >
                  {size.label}
                </Button>
              );
            })}
          </div>
        ) : (
        <div className="space-y-6">
          {dimFields.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-sm font-semibold text-foreground mb-2 block">{label}</Label>
              <div className="flex items-center gap-3">
                <div className="relative w-32 flex-shrink-0">
                  <Input
                    type="number"
                    value={Math.round(dims[key] / 10)}
                    onChange={(e) => {
                      const cm = parseInt(e.target.value, 10);
                      if (!isNaN(cm)) handleDimChange(key, cm * 10);
                    }}
                    min={Math.round(limits[key].min / 10)}
                    max={Math.round(limits[key].max / 10)}
                    step={10}
                    className="text-lg font-semibold h-12 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute right-1 top-1 bottom-1 flex flex-col border-l border-border">
                    <button
                      type="button"
                      className="flex-1 px-1.5 flex items-center justify-center hover:bg-muted/60 rounded-tr-md transition-colors"
                      onClick={() => handleDimChange(key, dims[key] + 100)}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                    <div className="border-t border-border" />
                    <button
                      type="button"
                      className="flex-1 px-1.5 flex items-center justify-center hover:bg-muted/60 rounded-br-md transition-colors"
                      onClick={() => handleDimChange(key, dims[key] - 100)}
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  </div>
                </div>
                <Slider
                  value={[dims[key]]}
                  onValueChange={([value]) => handleDimChange(key, value)}
                  min={limits[key].min}
                  max={limits[key].max}
                  step={100}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>{Math.round(limits[key].min / 10)} cm</span>
                <span>{Math.round(limits[key].max / 10)} cm</span>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  const renderMaterialsStep = () => {
    const materials: { value: MaterialType; label: string; description: string; color: string; image: string }[] = showPergolaOptions
      ? [
          { value: 'aluminum', label: 'Aluminum', description: 'Modern, sleek silver finish', color: '#C0C0C0', image: aluminumSilverImg },
        ]
      : [
          { value: 'composite', label: 'Composite Deck', description: 'Durable, low-maintenance deck boards', color: '#817C73', image: compositeBrownImg },
          { value: 'wood', label: 'Timber Deck', description: 'Natural hardwood deck boards', color: '#C2A278', image: woodCedarImg },
        ];

    const currentMaterial = showPergolaOptions ? config.pergola.material : config.deck.material;
    const currentColor = showPergolaOptions ? config.pergola.frameColor : config.deck.color;

    // Standard Stratco Outback framing palette (Attached, Freestanding and Flyover pergolas)
    const colorPresets = showPergolaOptions
      ? [
          { name: 'Alpine', color: '#EDEAE0' },
          { name: 'Sand Dune', color: '#D2C4A6' },
          { name: 'Desert', color: '#B49B76' },
          { name: 'Earth', color: '#7A6A56' },
          { name: 'Storm', color: '#8E9294' },
          { name: 'Thunder', color: '#6A6C6E' },
          { name: 'Deep Space', color: '#3B3F42' },
          { name: 'Sylvanite', color: '#2E3033' },
        ]
      : currentMaterial === 'composite'
        ? [{ name: 'Coastal Oak', color: '#9A8065' }, { name: 'Silver Gum', color: '#817C73' }, { name: 'Walnut', color: '#55443A' }, { name: 'Charcoal', color: '#3D4142' }]
        : [{ name: 'Natural Oak', color: '#C2A278' }, { name: 'Blonde Ash', color: '#D6BC92' }, { name: 'Teak', color: '#B08A56' }, { name: 'Spotted Gum', color: '#A0522D' }, { name: 'Blackbutt', color: '#C08A55' }, { name: 'Cedar', color: '#9C6B45' }, { name: 'Merbau', color: '#6B3E2E' }, { name: 'Jarrah', color: '#713B32' }, { name: 'Walnut', color: '#55443A' }, { name: 'Smoked Oak', color: '#4A3B2E' }];

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-4 block">Material Type</Label>
          <div className="space-y-3">
            {materials.map((mat) => (
              <Card
                key={mat.value}
                className={cn(
                  "cursor-pointer transition-all duration-200 overflow-hidden",
                  "hover:shadow-[var(--shadow-md)]",
                  currentMaterial === mat.value 
                    ? "border-primary ring-2 ring-primary/20 shadow-[var(--shadow-md)]" 
                    : "border-border/60 hover:border-primary/40"
                )}
                onClick={() => {
                  const defaultColor = mat.value === 'aluminum' ? '#C0C0C0' : mat.color;
                  if (showPergolaOptions) {
                    onUpdatePergola({ material: mat.value, frameColor: defaultColor });
                  } else {
                     onUpdateDeck({ material: mat.value, color: defaultColor, colorName: mat.label === 'Composite Deck' ? 'Silver Gum' : 'Natural Oak' });
                  }
                }}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-24 h-20 flex-shrink-0 overflow-hidden">
                      <img 
                        src={mat.image} 
                        alt={mat.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{mat.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{mat.description}</div>
                      </div>
                      {currentMaterial === mat.value && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-4 block">Color</Label>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200",
                  currentColor === preset.color 
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                    : "border-border/60 hover:border-primary/40 bg-card"
                )}
                onClick={() => {
                  if (showPergolaOptions) {
                    onUpdatePergola({ frameColor: preset.color });
                  } else {
                     onUpdateDeck({ color: preset.color, colorName: preset.name });
                  }
                }}
              >
                <div 
                  className="w-full h-9 rounded-lg shadow-inner border border-black/10 mb-2"
                  style={{ backgroundColor: preset.color }}
                />
                <div className="text-xs font-semibold text-foreground">{preset.name}</div>
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <Label className="text-sm">Custom:</Label>
            <Input
              type="color"
              value={currentColor}
              onChange={(e) => {
                if (showPergolaOptions) {
                  onUpdatePergola({ frameColor: e.target.value });
                } else {
                  onUpdateDeck({ color: e.target.value });
                }
              }}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={currentColor}
              onChange={(e) => {
                if (showPergolaOptions) {
                  onUpdatePergola({ frameColor: e.target.value });
                } else {
                  onUpdateDeck({ color: e.target.value });
                }
              }}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPanelsStep = () => {
    if (!showPergolaOptions) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Panel options are available for pergolas only.</p>
          <Button className="mt-4" onClick={onNextStep}>Continue →</Button>
        </div>
      );
    }

    const isEnclosure = config.pergola.type === 'enclosure';
    const isFabricPergola = config.pergola.type === 'fabric';

    // Fabric Roof Pergola: Stratco Ambient blinds only
    const blindPanelTypes: { value: PanelType; label: string; description: string }[] = [
      {
        value: 'blind-regent',
        label: 'Stratco Ambient Regent',
        description: 'Fully side-restrained zip-guided blind with aluminium side tracks',
      },
      {
        value: 'blind-windsor',
        label: 'Stratco Ambient Windsor',
        description: 'Wire-guided semi-restrained blind with stainless-steel wire guides',
      },
    ];

    const basePanelTypes: { value: PanelType; label: string }[] = [
      { value: 'open', label: 'Open' },
      { value: 'slatted', label: 'Slatted' },
      { value: 'slats-wall', label: 'Slats Wall' },
      { value: 'guillotine-glass', label: 'Guillotine Glass' },
      { value: 'fixed-glass-wall', label: 'Fixed Glass Wall' },
      { value: 'privacy', label: 'Privacy Shade' },
      { value: 'sliding-glass', label: 'Sliding Glass' },
    ];

    // Pergola Enclosures keep the complete panel library, plus the
    // enclosure-specific wall, door and screen options.
    const enclosurePanelTypes: { value: PanelType; label: string }[] = [
      { value: 'open', label: 'Open / No Wall' },
      { value: 'panelink-full', label: 'Full-Height Versiclad Panelink Wall' },
      { value: 'panelink-dwarf', label: '900 mm Versiclad Panelink Dwarf Wall' },
      { value: 'dwarf-windows', label: '900 mm Dwarf Wall + Sliding Glass Windows Above' },
      { value: 'sliding-glass-door', label: 'Sliding Glass Door with Door' },
      { value: 'stacker-glass', label: 'Stacker Glass Doors' },
      { value: 'outdoor-blind', label: 'Outdoor Blind / Blockout Screen' },
      { value: 'slatted', label: 'Slatted' },
      { value: 'slats-wall', label: 'Slats Wall' },
      { value: 'guillotine-glass', label: 'Guillotine Glass' },
      { value: 'fixed-glass-wall', label: 'Fixed Glass Wall' },
    ];

    const panelTypes = isFabricPergola
      ? blindPanelTypes
      : isEnclosure
      ? enclosurePanelTypes
      : basePanelTypes;

    const floorFinishes: { value: FloorFinish; label: string; description: string }[] = [
      { value: 'as-is', label: 'As Is', description: 'Retain the existing floor' },
      { value: 'concrete', label: 'Concrete', description: 'Smooth poured concrete slab' },
      { value: 'tiling', label: 'Tiling', description: 'Large-format outdoor tiles' },
      { value: 'composite', label: 'Composite Decking', description: 'Grooved composite deck boards' },
    ];

    const sides = ['front', 'back', 'left', 'right'] as const;

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Configure panels for each side of your pergola. Each side is independent.
        </p>

        {isEnclosure && (
          <Card>
            <CardContent className="p-4">
              <Label className="text-base font-medium">Floor</Label>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {floorFinishes.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => onUpdatePergola({ floorFinish: f.value })}
                    className={`text-left rounded-lg border-2 p-3 transition-all ${
                      (config.pergola.floorFinish ?? 'as-is') === f.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{f.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        
        {sides.map((side) => {
          const panel = config.pergola.panels[side];
          return (
            <Card key={side} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium capitalize">{side} Panel</Label>
                  <Switch
                    checked={panel.enabled}
                    onCheckedChange={(checked) => 
                      onUpdatePergola({ 
                        panels: { 
                          ...config.pergola.panels, 
                          [side]: {
                            ...panel,
                            enabled: checked,
                            type: checked ? (isFabricPergola ? 'blind-regent' : 'slatted') : 'open',
                            ...(checked && isFabricPergola
                              ? {
                                  openness: 100,
                                  color: panel.color || '#3E3E3C',
                                  frameColor: panel.frameColor || config.pergola.frameColor,
                                  fabricOpenness: panel.fabricOpenness || 5,
                                  operation: panel.operation || 'motorised',
                                }
                              : {}),
                          } 
                        } 
                      })
                    }
                  />
                </div>
                
                {panel.enabled && (
                  <>
                    <div className={`grid gap-2 mt-3 ${isEnclosure || isFabricPergola ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
                      {panelTypes.filter(t => t.value !== 'open').map((type) => {
                        const selected = panel.type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              onUpdatePergola({
                                panels: {
                                  ...config.pergola.panels,
                                  [side]: {
                                    ...panel,
                                    type: selected ? 'open' : type.value,
                                    openness: !selected && (type.value === 'privacy' || type.value === 'outdoor-blind') ? 50 : panel.openness,
                                  },
                                },
                              })
                            }
                            className={cn(
                              "flex items-center gap-3 text-left rounded-lg border-2 px-3 py-2.5 transition-all",
                              selected
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                            )}
                          >
                            <span
                              className={cn(
                                "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-transparent"
                              )}
                            >
                              {selected && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <span className="leading-tight">
                              <span className="block text-xs font-medium">{type.label}</span>
                              {'description' in type && (
                                <span className="block text-[11px] text-muted-foreground mt-0.5">
                                  {(type as { description: string }).description}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {(panel.type === 'blind-regent' || panel.type === 'blind-windsor') && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label className="text-xs font-medium">Fabric Colour</Label>
                          <div className="grid grid-cols-5 gap-2 mt-2">
                            {BLIND_FABRIC_COLORS.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                title={c.name}
                                onClick={() =>
                                  onUpdatePergola({
                                    panels: { ...config.pergola.panels, [side]: { ...panel, color: c.hex } },
                                  })
                                }
                                className="flex flex-col items-center gap-1"
                              >
                                <span
                                  className={`h-9 w-full rounded-md border-2 transition-all ${
                                    panel.color === c.hex ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="text-[10px] leading-tight text-muted-foreground text-center">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium">Frame Colour</Label>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {BLIND_FRAME_COLORS.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                title={c.name}
                                onClick={() =>
                                  onUpdatePergola({
                                    panels: { ...config.pergola.panels, [side]: { ...panel, frameColor: c.hex } },
                                  })
                                }
                                className="flex flex-col items-center gap-1"
                              >
                                <span
                                  className={`h-8 w-full rounded-md border-2 transition-all ${
                                    (panel.frameColor ?? config.pergola.frameColor) === c.hex
                                      ? 'border-primary ring-2 ring-primary/30'
                                      : 'border-border'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="text-[10px] leading-tight text-muted-foreground text-center">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium">Fabric Openness</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {([1, 5, 15] as const).map((o) => (
                              <button
                                key={o}
                                type="button"
                                onClick={() =>
                                  onUpdatePergola({
                                    panels: { ...config.pergola.panels, [side]: { ...panel, fabricOpenness: o } },
                                  })
                                }
                                className={cn(
                                  'rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all',
                                  (panel.fabricOpenness ?? 5) === o
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/40'
                                )}
                              >
                                {o}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium">Blind Position</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {[
                              { label: 'Open', value: 0 },
                              { label: 'Half Closed', value: 50 },
                              { label: 'Fully Closed', value: 100 },
                            ].map((p) => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() =>
                                  onUpdatePergola({
                                    panels: { ...config.pergola.panels, [side]: { ...panel, openness: p.value } },
                                  })
                                }
                                className={cn(
                                  'rounded-full border-2 px-2 py-1.5 text-xs font-medium transition-all',
                                  panel.openness === p.value
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/40'
                                )}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium">Operation</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {(['motorised', 'manual'] as const).map((op) => (
                              <button
                                key={op}
                                type="button"
                                onClick={() =>
                                  onUpdatePergola({
                                    panels: { ...config.pergola.panels, [side]: { ...panel, operation: op } },
                                  })
                                }
                                className={cn(
                                  'rounded-full border-2 px-3 py-1.5 text-xs font-medium capitalize transition-all',
                                  (panel.operation ?? 'motorised') === op
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/40'
                                )}
                              >
                                {op}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}


                    {(panel.type === 'panelink-full' || panel.type === 'panelink-dwarf' || panel.type === 'dwarf-windows') && (
                      <div className="mt-4">
                        <Label className="text-xs font-medium">Panelink Wall Colour</Label>
                        <div className="max-h-40 overflow-y-auto pr-1 mt-2">
                          <div className="grid grid-cols-5 gap-2">
                            {PANELINK_COLORS.map((c) => (
                              <button
                                key={c.name}
                                type="button"
                                title={c.name}
                                onClick={() =>
                                  onUpdatePergola({
                                    panels: {
                                      ...config.pergola.panels,
                                      [side]: { ...panel, color: c.hex },
                                    },
                                  })
                                }
                                className="flex flex-col items-center gap-1 group"
                              >
                                <span
                                  className={`h-9 w-full rounded-md border-2 transition-all ${
                                    panel.color === c.hex ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="text-[10px] leading-tight text-muted-foreground text-center">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {(panel.type === 'privacy' || panel.type === 'outdoor-blind') && (
                      <div className="mt-4">
                        <Label className="text-xs font-medium">Screen Colour</Label>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {PRIVACY_SCREEN_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              title={c.name}
                              onClick={() =>
                                onUpdatePergola({
                                  panels: {
                                    ...config.pergola.panels,
                                    [side]: { ...panel, color: c.hex },
                                  },
                                })
                              }
                              className={`flex flex-col items-center gap-1 group`}
                            >
                              <span
                                className={`h-9 w-full rounded-md border-2 transition-all ${
                                  panel.color === c.hex ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-[10px] leading-tight text-muted-foreground text-center">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(panel.type === 'privacy' || panel.type === 'outdoor-blind') && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-xs font-medium">Screen Deployment</Label>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {panel.openness}%
                          </span>
                        </div>
                        <Slider
                          value={[panel.openness]}
                          onValueChange={([value]) =>
                            onUpdatePergola({
                              panels: {
                                ...config.pergola.panels,
                                [side]: { ...panel, openness: value },
                              },
                            })
                          }
                          min={0}
                          max={100}
                          step={5}
                          className="py-1"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Retracted</span>
                          <span>Fully Deployed</span>
                        </div>
                      </div>
                    )}

                    {(panel.type === 'sliding-glass' || panel.type === 'stacker-glass' || panel.type === 'sliding-glass-door') && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-xs font-medium">Door Openness</Label>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {panel.openness}%
                          </span>
                        </div>
                        <Slider
                          value={[panel.openness]}
                          onValueChange={([value]) =>
                            onUpdatePergola({
                              panels: {
                                ...config.pergola.panels,
                                [side]: { ...panel, openness: value },
                              },
                            })
                          }
                          min={0}
                          max={100}
                          step={5}
                          className="py-1"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Closed</span>
                          <span>Fully Open</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderRoofStep = () => {
    if (!showPergolaOptions) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Roof options are available for pergolas only.</p>
          <Button className="mt-4" onClick={onNextStep}>Continue →</Button>
        </div>
      );
    }

    const steelRoofTypes: { value: RoofType; label: string; description: string }[] = [
      { value: 'insulated', label: 'Insulated', description: 'Insulated steel panels with optional skylight strips' },
      { value: 'non-insulated', label: 'Non-Insulated', description: 'Single-skin steel roofing' },
    ];

    const roofTypes: { value: RoofType; label: string; description: string }[] = (
      config.pergola.type === 'fabric'
        ? [
            { value: 'fabric' as RoofType, label: 'Fabric Roof', description: 'Twin fabric panels with central support' },
            { value: 'louvered' as RoofType, label: 'Louvered', description: 'Adjustable slats for sun control' },
          ]
        : config.pergola.type === 'glass'
          ? [{ value: 'polycarbonate' as RoofType, label: 'Glass Roof', description: 'Framed transparent glass panels' }]
          : config.pergola.type === 'builder'
            ? [
                { value: 'louvered-200' as RoofType, label: '200mm Louvered roof', description: 'Motorised 200 mm aluminium louvre blades' },
              ]
          : config.pergola.type === 'enclosure'
            ? [{ value: 'louvered' as RoofType, label: 'Louvered', description: 'Adjustable slats for sun control' }]
            : config.pergola.type === 'pro'
              ? []
              : config.pergola.type === 'luxe'
                ? [
                    { value: 'insulated' as RoofType, label: 'Cooldek Insulated Roofing', description: 'Corrugated insulated steel panel with foam core' },
                    { value: 'non-insulated' as RoofType, label: 'Single-Skin Steel Roof', description: 'Trapezoidal ribbed single-skin steel sheeting' },
                  ]
                : [
                    { value: 'open' as RoofType, label: 'Open Slats', description: 'Classic slatted design with partial shade' },
                    { value: 'polycarbonate' as RoofType, label: 'Polycarbonate', description: 'Transparent weather protection' },
                    { value: 'solid' as RoofType, label: 'Solid Roof', description: 'Full shade and rain protection' },
                    { value: 'louvered' as RoofType, label: 'Louvered', description: 'Adjustable slats for sun control' },
                    { value: 'retractable' as RoofType, label: 'Retractable', description: 'Motorized sliding roof panels' },
                  ]
    ).concat(config.pergola.type === 'builder' || config.pergola.type === 'luxe' ? [] : steelRoofTypes);


    const isSteelRoof = config.pergola.roofType === 'insulated' || config.pergola.roofType === 'non-insulated';
    const roofSheetColors: { name: string; hex: string }[] = [
      { name: 'Off White', hex: '#EDEAE3' },
      { name: 'Smooth Cream', hex: '#F2E3C0' },
      { name: 'Gull Grey', hex: '#B7B8B4' },
      { name: 'Moss Vale Sand', hex: '#C8C6A4' },
      { name: 'Merino', hex: '#E3C8A2' },
      { name: 'Birch', hex: '#B7AC9F' },
      { name: 'River Reed', hex: '#A1A071' },
      { name: 'Mist Green', hex: '#8FA07B' },
      { name: 'Driftwood', hex: '#8C8073' },
      { name: 'Wild Sage', hex: '#78775D' },
      { name: 'Armour Grey', hex: '#8B908A' },
      { name: 'Cobblestone', hex: '#7C7A72' },
      { name: 'Granite', hex: '#716C61' },
      { name: 'Banyan Brown', hex: '#7D7265' },
      { name: 'Red Dust', hex: '#96472A' },
      { name: 'Slate Grey', hex: '#4E544C' },
      { name: 'Dark Stone', hex: '#5C6670' },
      { name: 'Heritage Red', hex: '#7E2015' },
      { name: 'Caulfield Green', hex: '#2C6E52' },
      { name: 'Gun Metal Grey', hex: '#3B3F3B' },
      { name: 'Mountain Blue', hex: '#146276' },
      { name: 'Ebony', hex: '#1E1D1B' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-4 block">Roof Type</Label>
          <div className="space-y-3">
            {roofTypes.map((roof) => (
              <Card
                key={roof.value}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  "hover:shadow-[var(--shadow-md)]",
                  config.pergola.roofType === roof.value 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-[var(--shadow-md)]" 
                    : "border-border/60 hover:border-primary/40"
                )}
                onClick={() => {
                  if (config.pergola.type === 'luxe' && roof.value === 'insulated') {
                    onUpdatePergola({ roofType: roof.value, roofProfile: 'cgi' });
                  } else if (config.pergola.type === 'luxe' && roof.value === 'non-insulated') {
                    onUpdatePergola({ roofType: roof.value, roofProfile: 'trimdek' });
                  } else {
                    onUpdatePergola({ roofType: roof.value });
                  }
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{roof.label}</div>
                    <div className="text-sm text-muted-foreground">{roof.description}</div>
                  </div>
                  {config.pergola.roofType === roof.value && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {config.pergola.roofType === 'retractable' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-semibold">Roof Retraction</Label>
              <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {config.pergola.retractableOpenness}%
              </span>
            </div>
            <Slider
              value={[config.pergola.retractableOpenness]}
              onValueChange={([value]) => onUpdatePergola({ retractableOpenness: value })}
              min={0}
              max={100}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Closed</span>
              <span>Fully Open</span>
            </div>
          </div>
        )}


        {(isSteelRoof || (config.pergola.roofType === 'louvered' || config.pergola.roofType === 'louvered-200')) && (
          <div>
            <Label className="text-base font-semibold mb-1 block">Roof Sheets Colour</Label>
            <p className="text-xs text-muted-foreground mb-3">CGI single-sided roofing palette</p>
            <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 rounded-md">
              {roofSheetColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                    config.pergola.roofSheetColor === color.hex
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-primary/40"
                  )}
                  onClick={() => onUpdatePergola({ roofSheetColor: color.hex })}
                >
                  <span
                    className="w-8 h-6 rounded-sm border border-border/60 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="flex-1 text-left text-foreground">{color.name}</span>
                  {config.pergola.roofSheetColor === color.hex && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {config.pergola.roofType === 'louvered-200' && (
          <div>
            <Label className="text-base font-semibold mb-1 block">Louvre Opening</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Rotate the motorised 200 mm blades from fully closed to fully open
            </p>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { label: 'Closed', value: 0 },
                { label: 'Half open', value: 45 },
                { label: 'Fully open', value: 90 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={cn(
                    "px-3 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200",
                    (config.pergola.louveredAngle ?? 0) === preset.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 hover:border-primary/40 text-foreground"
                  )}
                  onClick={() => onUpdatePergola({ louveredAngle: preset.value })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Blade angle</span>
              <span className="text-sm font-semibold text-foreground">
                {Math.round(config.pergola.louveredAngle ?? 0)}°
              </span>
            </div>
            <Slider
              value={[config.pergola.louveredAngle ?? 0]}
              min={0}
              max={90}
              step={1}
              onValueChange={([value]) => onUpdatePergola({ louveredAngle: value })}
            />
          </div>
        )}


        {config.pergola.roofType === 'insulated' && (
          <div>
            <Label className="text-base font-semibold mb-3 block">Natural Skylight</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={cn(
                    "px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200",
                    config.pergola.skylight === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 hover:border-primary/40 text-foreground"
                  )}
                  onClick={() => onUpdatePergola({ skylight: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Skylights are placed automatically: a 250 mm natural-light strip is inserted at each
              insulated panel join and shown live in the 3D model.
            </p>
          </div>
        )}

        {config.pergola.roofType !== 'polycarbonate' && config.pergola.roofType !== 'retractable' && config.pergola.roofType !== 'louvered' && config.pergola.roofType !== 'louvered-200' && !isSteelRoof && (
          <div>
            <Label className="text-base font-semibold mb-3 block">Roof Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={config.pergola.roofColor}
                onChange={(e) => onUpdatePergola({ roofColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={config.pergola.roofColor}
                onChange={(e) => onUpdatePergola({ roofColor: e.target.value })}
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLightingStep = () => {
    if (!showPergolaOptions) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Lighting options are available for pergolas only.</p>
          <Button className="mt-4" onClick={onNextStep}>Continue →</Button>
        </div>
      );
    }

    const lightingOptions = [
      { key: 'ledStrips', label: 'LED Strip Lighting', description: 'Ambient beam lighting', price: `+${formatCurrency(pricing.extras.ledStrips)}`, image: ledStripsImg },
      { key: 'spotlights', label: 'Spotlights', description: 'Focused downlighting', price: `+${formatCurrency(pricing.extras.spotlights)}`, image: spotlightsImg },
      { key: 'ceilingFan', label: 'Ceiling Fan', description: 'Circulate air and stay cool', price: `+${formatCurrency(pricing.extras.ceilingFan)}`, image: ceilingFanImg },
      { key: 'heaters', label: 'Outdoor Heaters', description: 'Extend comfort into cooler evenings', price: `+${formatCurrency(pricing.extras.heaters)}`, image: heatersImg },
    ];

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Add optional accessories to enhance your outdoor space.
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {lightingOptions.map((option) => {
            const isSelected = config.pergola.lighting[option.key as keyof typeof config.pergola.lighting];
            return (
              <div key={option.key}>
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 overflow-hidden",
                    "hover:shadow-[var(--shadow-md)]",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 shadow-[var(--shadow-md)]"
                      : "border-border/60 hover:border-primary/40"
                  )}
                  onClick={() => 
                    onUpdatePergola({ 
                      lighting: { ...config.pergola.lighting, [option.key]: !isSelected } 
                    })
                  }
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <img 
                        src={option.image} 
                        alt={option.label}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-primary shadow-lg">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                      </div>
                      <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{option.price}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Louver LED count control - shown when LED Strips are selected */}
                {option.key === 'ledStrips' && isSelected && (
                  <Card className="mt-2 border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground text-sm">Louver LED Lights</div>
                          <div className="text-xs text-muted-foreground">Available in Warm White color. Price per piece</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = config.pergola.lighting.louverLedCount || 3;
                              if (current > 1) {
                                onUpdatePergola({
                                  lighting: { ...config.pergola.lighting, louverLedCount: current - 1 }
                                });
                              }
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-lg font-bold text-foreground w-6 text-center">
                            {config.pergola.lighting.louverLedCount || 3}
                          </span>
                          <button
                            className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = config.pergola.lighting.louverLedCount || 3;
                              if (current < 10) {
                                onUpdatePergola({
                                  lighting: { ...config.pergola.lighting, louverLedCount: current + 1 }
                                });
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAutomationStep = () => {
    if (!showPergolaOptions) return null;

    const automationOptions = [
      { 
        value: 'remote' as const, 
        label: 'Motorised with remote control', 
        description: '',
        icon: Settings,
      },
      { 
        value: 'app' as const, 
        label: 'Motorised with app control', 
        description: 'Includes remote control',
        icon: Smartphone,
      },
    ];

    return (
      <div className="space-y-3">
        {automationOptions.map((option) => {
          const isSelected = config.pergola.automation === option.value;
          const Icon = option.icon;
          return (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-all duration-200",
                "hover:shadow-[var(--shadow-md)]",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 shadow-[var(--shadow-md)]"
                  : "border-border/60 hover:border-primary/40"
              )}
              onClick={() => onUpdatePergola({ automation: option.value })}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                  )}
                </div>
                {isSelected && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDeckStep = () => {
    const deckLimits = DIMENSION_LIMITS.deck;
    const swatches = config.deck.material === 'wood'
      ? [
          { name: 'Natural Oak', color: '#C2A278' },
          { name: 'Blonde Ash', color: '#D6BC92' },
          { name: 'Teak', color: '#B08A56' },
          { name: 'Spotted Gum', color: '#A0522D' },
          { name: 'Blackbutt', color: '#C08A55' },
          { name: 'Cedar', color: '#9C6B45' },
          { name: 'Merbau', color: '#6B3E2E' },
          { name: 'Jarrah', color: '#713B32' },
          { name: 'Walnut', color: '#55443A' },
          { name: 'Smoked Oak', color: '#4A3B2E' },
        ]
      : [
          { name: 'Coastal Oak', color: '#9A8065' },
          { name: 'Sand', color: '#C3AE8E' },
          { name: 'Silver Gum', color: '#817C73' },
          { name: 'Driftwood', color: '#8C7F6E' },
          { name: 'Walnut', color: '#55443A' },
          { name: 'Charcoal', color: '#3D4142' },
        ];
    const updateDimension = (key: 'length' | 'width' | 'height', value: number) => onUpdateDeck({
      dimensions: { ...config.deck.dimensions, [key]: value },
      ...(key === 'height' ? { height: value > 200 ? 'elevated' : 'ground' } : {}),
    });
    return (
      <div className="space-y-7">
        <div>
          <Label className="text-base font-semibold mb-3 block">Standard Size</Label>
          <div className="grid grid-cols-2 gap-2">
            {[{ l: 4000, w: 3000 }, { l: 5000, w: 4000 }, { l: 6000, w: 4000 }, { l: 7000, w: 5000 }].map((s) => (
              <Button key={`${s.l}-${s.w}`} type="button" variant="outline" onClick={() => onUpdateDeck({ dimensions: { ...config.deck.dimensions, length: s.l, width: s.w } })} className={cn(config.deck.dimensions.length === s.l && config.deck.dimensions.width === s.w && 'border-primary text-primary')}>
                {s.l / 1000}m × {s.w / 1000}m
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {(['length', 'width', 'height'] as const).map((key) => (
            <div key={key}>
              <div className="flex justify-between mb-2"><Label className="capitalize">Deck {key}</Label><span className="text-sm font-semibold">{Math.round(config.deck.dimensions[key] / 10)} cm</span></div>
              <Slider value={[config.deck.dimensions[key]]} onValueChange={([v]) => updateDimension(key, v)} min={deckLimits[key].min} max={deckLimits[key].max} step={key === 'height' ? 50 : 100} />
            </div>
          ))}
        </div>
        <div>
          <Label className="text-base font-semibold mb-3 block">Board Colour / Timber Species</Label>
          <div className="grid grid-cols-2 gap-2">
            {swatches.map((s) => <Button key={s.name} type="button" variant="outline" onClick={() => onUpdateDeck({ color: s.color, colorName: s.name })} className={cn('h-auto justify-start p-2', config.deck.color === s.color && 'border-primary ring-2 ring-primary/20')}><span className="h-8 w-8 rounded border border-border" style={{ backgroundColor: s.color }} /><span className="text-xs">{s.name}</span></Button>)}
          </div>
        </div>
        <div>
          <Label className="text-base font-semibold mb-3 block">Board Direction</Label>
          <div className="grid grid-cols-2 gap-2">{(['horizontal', 'vertical'] as const).map((dir) => <Button key={dir} type="button" variant="outline" onClick={() => onUpdateDeck({ boardDirection: dir })} className={cn('capitalize', config.deck.boardDirection === dir && 'border-primary text-primary')}>{dir}</Button>)}</div>
        </div>
        <div>
          <Label className="text-base font-semibold mb-3 block">Steps & Stairs</Label>
          <div className="space-y-3">{(['front', 'back', 'left', 'right'] as const).map((side) => {
            const stair = config.deck.stairs[side];
            return <div key={side} className="rounded-lg border border-border p-3"><div className="flex items-center justify-between"><Label className="capitalize">{side}</Label><Switch checked={stair.enabled} onCheckedChange={(enabled) => onUpdateDeck({ stairs: { ...config.deck.stairs, [side]: { ...stair, enabled } } })} /></div>{stair.enabled && <div className="mt-3"><div className="flex justify-between text-xs text-muted-foreground mb-2"><span>Stair width</span><span>{stair.width / 1000}m</span></div><Slider value={[stair.width]} min={800} max={3000} step={100} onValueChange={([width]) => onUpdateDeck({ stairs: { ...config.deck.stairs, [side]: { ...stair, width } } })} /></div>}</div>;
          })}</div>
        </div>
        <div>
          <Label className="text-base font-semibold mb-3 block">Balustrade</Label>
          <div className="grid grid-cols-3 gap-2">{([{ value: 'none', label: 'None' }, { value: 'aluminum', label: 'Aluminium' }, { value: 'glass', label: 'Glass' }] as const).map((r) => <Button key={r.value} type="button" variant="outline" onClick={() => onUpdateDeck({ railingType: r.value, handrailType: r.value === 'none' ? 'none' : (config.deck.handrailType === 'none' ? 'aluminum' : config.deck.handrailType) })} className={cn('px-2', config.deck.railingType === r.value && 'border-primary text-primary')}>{r.label}</Button>)}</div>
        </div>
        {config.deck.railingType !== 'none' && <div><Label className="text-base font-semibold mb-3 block">Handrail</Label><div className="grid grid-cols-3 gap-2">{([{ value: 'none', label: 'None' }, { value: 'aluminum', label: 'Aluminium' }, { value: 'timber', label: 'Timber' }] as const).map((h) => <Button key={h.value} type="button" variant="outline" onClick={() => onUpdateDeck({ handrailType: h.value })} className={cn('px-2', config.deck.handrailType === h.value && 'border-primary text-primary')}>{h.label}</Button>)}</div></div>}
      </div>
    );
  };

  const renderGarageDoorsStep = () => {
    const options: { value: 'panel-lift' | 'garage-door'; label: string; description: string }[] = [
      { value: 'panel-lift', label: 'Panel-lift', description: 'Sectional panel-lift door' },
      { value: 'garage-door', label: 'Garage door', description: 'Ribbed roller garage door' },
    ];
    const current = config.pergola.garageDoor ?? 'none';

    return (
      <div className="space-y-3">
        {options.map((option) => {
          const selected = current === option.value;
          return (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-all duration-200",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border/60 hover:border-primary/40"
              )}
              onClick={() => onUpdatePergola({
                garageDoor: selected ? 'none' : option.value,
                garageDoorOpenness: 0,
              })}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                {selected && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {current !== 'none' && (
          <div className="pt-3">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-semibold">Door Opening</Label>
              <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {config.pergola.garageDoorOpenness ?? 0}%
              </span>
            </div>
            <Slider
              value={[config.pergola.garageDoorOpenness ?? 0]}
              onValueChange={([value]) => onUpdatePergola({ garageDoorOpenness: value })}
              min={0}
              max={100}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Closed</span>
              <span>Fully Open</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSummaryStep = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
        <CardContent className="p-6 text-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="text-sm font-medium text-muted-foreground mb-2">Estimated Price Range</div>
          <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {formatPrice(config.estimatedPrice.min)} – {formatPrice(config.estimatedPrice.max)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Final price determined after site assessment
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <div className="flex justify-between py-3 px-4 rounded-lg bg-muted/30">
          <span className="text-muted-foreground font-medium">Structure Type</span>
          <span className="font-semibold text-foreground capitalize">{config.structureType}</span>
        </div>
        
        {showPergolaOptions && (
          <>
            <div className="flex justify-between py-3 px-4 rounded-lg">
              <span className="text-muted-foreground font-medium">Dimensions</span>
              <span className="font-semibold text-foreground">
                {formatDimension(config.pergola.dimensions.length)} × {formatDimension(config.pergola.dimensions.width)}
              </span>
            </div>
            <div className="flex justify-between py-3 px-4 rounded-lg bg-muted/30">
              <span className="text-muted-foreground font-medium">Style</span>
              <span className="font-semibold text-foreground capitalize">{config.pergola.type}</span>
            </div>
            <div className="flex justify-between py-3 px-4 rounded-lg">
              <span className="text-muted-foreground font-medium">Material</span>
              <span className="font-semibold text-foreground capitalize">{config.pergola.material}</span>
            </div>
            <div className="flex justify-between py-3 px-4 rounded-lg bg-muted/30">
              <span className="text-muted-foreground font-medium">Roof</span>
              <span className="font-semibold text-foreground capitalize">{config.pergola.roofType}</span>
            </div>
          </>
        )}
        
        {(showDeckOptions || config.includeDeck) && (
          <>
            <div className="flex justify-between py-3 px-4 rounded-lg"><span className="text-muted-foreground font-medium">Deck</span><span className="font-semibold text-foreground capitalize">{config.deck.shape.replace('-', ' ')}</span></div>
            <div className="flex justify-between py-3 px-4 rounded-lg bg-muted/30"><span className="text-muted-foreground font-medium">Deck Material</span><span className="font-semibold text-foreground capitalize">{config.deck.material} · {config.deck.colorName}</span></div>
            <div className="flex justify-between py-3 px-4 rounded-lg"><span className="text-muted-foreground font-medium">Deck Height</span><span className="font-semibold text-foreground">{Math.round(config.deck.dimensions.height / 10)} cm</span></div>
            <div className="flex justify-between py-3 px-4 rounded-lg bg-muted/30"><span className="text-muted-foreground font-medium">Balustrade</span><span className="font-semibold text-foreground capitalize">{config.deck.railingType}</span></div>
          </>
        )}
      </div>

      <Button 
        className="w-full h-12 text-base font-semibold shadow-[0_4px_14px_hsl(var(--primary)/0.3)]"
        onClick={() => setShowQuoteForm(true)}
      >
        Get My Free Quote
      </Button>
      
      <QuoteFormDialog 
        open={showQuoteForm} 
        onOpenChange={setShowQuoteForm}
        config={config}
        pricing={pricing}
        onCaptureDesign={onCaptureDesign}
        editMode={editMode}
        editQuoteId={editQuoteId}
        editToken={editToken}
      />
    </div>
  );

  // Build the list of sections to render in scroll mode
  const sections = [
    ...(showPergolaOptions ? [
      { id: 'style', label: 'Style', icon: Grid3X3, render: renderStyleStep },
    ] : [
      { id: 'style', label: 'Style', icon: Grid3X3, render: renderStyleStep },
    ]),
    { id: 'dimensions', label: 'Size', icon: Ruler, render: renderDimensionsStep },
    { id: 'materials', label: 'Materials', icon: Palette, render: renderMaterialsStep },
    ...(showPergolaOptions ? [
      { id: 'panels', label: 'Panels', icon: Layers, render: renderPanelsStep },
      { id: 'roof', label: 'Roof', icon: Home, render: renderRoofStep },
      ...(config.pergola.type === 'luxe'
        ? [{ id: 'garage', label: 'Garage Doors', icon: DoorClosed, render: renderGarageDoorsStep }]
        : []),
      { id: 'lighting', label: 'Extras', icon: Lightbulb, render: renderLightingStep },
      { id: 'automation', label: 'Automation', icon: Settings, render: renderAutomationStep },
    ] : []),
    ...(showDeckOptions ? [{ id: 'deck', label: 'Deck', icon: Layers, render: renderDeckStep }] : []),
    { id: 'summary', label: 'Quote', icon: FileText, render: renderSummaryStep },
  ];

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-5 border-b border-border/50 bg-gradient-to-b from-muted/40 to-transparent">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground -ml-2 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Start Over
          </Button>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-xs font-semibold text-primary capitalize">{config.structureType}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content with all sections */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className={cn(index > 0 && "border-t border-border/50")}>
              {/* Section header */}
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm px-5 py-3 flex items-center gap-3 border-b border-border/30">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-base font-bold text-foreground tracking-tight">{section.label}</h2>
              </div>
              {/* Section content */}
              <div className="p-5">
                {section.render()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky price footer */}
      {config.estimatedPrice.min > 0 && (
        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Estimated Price</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(config.estimatedPrice.min)} – {formatPrice(config.estimatedPrice.max)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
