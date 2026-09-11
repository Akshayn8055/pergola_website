import { supabase } from "@/integrations/supabase/client";

export const STAGES = ["New", "Qualified", "Consultation", "Committed"] as const;
export type Stage = (typeof STAGES)[number];

export type LeadPipeline = {
  id: string;
  quote_id: string;
  stage: string;
  assigned_to: string | null;
  labels: string[];
  next_call_at: string | null;
  meeting_at: string | null;
  quote_expires_at: string | null;
  view_count: number;
  outcome: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadActivity = {
  id: string;
  quote_id: string;
  type: string;
  body: string | null;
  created_at: string;
};

export async function getPipelines(): Promise<LeadPipeline[]> {
  const { data, error } = await supabase.from("lead_pipeline").select("*");
  if (error) {
    console.error("Failed to fetch pipelines:", error);
    return [];
  }
  return (data || []) as LeadPipeline[];
}

export async function ensurePipeline(quoteId: string): Promise<LeadPipeline | null> {
  const { data: existing } = await supabase.from("lead_pipeline").select("*").eq("quote_id", quoteId).maybeSingle();
  if (existing) return existing as LeadPipeline;
  const { data, error } = await supabase.from("lead_pipeline").insert({ quote_id: quoteId }).select().single();
  if (error) {
    console.error("Failed to create pipeline:", error);
    return null;
  }
  return data as LeadPipeline;
}

export async function updatePipeline(
  quoteId: string,
  updates: Partial<Omit<LeadPipeline, "id" | "quote_id" | "created_at" | "updated_at">>
): Promise<LeadPipeline | null> {
  await ensurePipeline(quoteId);
  const { data, error } = await supabase.from("lead_pipeline").update(updates).eq("quote_id", quoteId).select().single();
  if (error) {
    console.error("Failed to update pipeline:", error);
    return null;
  }
  return data as LeadPipeline;
}

export async function getActivities(quoteId: string): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch activities:", error);
    return [];
  }
  return (data || []) as LeadActivity[];
}

export async function addActivity(
  quoteId: string,
  type: string,
  body: string
): Promise<LeadActivity | null> {
  const { data, error } = await supabase.from("lead_activities").insert({ quote_id: quoteId, type, body }).select().single();
  if (error) {
    console.error("Failed to create activity:", error);
    return null;
  }
  return data as LeadActivity;
}

export function nextStage(stage: string): Stage | null {
  const i = STAGES.indexOf(stage as Stage);
  if (i < 0) return STAGES[1];
  return i < STAGES.length - 1 ? STAGES[i + 1] : null;
}
