import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type QuotePayload = {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  order_description: string | null;
  structure_type: string | null;
  pergola_type: string | null;
  dimensions: string | null;
  price: number;
  total_price: number | null;
  pdf_url: string | null;
};

function currency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing email secret: ${name}`);
  return value;
}

function buildMessage(event: string, quote: QuotePayload, estimateUrl?: string) {
  const total = currency(quote.total_price || quote.price);
  const subjectByEvent: Record<string, string> = {
    quote_created: `New quote request #${quote.quote_number}`,
    quote_updated: `Quote updated #${quote.quote_number}`,
    quote_confirmed: `Quote confirmed #${quote.quote_number}`,
    quote_declined: `Quote declined #${quote.quote_number}`,
  };

  const lines = [
    `Quote: #${quote.quote_number}`,
    `Customer: ${quote.customer_name}`,
    `Email: ${quote.customer_email || "Not provided"}`,
    `Phone: ${quote.customer_phone || "Not provided"}`,
    `Address: ${quote.customer_address || "Not provided"}`,
    `Project: ${quote.order_description || quote.structure_type || "Outdoor living project"}`,
    `Dimensions: ${quote.dimensions || "Not provided"}`,
    `Estimate: ${total}`,
    estimateUrl ? `Customer estimate: ${estimateUrl}` : "",
    quote.pdf_url ? `PDF: ${quote.pdf_url}` : "",
  ].filter(Boolean);

  return {
    subject: subjectByEvent[event] || `Quote notification #${quote.quote_number}`,
    text: lines.join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
      <h2 style="margin:0 0 16px">${subjectByEvent[event] || "Quote notification"}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        ${lines
          .map((line) => {
            const [label, ...rest] = line.split(": ");
            return `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700">${label}</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${rest.join(": ")}</td></tr>`;
          })
          .join("")}
      </table>
    </div>`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, quote, estimate_url } = await req.json();
    if (!quote?.id) throw new Error("Missing quote payload");

    const smtpHost = requiredEnv("SMTP_HOST");
    const smtpPort = Number(Deno.env.get("SMTP_PORT") || 465);
    const smtpUser = requiredEnv("SMTP_USER");
    const smtpPass = requiredEnv("SMTP_PASS");
    const from = Deno.env.get("SMTP_FROM") || smtpUser;
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || smtpUser;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const message = buildMessage(event || "quote_created", quote, estimate_url);
    const recipients = [adminEmail, quote.customer_email].filter(Boolean);

    const result = await transporter.sendMail({
      from,
      to: recipients.join(","),
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
