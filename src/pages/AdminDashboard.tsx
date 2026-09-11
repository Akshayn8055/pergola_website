import { useEffect, useMemo, useState } from "react";
import { Archive, Download, Eye, Loader2, LogOut, Mail, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { addActivity, ensurePipeline, getActivities, getPipelines, STAGES, updatePipeline, type LeadActivity, type LeadPipeline } from "@/lib/pipelineStore";
import { deleteQuote, getQuotes, updateQuote, type Quote } from "@/lib/quotesStore";
import { formatCurrency } from "@/lib/businessConfig";
import { DEFAULT_PRICING_CONFIG, getPricingConfig, savePricingConfig } from "@/lib/pricingConfig";
import { supabase } from "@/integrations/supabase/client";

const statusOptions = ["Quote", "Quote sent", "Quote confirmed", "Declined", "Qualified", "Archived"];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pipelines, setPipelines] = useState<LeadPipeline[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [pricingDraft, setPricingDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedQuote = quotes.find((quote) => quote.id === selectedId) || quotes[0] || null;
  const selectedPipeline = selectedQuote ? pipelines.find((pipeline) => pipeline.quote_id === selectedQuote.id) : null;

  const filteredQuotes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return quotes;
    return quotes.filter((quote) =>
      [quote.quote_number, quote.customer_name, quote.customer_email, quote.customer_phone, quote.status, quote.structure_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [quotes, query]);

  const loadDashboard = async () => {
    setLoading(true);
    const [quotesData, pipelineData, pricingData] = await Promise.all([getQuotes(), getPipelines(), getPricingConfig()]);
    setQuotes(quotesData);
    setPipelines(pipelineData);
    setPricingDraft(JSON.stringify(pricingData, null, 2));
    setSelectedId((current) => current || quotesData[0]?.id || null);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedQuote) {
      setActivities([]);
      return;
    }
    ensurePipeline(selectedQuote.id).then((pipeline) => {
      if (pipeline) {
        setPipelines((current) => {
          const exists = current.some((item) => item.quote_id === pipeline.quote_id);
          return exists ? current.map((item) => (item.quote_id === pipeline.quote_id ? pipeline : item)) : [...current, pipeline];
        });
      }
    });
    getActivities(selectedQuote.id).then(setActivities);
  }, [selectedQuote?.id]);

  const patchQuote = async (updates: Partial<Quote>) => {
    if (!selectedQuote) return;
    setSaving(true);
    const updated = await updateQuote(selectedQuote.id, updates);
    if (updated) {
      setQuotes((current) => current.map((quote) => (quote.id === updated.id ? updated : quote)));
      toast({ title: "Quote updated" });
    } else {
      toast({ title: "Update failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const patchPipeline = async (updates: Partial<Omit<LeadPipeline, "id" | "quote_id" | "created_at" | "updated_at">>) => {
    if (!selectedQuote) return;
    setSaving(true);
    const updated = await updatePipeline(selectedQuote.id, updates);
    if (updated) {
      setPipelines((current) => current.map((pipeline) => (pipeline.quote_id === updated.quote_id ? updated : pipeline)));
      toast({ title: "Pipeline updated" });
    } else {
      toast({ title: "Pipeline update failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const saveNote = async () => {
    if (!selectedQuote || !note.trim()) return;
    const created = await addActivity(selectedQuote.id, "note", note.trim());
    if (created) {
      setActivities((current) => [created, ...current]);
      setNote("");
      toast({ title: "Note added" });
    }
  };

  const resendEmail = async () => {
    if (!selectedQuote) return;
    setSaving(true);
    const estimateUrl = `${window.location.origin}/estimate/${selectedQuote.id}?token=${selectedQuote.edit_token}`;
    const { error } = await supabase.functions.invoke("send-email", {
      body: { event: "quote_created", quote: selectedQuote, estimate_url: estimateUrl },
    });
    await updateQuote(selectedQuote.id, { is_sent: !error } as Partial<Quote>);
    setSaving(false);
    toast({ title: error ? "Email failed" : "Email sent", description: error?.message, variant: error ? "destructive" : "default" });
  };

  const removeSelectedQuote = async () => {
    if (!selectedQuote) return;
    const ok = window.confirm(`Delete quote ${selectedQuote.quote_number}? This cannot be undone.`);
    if (!ok) return;
    const deleted = await deleteQuote(selectedQuote.id);
    if (deleted) {
      setQuotes((current) => current.filter((quote) => quote.id !== selectedQuote.id));
      setSelectedId(null);
      toast({ title: "Quote deleted" });
    }
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(pricingDraft);
      const saved = await savePricingConfig(parsed);
      toast({ title: saved ? "Pricing saved" : "Pricing save failed", variant: saved ? "default" : "destructive" });
    } catch {
      toast({ title: "Invalid pricing JSON", description: "Fix the JSON format before saving.", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Quotes, leads and follow-up workflow</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={loadDashboard} disabled={saving}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" className="gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search quotes" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="max-h-[calc(100vh-170px)] overflow-y-auto">
            {filteredQuotes.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No quote requests yet.</p>
            ) : (
              filteredQuotes.map((quote) => (
                <button
                  key={quote.id}
                  type="button"
                  onClick={() => setSelectedId(quote.id)}
                  className={`w-full border-b p-4 text-left transition hover:bg-muted/60 ${selectedQuote?.id === quote.id ? "bg-muted" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{quote.customer_name}</p>
                      <p className="text-xs text-muted-foreground">#{quote.quote_number} · {quote.structure_type || "Project"}</p>
                    </div>
                    <Badge variant={quote.status === "Quote confirmed" ? "default" : "secondary"}>{quote.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">{formatCurrency(quote.total_price || quote.price)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {selectedQuote ? (
          <section className="space-y-6">
            <div className="rounded-lg border bg-card p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h2 className="text-xl font-bold">Quote #{selectedQuote.quote_number}</h2>
                  <p className="text-sm text-muted-foreground">{new Date(selectedQuote.created_at).toLocaleString("en-AU")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedQuote.pdf_url && (
                    <Button asChild variant="outline" className="gap-2">
                      <a href={selectedQuote.pdf_url} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> PDF</a>
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2" onClick={resendEmail} disabled={saving}>
                    <Mail className="h-4 w-4" /> Resend Email
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => patchQuote({ is_archived: true, status: "Archived" })} disabled={saving}>
                    <Archive className="h-4 w-4" /> Archive
                  </Button>
                  <Button variant="destructive" className="gap-2" onClick={removeSelectedQuote} disabled={saving}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-5">
                  <h3 className="mb-4 font-semibold">Customer</h3>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <Info label="Name" value={selectedQuote.customer_name} />
                    <Info label="Email" value={selectedQuote.customer_email} />
                    <Info label="Phone" value={selectedQuote.customer_phone} />
                    <Info label="Address" value={selectedQuote.customer_address} />
                    <Info label="Budget" value={selectedQuote.budget} />
                    <Info label="Timeline" value={selectedQuote.timeline} />
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="mb-4 font-semibold">Project</h3>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <Info label="Structure" value={selectedQuote.structure_type} />
                    <Info label="Pergola Type" value={selectedQuote.pergola_type || selectedQuote.style} />
                    <Info label="Dimensions" value={selectedQuote.dimensions} />
                    <Info label="Material" value={selectedQuote.material} />
                    <Info label="Roof" value={selectedQuote.roof_type} />
                    <Info label="Mounting" value={selectedQuote.mounting} />
                  </div>
                  {selectedQuote.notes && <p className="mt-4 rounded-md bg-muted p-3 text-sm">{selectedQuote.notes}</p>}
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="mb-4 font-semibold">Pricing</h3>
                  <div className="space-y-2 text-sm">
                    <Price label="Base" value={selectedQuote.base_price} />
                    <Price label="Roof" value={selectedQuote.roof_price} />
                    <Price label="Panels" value={selectedQuote.panel_price} />
                    <Price label="Lighting & extras" value={selectedQuote.lighting_price} />
                    <div className="flex justify-between border-t pt-3 text-base font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedQuote.total_price || selectedQuote.price)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="mb-4 font-semibold">Activity Notes</h3>
                  <div className="flex gap-2">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a follow-up note" />
                    <Button onClick={saveNote} disabled={!note.trim()}>Add</Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="rounded-md border p-3 text-sm">
                        <p>{activity.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString("en-AU")}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Pricing Settings</h3>
                      <p className="text-sm text-muted-foreground">Rates are AUD and update future configurator estimates.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setPricingDraft(JSON.stringify(DEFAULT_PRICING_CONFIG, null, 2))} disabled={saving}>
                        Reset Defaults
                      </Button>
                      <Button type="button" onClick={savePricing} disabled={saving}>
                        Save Pricing
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={pricingDraft}
                    onChange={(event) => setPricingDraft(event.target.value)}
                    className="min-h-[280px] font-mono text-xs"
                    spellCheck={false}
                  />
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-lg border bg-card p-5">
                  <h3 className="mb-4 font-semibold">Workflow</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Quote Status</label>
                      <Select value={selectedQuote.status} onValueChange={(status) => patchQuote({ status })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{statusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Pipeline Stage</label>
                      <Select value={selectedPipeline?.stage || "New"} onValueChange={(stage) => patchPipeline({ stage })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STAGES.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Assigned To</label>
                      <Input value={selectedPipeline?.assigned_to || ""} onChange={(e) => patchPipeline({ assigned_to: e.target.value || null })} placeholder="Team member" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="mb-4 font-semibold">Design Preview</h3>
                  {selectedQuote.design_image ? (
                    <a href={selectedQuote.design_image} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border">
                      <img src={selectedQuote.design_image} alt="Design preview" className="aspect-video w-full object-cover" />
                    </a>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">No image captured</div>
                  )}
                  <Button asChild variant="outline" className="mt-3 w-full gap-2">
                    <a href={`/estimate/${selectedQuote.id}?token=${selectedQuote.edit_token}`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" /> Customer Estimate
                    </a>
                  </Button>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border bg-card p-10 text-center text-muted-foreground">Select a quote to view details.</section>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "Not provided"}</p>
    </div>
  );
}

function Price({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{formatCurrency(value || 0)}</span>
    </div>
  );
}
