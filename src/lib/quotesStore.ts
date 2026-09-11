import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://arrjtsashykfbrtaznml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmp0c2FzaHlrZmJydGF6bm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzIwODgsImV4cCI6MjA4ODI0ODA4OH0.MS7aG7Sc4_p-Eh5ldwv2gDmx8eW17GnpOnoUJ_LZMAg";
const QUOTES_CACHE_KEY = "pergola-dashboard-quotes-cache";

export type Quote = {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_address: string | null;
  customer_phone: string | null;
  sales_rep: string | null;
  sales_rep_email: string | null;
  order_description: string | null;
  price: number;
  status: string;
  is_hot: boolean;
  is_viewed: boolean;
  is_sent: boolean;
  is_archived: boolean;
  is_draft: boolean;
  is_qualified: boolean;
  budget: string | null;
  timeline: string | null;
  email_consent: boolean;
  structure_type: string | null;
  dimensions: string | null;
  material: string | null;
  style: string | null;
  design_image: string | null;
  pdf_url: string | null;
  edit_token: string | null;
  created_at: string;
  // New config fields
  roof_type: string | null;
  panels: Record<string, any> | null;
  lighting: Record<string, any> | null;
  frame_color: string | null;
  roof_color: string | null;
  mounting: string | null;
  mounted_side: string | null;
  pergola_type: string | null;
  automation: string | null;
  louvered_angle: number | null;
  retractable_openness: number | null;
  notes: string | null;
  base_price: number;
  roof_price: number;
  panel_price: number;
  lighting_price: number;
  total_price: number;
};

function cacheQuotes(quotes: Quote[]) {
  try {
    localStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify(quotes));
  } catch {
    // Ignore storage failures; the live API result is still returned.
  }
}

function getCachedQuotes(): Quote[] {
  try {
    const raw = localStorage.getItem(QUOTES_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Quote[]) : [];
  } catch {
    return [];
  }
}

async function getQuotesViaRest(): Promise<Quote[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/quotes?select=*&order=created_at.desc`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "accept-profile": "public",
    },
  });

  if (!response.ok) {
    throw new Error(`Quotes REST fallback failed with ${response.status}`);
  }

  return (await response.json()) as Quote[];
}

export async function getQuotes(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const quotes = (data || []) as unknown as Quote[];
    cacheQuotes(quotes);
    return quotes;
  } catch (primaryError) {
    console.warn("Primary quotes fetch failed, retrying direct REST request:", primaryError);

    try {
      const quotes = await getQuotesViaRest();
      cacheQuotes(quotes);
      return quotes;
    } catch (fallbackError) {
      const cached = getCachedQuotes();
      console.error("Failed to fetch quotes:", { primaryError, fallbackError });
      return cached;
    }
  }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Quote;
}

export async function getQuoteByToken(id: string, token: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .filter("edit_token", "eq", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Quote;
}

export async function createQuote(
  input: Omit<Quote, "id" | "created_at" | "edit_token" | "pdf_url" | "is_qualified">
): Promise<Quote | null> {
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      quote_number: input.quote_number,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      order_description: input.order_description,
      price: input.price,
      status: input.status,
      is_hot: input.is_hot,
      is_viewed: input.is_viewed,
      is_sent: input.is_sent,
      is_archived: input.is_archived,
      is_draft: input.is_draft,
      sales_rep: input.sales_rep,
      ...(({
        customer_address: input.customer_address,
        customer_phone: input.customer_phone,
        sales_rep_email: input.sales_rep_email,
        budget: input.budget,
        timeline: input.timeline,
        email_consent: input.email_consent,
        structure_type: input.structure_type,
        dimensions: input.dimensions,
        material: input.material,
        style: input.style,
        design_image: input.design_image,
        roof_type: input.roof_type,
        panels: input.panels,
        lighting: input.lighting,
        frame_color: input.frame_color,
        roof_color: input.roof_color,
        mounting: input.mounting,
        mounted_side: input.mounted_side,
        pergola_type: input.pergola_type,
        automation: input.automation,
        louvered_angle: input.louvered_angle,
        retractable_openness: input.retractable_openness,
        notes: input.notes,
        base_price: input.base_price,
        roof_price: input.roof_price,
        panel_price: input.panel_price,
        lighting_price: input.lighting_price,
        total_price: input.total_price,
      }) as any),
    } as any)
    .select()
    .single();
  if (error) {
    console.error("Failed to create quote:", error);
    return null;
  }
  return data as unknown as Quote;
}

export async function updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | null> {
  const { data, error } = await supabase
    .from("quotes")
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Failed to update quote:", error);
    return null;
  }
  return data as unknown as Quote;
}

export async function deleteQuote(id: string): Promise<boolean> {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  return !error;
}

export async function getNextQuoteNumber(): Promise<string> {
  const { data } = await supabase
    .from("quotes")
    .select("quote_number")
    .order("created_at", { ascending: false })
    .limit(100);
  const maxNum = (data || []).reduce((max, q) => {
    const n = parseInt(q.quote_number, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return String(maxNum + 1).padStart(5, "0");
}

export async function uploadDesignImage(quoteId: string, base64: string): Promise<string | null> {
  try {
    const res = await fetch(base64);
    const blob = await res.blob();
    const path = `${quoteId}.png`;
    const { error } = await supabase.storage.from("designs").upload(path, blob, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) {
      console.error("Upload design failed:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("designs").getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Upload design failed:", err);
    return null;
  }
}

export async function uploadQuotePDF(quoteId: string, pdfBlob: Blob): Promise<string | null> {
  try {
    const path = `${quoteId}.pdf`;
    const { error } = await supabase.storage.from("quotes-pdf").upload(path, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) {
      console.error("Upload PDF failed:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("quotes-pdf").getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Upload PDF failed:", err);
    return null;
  }
}
