const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://arrjtsashykfbrtaznml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmp0c2FzaHlrZmJydGF6bm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzIwODgsImV4cCI6MjA4ODI0ODA4OH0.MS7aG7Sc4_p-Eh5ldwv2gDmx8eW17GnpOnoUJ_LZMAg";

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

async function rest<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      console.error("pipeline request failed", path, res.status, await res.text());
      return null;
    }
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.error("pipeline request error", path, e);
    return null;
  }
}

export async function getPipelines(): Promise<LeadPipeline[]> {
  return (await rest<LeadPipeline[]>("lead_pipeline?select=*")) || [];
}

export async function ensurePipeline(quoteId: string): Promise<LeadPipeline | null> {
  const existing = await rest<LeadPipeline[]>(`lead_pipeline?select=*&quote_id=eq.${quoteId}`);
  if (existing && existing.length) return existing[0];
  const created = await rest<LeadPipeline[]>("lead_pipeline", {
    method: "POST",
    body: JSON.stringify({ quote_id: quoteId }),
  });
  return created?.[0] || null;
}

export async function updatePipeline(
  quoteId: string,
  updates: Partial<Omit<LeadPipeline, "id" | "quote_id" | "created_at" | "updated_at">>
): Promise<LeadPipeline | null> {
  await ensurePipeline(quoteId);
  const updated = await rest<LeadPipeline[]>(`lead_pipeline?quote_id=eq.${quoteId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return updated?.[0] || null;
}

export async function getActivities(quoteId: string): Promise<LeadActivity[]> {
  return (
    (await rest<LeadActivity[]>(
      `lead_activities?select=*&quote_id=eq.${quoteId}&order=created_at.desc`
    )) || []
  );
}

export async function addActivity(
  quoteId: string,
  type: string,
  body: string
): Promise<LeadActivity | null> {
  const created = await rest<LeadActivity[]>("lead_activities", {
    method: "POST",
    body: JSON.stringify({ quote_id: quoteId, type, body }),
  });
  return created?.[0] || null;
}

export function nextStage(stage: string): Stage | null {
  const i = STAGES.indexOf(stage as Stage);
  if (i < 0) return STAGES[1];
  return i < STAGES.length - 1 ? STAGES[i + 1] : null;
}
