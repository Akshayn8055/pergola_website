import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfiguratorState } from '@/types/configurator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createQuote, getNextQuoteNumber, updateQuote, updateQuoteByToken, uploadDesignImage } from '@/lib/quotesStore';
import { calculatePriceBreakdown } from '@/lib/priceCalculator';
import type { PricingConfig } from '@/lib/pricingConfig';
import { generateQuotePDF } from '@/lib/generateQuotePDF';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/businessConfig';

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConfiguratorState;
  pricing: PricingConfig;
  onCaptureDesign?: () => string | null;
  editMode?: boolean;
  editQuoteId?: string;
  editToken?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
}

export const QuoteFormDialog = ({ open, onOpenChange, config, pricing, onCaptureDesign, editMode, editQuoteId, editToken }: QuoteFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '', phone: '', email: '', postcode: '', address: '',
    projectType: '', budget: '', timeline: '', description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.email || !formData.postcode || !formData.projectType || !formData.budget || !formData.timeline) {
      toast({ title: "Missing required fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const designImage = onCaptureDesign ? onCaptureDesign() : null;
    const priceBreakdown = calculatePriceBreakdown(config, pricing);
    const avgPrice = (config.estimatedPrice.min + config.estimatedPrice.max) / 2;

    const configFields = {
      roof_type: config.pergola?.roofType || null,
      panels: config.structureType === 'deck'
        ? { __deck: config.deck }
        : { ...(config.pergola?.panels || {}), ...(config.structureType === 'combo' ? { __deck: config.deck } : {}) },
      lighting: config.pergola?.lighting || null,
      frame_color: config.pergola?.frameColor || null,
      roof_color: config.pergola?.roofColor || null,
      mounting: config.pergola?.mounting || null,
      mounted_side: config.pergola?.mountedSide || null,
      pergola_type: config.pergola?.type || null,
      automation: config.pergola?.automation || null,
      louvered_angle: config.pergola?.louveredAngle ?? null,
      retractable_openness: config.pergola?.retractableOpenness ?? null,
      notes: formData.description || null,
      base_price: priceBreakdown.base_price,
      roof_price: priceBreakdown.roof_price,
      panel_price: priceBreakdown.panel_price,
      lighting_price: priceBreakdown.lighting_price,
      total_price: priceBreakdown.total_price,
    };

    let savedQuote: any = null;

    if (editMode && editQuoteId) {
      // Update existing quote
      const updatePayload = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_address: formData.address || null,
        customer_phone: formData.phone,
        order_description: config.structureType === 'deck' ? `Custom Deck – ${config.deck.shape}` : `${config.structureType} – ${config.pergola?.type || "custom"}`,
        price: avgPrice,
        budget: formData.budget || null,
        timeline: formData.timeline || null,
        structure_type: config.structureType || null,
        dimensions: `${((config.structureType === 'deck' ? config.deck : config.pergola).dimensions.length / 1000).toFixed(2)}m × ${((config.structureType === 'deck' ? config.deck : config.pergola).dimensions.width / 1000).toFixed(2)}m × ${((config.structureType === 'deck' ? config.deck : config.pergola).dimensions.height / 1000).toFixed(2)}m`,
        material: config.structureType === 'deck' ? config.deck.material : config.pergola?.material || null,
        style: config.structureType === 'deck' ? config.deck.shape : config.pergola?.type || null,
        ...configFields,
      } as any;
      savedQuote = editToken
        ? await updateQuoteByToken(editQuoteId, editToken, updatePayload)
        : await updateQuote(editQuoteId, updatePayload);
    } else {
      // Create new quote
      const quoteNumber = await getNextQuoteNumber();
      savedQuote = await createQuote({
        quote_number: quoteNumber,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_address: formData.address || null,
        customer_phone: formData.phone,
        sales_rep: null,
        sales_rep_email: null,
        order_description: config.structureType === 'deck' ? `Custom Deck – ${config.deck.shape}` : `${config.structureType} – ${config.pergola?.type || "custom"}`,
        price: avgPrice,
        status: "Quote",
        is_hot: false,
        is_viewed: false,
        is_sent: false,
        is_archived: false,
        is_draft: false,
        budget: formData.budget || null,
        timeline: formData.timeline || null,
        email_consent: true,
        structure_type: config.structureType || null,
        dimensions: `${((config.structureType === 'deck' ? config.deck : config.pergola).dimensions.length / 1000).toFixed(2)}m × ${((config.structureType === 'deck' ? config.deck : config.pergola).dimensions.width / 1000).toFixed(2)}m × ${((config.structureType === 'deck' ? config.deck : config.pergola).dimensions.height / 1000).toFixed(2)}m`,
        material: config.structureType === 'deck' ? config.deck.material : config.pergola?.material || null,
        style: config.structureType === 'deck' ? config.deck.shape : config.pergola?.type || null,
        design_image: designImage,
        ...configFields,
      } as any);
    }

    // Upload design image
    if (savedQuote && designImage) {
      const imageUrl = await uploadDesignImage(savedQuote.id, designImage);
      if (imageUrl) {
        if (savedQuote.edit_token) {
          await updateQuoteByToken(savedQuote.id, savedQuote.edit_token, { design_image: imageUrl } as any);
        } else {
          await updateQuote(savedQuote.id, { design_image: imageUrl } as any);
        }
        savedQuote.design_image = imageUrl;
      }
    }

    // Generate PDF
    if (savedQuote) {
      try {
        const pdfUrl = await generateQuotePDF(savedQuote, savedQuote.edit_token || undefined);
        if (pdfUrl) savedQuote.pdf_url = pdfUrl;
      } catch (err) {
        console.error("PDF generation failed:", err);
      }
    }

    // Send transactional emails through the Supabase email function.
    if (savedQuote) {
      try {
        const estimateUrl = `${window.location.origin}/estimate/${savedQuote.id}?token=${savedQuote.edit_token}`;
        await supabase.functions.invoke("send-email", {
          body: {
            event: editMode ? "quote_updated" : "quote_created",
            quote: savedQuote,
            estimate_url: estimateUrl,
          },
        });
      } catch (err) {
        console.error("Email notification failed:", err);
      }
    }

    toast({
      title: editMode ? "Quote Updated!" : "Quote Request Submitted!",
      description: editMode
        ? "Your design has been updated successfully."
        : "We'll get back to you within 24-48 hours with your personalized quote.",
    });

    setIsSubmitting(false);
    onOpenChange(false);

    // If editing, redirect back to estimate
    if (editMode && editQuoteId && editToken) {
      window.location.href = `/estimate/${editQuoteId}?token=${editToken}`;
      return;
    }

    setFormData({ name: '', phone: '', email: '', postcode: '', address: '', projectType: '', budget: '', timeline: '', description: '' });
  };

  const formatDimension = (mm: number) => `${(mm / 1000).toFixed(2)}m`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Update Your Quote' : 'Get Your Free Quote'}</DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Review your updated design and submit your changes.'
              : `Enter your details and we'll send you a detailed quote for your custom ${config.structureType} design.`}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
          <div className="font-medium mb-2">Your Configuration:</div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Structure:</span>
            <span className="capitalize">{config.structureType}</span>
          </div>
          {(config.structureType === 'pergola' || config.structureType === 'combo') && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dimensions:</span>
                <span>{formatDimension(config.pergola.dimensions.length)} × {formatDimension(config.pergola.dimensions.width)} × {formatDimension(config.pergola.dimensions.height)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Style:</span>
                <span className="capitalize">{config.pergola.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material:</span>
                <span className="capitalize">{config.pergola.material}</span>
              </div>
            </>
          )}
          {(config.structureType === 'deck' || config.structureType === 'combo') && (
            <>
              <div className="flex justify-between"><span className="text-muted-foreground">Deck:</span><span className="capitalize">{config.deck.shape.replace('-', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deck size:</span><span>{formatDimension(config.deck.dimensions.length)} × {formatDimension(config.deck.dimensions.width)} × {formatDimension(config.deck.dimensions.height)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Boards:</span><span className="capitalize">{config.deck.material} · {config.deck.colorName}</span></div>
            </>
          )}
          <div className="flex justify-between font-medium pt-2 border-t mt-2">
            <span>Estimated Price:</span>
            <span className="text-primary">{formatCurrency(config.estimatedPrice.min)} - {formatCurrency(config.estimatedPrice.max)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0412 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                placeholder="2000"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Property Address</Label>
            <Input
              id="address"
              placeholder="123 Example Street, Sydney NSW"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type *</Label>
              <Select 
                value={formData.projectType} 
                onValueChange={(value) => setFormData({ ...formData, projectType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-construction">New Construction</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                  <SelectItem value="addition">Addition to Existing</SelectItem>
                  <SelectItem value="replacement">Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Your Budget *</Label>
              <Select 
                value={formData.budget} 
                onValueChange={(value) => setFormData({ ...formData, budget: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-10k">Under A$10,000</SelectItem>
                  <SelectItem value="10k-20k">A$10,000 - A$20,000</SelectItem>
                  <SelectItem value="20k-35k">A$20,000 - A$35,000</SelectItem>
                  <SelectItem value="35k-50k">A$35,000 - A$50,000</SelectItem>
                  <SelectItem value="over-50k">Over A$50,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Project Timeline *</Label>
            <Select 
              value={formData.timeline} 
              onValueChange={(value) => setFormData({ ...formData, timeline: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="When do you want to start?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">As soon as possible</SelectItem>
                <SelectItem value="1-3-months">1-3 months</SelectItem>
                <SelectItem value="3-6-months">3-6 months</SelectItem>
                <SelectItem value="6-12-months">6-12 months</SelectItem>
                <SelectItem value="just-planning">Just planning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tell Us About Your Project</Label>
            <Textarea
              id="description"
              placeholder="Describe your outdoor living goals, approximate size, any specific features you'd like..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              editMode ? 'Update My Quote' : 'Get My Free Quote'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to be contacted about your project. 
            We respect your privacy and never share your information.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
