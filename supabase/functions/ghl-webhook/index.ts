import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const event = payload.event || "";

    // Route to appropriate webhook based on event type
    const isStatusEvent = event === "quote_confirmed" || event === "quote_declined";

    let webhookUrl: string | undefined;
    let ghlPayload: Record<string, unknown>;

    if (isStatusEvent) {
      webhookUrl = Deno.env.get("GHL_STATUS_WEBHOOK") || Deno.env.get("GHL_WEBHOOK_URL");
      // Status webhook: flat payload with expected field names
      ghlPayload = {
        quote_id: payload.quote_id,
        status: payload.status,
        event: payload.event,
        email: payload.customer_email || payload.email,
        name: payload.customer_name || payload.name,
        phone: payload.customer_phone || payload.phone,
        price: payload.price,
      };
    } else {
      webhookUrl = Deno.env.get("GHL_QUOTE_WEBHOOK") || Deno.env.get("GHL_WEBHOOK_URL");
      // Quote webhook: flat payload with expected field names
      ghlPayload = {
        name: payload.customer_name || payload.name,
        email: payload.customer_email || payload.email,
        phone: payload.customer_phone || payload.phone,
        estimate_url: payload.estimate_url,
        pdf_url: payload.pdf_url,
        design_image: payload.design_image,
        price: payload.price,
        event: payload.event,
        quote_id: payload.quote_id,
        pergola_type: payload.pergola_type,
        material: payload.material,
        dimensions: payload.dimensions,
      };
    }

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "No webhook URL configured for this event type" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ghlResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ghlPayload),
    });

    const responseText = await ghlResponse.text();

    return new Response(
      JSON.stringify({ success: true, ghl_status: ghlResponse.status, ghl_response: responseText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GHL webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
