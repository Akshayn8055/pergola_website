import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getQuoteByToken, updateQuote, type Quote } from "@/lib/quotesStore";
import { generateQuotePDF } from "@/lib/generateQuotePDF";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, X, Loader2, Download, Pencil, User, MapPin, Phone, Mail, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function CustomerEstimate() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [responded, setResponded] = useState<"confirmed" | "declined" | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id || !token) { setLoading(false); return; }
    getQuoteByToken(id, token).then((q) => {
      setQuote(q);
      if (q && (q.status === "Quote confirmed" || q.is_qualified)) setResponded("confirmed");
      else if (q && q.status === "Declined") setResponded("declined");
      setLoading(false);
    });
  }, [id, token]);

  const handleAction = async (action: "confirm" | "decline") => {
    if (!quote || !token) return;
    setActioning(true);
    const updates: any = action === "confirm"
      ? { status: "Quote confirmed", is_qualified: true }
      : { status: "Declined" };
    await updateQuote(quote.id, updates);

    try {
      await supabase.functions.invoke("ghl-webhook", {
        body: {
          event: action === "confirm" ? "quote_confirmed" : "quote_declined",
          quote_id: quote.id,
          status: action === "confirm" ? "confirmed" : "declined",
          customer_name: quote.customer_name,
          customer_email: quote.customer_email,
          customer_phone: quote.customer_phone,
          price: quote.total_price || quote.price,
        },
      });
    } catch {}

    setResponded(action === "confirm" ? "confirmed" : "declined");
    setActioning(false);
    toast({ title: action === "confirm" ? "Quote confirmed! We'll be in touch." : "Quote declined." });
  };

  const handleDownloadPDF = async () => {
    if (!quote) return;
    setDownloading(true);
    try {
      if (quote.pdf_url) {
        window.open(quote.pdf_url, "_blank");
      } else {
        await generateQuotePDF(quote);
        toast({ title: "PDF generated and downloading" });
      }
    } catch {
      toast({ title: "PDF generation failed", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const handleEditDesign = () => {
    if (!quote || !token) return;
    navigate(`/configurator?quote_id=${quote.id}&token=${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Estimate Not Found</h1>
          <p className="text-muted-foreground">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  if (responded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 max-w-md">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${responded === "confirmed" ? "bg-emerald-100" : "bg-orange-100"}`}>
            {responded === "confirmed" ? <Check className="h-8 w-8 text-emerald-600" /> : <X className="h-8 w-8 text-orange-600" />}
          </div>
          <h1 className="text-2xl font-bold">{responded === "confirmed" ? "Thank You!" : "Quote Declined"}</h1>
          <p className="text-muted-foreground">
            {responded === "confirmed"
              ? "Your estimate has been confirmed. A member of our team will contact you shortly to arrange the next steps."
              : "You've declined this estimate. If you change your mind, feel free to reach out to us."}
          </p>
        </div>
      </div>
    );
  }

  const fmt = (v: number) => `€${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Estimate #{quote.quote_number}</h1>
            <p className="text-sm text-muted-foreground">Created {new Date(quote.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{fmt(quote.total_price || quote.price)}</p>
            <p className="text-xs text-muted-foreground">Total Estimate</p>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr_220px] gap-6">
        {/* LEFT: Customer Info */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{quote.customer_name}</span>
              </div>
              {quote.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{quote.customer_email}</span>
                </div>
              )}
              {quote.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{quote.customer_phone}</span>
                </div>
              )}
              {quote.customer_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{quote.customer_address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project Details</h3>
            <div className="space-y-2 text-sm">
              {quote.structure_type && <DetailRow label="Structure" value={quote.structure_type} />}
              {quote.pergola_type && <DetailRow label="Pergola Type" value={quote.pergola_type} />}
              {quote.dimensions && <DetailRow label="Dimensions" value={quote.dimensions} />}
              {quote.material && <DetailRow label="Material" value={quote.material} />}
              {quote.roof_type && <DetailRow label="Roof" value={quote.roof_type} />}
              {quote.mounting && <DetailRow label="Mounting" value={quote.mounting} />}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Budget & Timeline</h3>
            <div className="space-y-2 text-sm">
              {quote.budget && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{quote.budget}</span>
                </div>
              )}
              {quote.timeline && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{quote.timeline}</span>
                </div>
              )}
            </div>
          </div>

          {quote.sales_rep && (
            <div className="bg-card rounded-lg border border-border p-5 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sales Representative</h3>
              <p className="text-sm font-medium">{quote.sales_rep}</p>
              {quote.sales_rep_email && <p className="text-xs text-muted-foreground">{quote.sales_rep_email}</p>}
            </div>
          )}
        </div>

        {/* CENTER: Design Preview */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {quote.design_image ? (
              <img
                src={quote.design_image}
                alt="3D Design Preview"
                className="w-full aspect-video object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full aspect-video bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No design preview available</p>
              </div>
            )}
          </div>

          {/* Config summary below image */}
          {(quote.panels || quote.lighting) && (
            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Configuration Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {quote.panels && typeof quote.panels === "object" && (
                  <div>
                    <p className="font-medium mb-1">Side Panels</p>
                    {Object.entries(quote.panels as Record<string, any>).map(([side, p]) =>
                      p?.enabled && p?.type !== "open" ? (
                        <p key={side} className="text-muted-foreground capitalize">{side}: {p.type}</p>
                      ) : null
                    )}
                  </div>
                )}
                {quote.lighting && typeof quote.lighting === "object" && (
                  <div>
                    <p className="font-medium mb-1">Lighting</p>
                    {(quote.lighting as any).ledStrips && <p className="text-muted-foreground">LED Strips</p>}
                    {(quote.lighting as any).spotlights && <p className="text-muted-foreground">Spotlights</p>}
                    {(quote.lighting as any).ceilingFan && <p className="text-muted-foreground">Ceiling Fan</p>}
                    {(quote.lighting as any).heaters && <p className="text-muted-foreground">Heaters</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price breakdown */}
          {(quote.base_price > 0 || quote.total_price > 0) && (
            <div className="bg-card rounded-lg border border-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                {quote.base_price > 0 && <DetailRow label="Base Structure" value={fmt(quote.base_price)} />}
                {quote.roof_price > 0 && <DetailRow label="Roof System" value={fmt(quote.roof_price)} />}
                {quote.panel_price > 0 && <DetailRow label="Side Panels" value={fmt(quote.panel_price)} />}
                {quote.lighting_price > 0 && <DetailRow label="Lighting & Accessories" value={fmt(quote.lighting_price)} />}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Estimate</span>
                  <span className="text-primary">{fmt(quote.total_price || quote.price)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            size="lg"
            onClick={() => handleAction("confirm")}
            disabled={actioning}
          >
            {actioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirm Quote
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            size="lg"
            onClick={() => handleAction("decline")}
            disabled={actioning}
          >
            <X className="h-4 w-4" /> Decline
          </Button>
          <Separator />
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleEditDesign}
          >
            <Pencil className="h-4 w-4" /> Edit Design
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize text-right">{value}</span>
    </div>
  );
}
