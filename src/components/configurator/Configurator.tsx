import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfigurator } from '@/hooks/useConfigurator';
import { getQuoteByToken } from '@/lib/quotesStore';
import { StructureSelection } from './StructureSelection';
import { Scene3D, type Scene3DHandle } from './Scene3D';
import { ConfigPanel } from './ConfigPanel';
import { ARQRDialog } from './ARQRDialog';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Configurator = () => {
  const [arDialogOpen, setArDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const editQuoteId = searchParams.get('quote_id');
  const editToken = searchParams.get('token');
  const newDesignKey = searchParams.get('new');
  const [editMode, setEditMode] = useState(false);
  const sceneRef = useRef<Scene3DHandle>(null);
  const {
    state,
    pricing,
    setStructureType,
    updatePergola,
    updateDeck,
    nextStep,
    prevStep,
    setCurrentStep,
    toggleDeck,
    resetConfigurator,
    loadFromQuote,
  } = useConfigurator();

  useEffect(() => {
    if (newDesignKey && !editQuoteId && !editToken) {
      resetConfigurator();
      setEditMode(false);
    }
  }, [newDesignKey, editQuoteId, editToken, resetConfigurator]);

  // Load quote for editing
  useEffect(() => {
    if (editQuoteId && editToken) {
      getQuoteByToken(editQuoteId, editToken).then((quote) => {
        if (quote) {
          loadFromQuote(quote);
          setEditMode(true);
        }
      });
    }
  }, [editQuoteId, editToken, loadFromQuote]);

  const handleStructureSelect = (type: any, pergolaType?: string, roofType?: string) => {
    setStructureType(type);
    if (type === 'deck' || type === 'combo') {
      updateDeck({
        dimensions: type === 'combo'
          ? { length: 7000, width: 5000, height: 450 }
          : { length: 5000, width: 4000, height: 1050 },
        height: 'elevated',
      });
    }
    if (pergolaType) {
      const updates: any = { type: pergolaType };
      if (pergolaType === 'luxe') {
        updates.dimensions = { length: 6000, width: 6000, height: 2500 };
        updates.carSpaces = 2;
        updates.garageDoor = 'none';
      } else if (pergolaType === 'fabric') {
        updates.dimensions = { length: 7000, width: 3000, height: 2500 };
        updates.mounting = 'freestanding';
        const sideBlind = {
          enabled: true,
          type: 'blind-regent',
          color: '#323233', // Monument
          frameColor: '#474747',
          fabricOpenness: 5,
          operation: 'motorised',
          openness: 50, // Half closed
        };
        updates.panels = {
          front: { enabled: false, type: 'open', color: '#323233', openness: 0 },
          back: { ...sideBlind, fabricOpenness: 1, openness: 100 },
          left: { ...sideBlind },
          right: { ...sideBlind },
        };
      } else if (pergolaType === 'glass') {
        updates.dimensions = { length: 6000, width: 4000, height: 2500 };
      } else if (pergolaType === 'builder') {
        updates.dimensions = { length: 7000, width: 3000, height: 2500 };
        updates.louveredAngle = 45; // Half open by default for 200mm louvres
      } else if (pergolaType === 'enclosure') {
        updates.dimensions = { length: 6000, width: 5000, height: 3000 };
        updates.panels = {
          front: { enabled: true, type: 'sliding-glass-door', color: '#8B5A2B', openness: 0 },
          back: { enabled: true, type: 'fixed-glass-wall', color: '#8B5A2B', openness: 0 },
          left: { enabled: true, type: 'fixed-glass-wall', color: '#8B5A2B', openness: 0 },
          right: { enabled: true, type: 'fixed-glass-wall', color: '#8B5A2B', openness: 0 },
        };
      } else if (pergolaType === 'pro') {
        updates.dimensions = { length: 7000, width: 3000, height: 2500 };
      }
      if (roofType) {
        updates.roofType = roofType;
      }
      updatePergola(updates);
    }
  };

  if (!state.structureType) {
    return <StructureSelection onSelect={handleStructureSelect} />;
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-background">
      <div className="flex-1 h-[45vh] lg:h-full order-1 lg:order-1 relative">
        <Scene3D ref={sceneRef} config={state} />
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-[var(--shadow-md)]">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-foreground">
              {editMode ? 'Editing Quote' : 'Live Preview'}
            </span>
          </div>
          <Button
            onClick={() => setArDialogOpen(true)}
            size="sm"
            className="rounded-full gap-2 bg-card/90 backdrop-blur-sm border border-border/50 shadow-[var(--shadow-md)] text-foreground hover:bg-card"
            variant="ghost"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">View in AR</span>
          </Button>
        </div>
      </div>

      <div className="w-full lg:w-[360px] xl:w-[380px] h-[55vh] lg:h-full flex-shrink-0 border-l border-border/50 order-2 lg:order-2 shadow-[var(--shadow-lg)] lg:shadow-none z-10">
        <ConfigPanel
          config={state}
          pricing={pricing}
          onUpdatePergola={updatePergola}
          onUpdateDeck={updateDeck}
          onNextStep={nextStep}
          onPrevStep={prevStep}
          onSetStep={setCurrentStep}
          onToggleDeck={toggleDeck}
          onReset={resetConfigurator}
          onCaptureDesign={() => sceneRef.current?.captureScreenshot() ?? null}
          editMode={editMode}
          editQuoteId={editQuoteId || undefined}
          editToken={editToken || undefined}
        />
      </div>

      <ARQRDialog open={arDialogOpen} onOpenChange={setArDialogOpen} config={state} />
    </div>
  );
};
