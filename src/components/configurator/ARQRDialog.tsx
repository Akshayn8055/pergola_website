import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConfiguratorState } from '@/types/configurator';
import { Smartphone, ScanLine } from 'lucide-react';

interface ARQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConfiguratorState;
}

const buildARUrl = (config: ConfiguratorState): string => {
  const pergolaData = {
    type: config.pergola.type,
    mounting: config.pergola.mounting,
    dimensions: config.pergola.dimensions,
    material: config.pergola.material,
    frameColor: config.pergola.frameColor,
    roofType: config.pergola.roofType,
    roofColor: config.pergola.roofColor,
    panels: config.pergola.panels,
    louveredAngle: config.pergola.louveredAngle,
    retractableOpenness: config.pergola.retractableOpenness,
  };

  const encoded = btoa(JSON.stringify(pergolaData));
  // Always use the public published URL so scanning the QR code never hits an auth wall
  const baseUrl = 'https://pergola-configurator.lovable.app';
  return `${baseUrl}/ar?config=${encoded}`;
};

export const ARQRDialog = ({ open, onOpenChange, config }: ARQRDialogProps) => {
  const arUrl = buildARUrl(config);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="w-5 h-5 text-primary" />
            View in Your Space
          </DialogTitle>
          <DialogDescription className="text-sm">
            Scan this QR code with your phone to see the pergola in your actual garden or patio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {/* QR Code */}
          <div className="relative p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG
              value={arUrl}
              size={220}
              level="M"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#1a1a1a"
            />
            {/* Scan overlay animation */}
            <div className="absolute inset-4 pointer-events-none overflow-hidden rounded-sm">
              <div className="absolute inset-x-0 h-0.5 bg-primary/50 animate-scan" />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 w-full">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <ScanLine className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">How it works</p>
                <ol className="text-muted-foreground text-xs space-y-1 list-decimal list-inside">
                  <li>Open your phone's camera</li>
                  <li>Point it at the QR code</li>
                  <li>Tap the link that appears</li>
                  <li>Tap "View in Your Space" to activate camera</li>
                  <li>Move your phone to place the pergola</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
