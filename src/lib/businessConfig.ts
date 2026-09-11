export const BUSINESS_CONFIG = {
  appName: import.meta.env.VITE_BUSINESS_NAME || "Pergola by Scale Aura",
  clientName: import.meta.env.VITE_CLIENT_NAME || "Sydney Outdoor Solutions",
  domain: import.meta.env.VITE_SITE_URL || "https://pergolawebsite.vercel.app",
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || "sales@sydneyoutdoorsolutions.com.au",
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || "1300 905 026",
  serviceArea:
    import.meta.env.VITE_SERVICE_AREA ||
    "Sydney, South West Sydney, North West Sydney, Macarthur, Northern Beaches and Wollongong",
  quoteValidityDays: Number(import.meta.env.VITE_QUOTE_VALIDITY_DAYS || 30),
};

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
