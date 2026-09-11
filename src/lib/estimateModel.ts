import type { Quote } from "./quotesStore";

export type EstimateSubItem = {
  id: string;
  code: string; // e.g. "1.1.1"
  label: string;
  sublines: string[]; // extra dim / material lines
  quantity: number;
  discount: string; // free text (e.g. "10%" or "")
  price: number; // 0 = show em-dash
  showPrice: boolean; // false to render "—"
};

export type EstimateSection = {
  id: string;
  code: string; // e.g. "1.1"
  title: string;
  items: EstimateSubItem[];
};

export type EstimateTotals = {
  subtotalOverride: number | null;
  discountLabel: string;
  discountPct: number;
  discountAmountOverride: number | null;
  totalOverride: number | null;
};

export type EstimateBranding = {
  companyName: string;
  tagline: string;
  heroImage: string; // data URL or asset URL; empty = use bundled default
};

export type EstimateDoc = {
  branding: EstimateBranding;
  customer: { name: string; email: string; phone: string; address: string };
  quoteMeta: { number: string; date: string; validUntil: string };
  salesRep: { name: string; email: string };
  mainProduct: {
    name: string;
    unitPrice: number;
    quantity: number;
    discount: string;
    vatPct: number;
  };
  sections: EstimateSection[];
  note: string;
  included: string[];
  totals: EstimateTotals;
};

export function computeTotals(doc: EstimateDoc) {
  const autoSubtotal = computeMainSubtotal(doc.mainProduct);
  const subtotal = doc.totals.subtotalOverride ?? autoSubtotal;
  const autoDiscount = subtotal * (doc.totals.discountPct / 100);
  const discountAmount = doc.totals.discountAmountOverride ?? autoDiscount;
  const total = doc.totals.totalOverride ?? Math.max(0, subtotal - discountAmount);
  return { subtotal, discountAmount, total };
}

const uid = () => Math.random().toString(36).slice(2, 10);

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

export function buildDefaultEstimate(quote: Quote): EstimateDoc {
  const created = new Date(quote.created_at);
  const validUntil = new Date(created.getTime() + 14 * 86400000);

  const sections: EstimateSection[] = [];

  // 1.1 Base Structure
  const baseSublines: string[] = [];
  if (quote.dimensions) baseSublines.push(quote.dimensions);
  if (quote.material) baseSublines.push(`Material: ${quote.material}`);
  sections.push({
    id: uid(),
    code: "1.1",
    title: "Base Structure",
    items: [
      {
        id: uid(),
        code: "1.1.1",
        label: "Pergola base",
        sublines: baseSublines,
        quantity: 1,
        discount: "",
        price: quote.base_price || quote.price || 0,
        showPrice: true,
      },
    ],
  });

  // 1.2 Roof System
  if (quote.roof_type && quote.roof_type !== "open") {
    sections.push({
      id: uid(),
      code: "1.2",
      title: "Roof System",
      items: [
        {
          id: uid(),
          code: "1.2.1",
          label: `${quote.roof_type.charAt(0).toUpperCase() + quote.roof_type.slice(1)} roof`,
          sublines: [],
          quantity: 1,
          discount: "",
          price: quote.roof_price || 0,
          showPrice: true,
        },
      ],
    });
  }

  // 1.3 Side Panels
  if (quote.panels && typeof quote.panels === "object") {
    const panels = quote.panels as Record<string, any>;
    const active = Object.entries(panels).filter(
      ([, p]) => p?.enabled && p?.type !== "open"
    );
    if (active.length) {
      const total = quote.panel_price || 0;
      sections.push({
        id: uid(),
        code: "1.3",
        title: "Side Panels",
        items: active.map(([side, p], i) => ({
          id: uid(),
          code: `1.3.${i + 1}`,
          label: `${side.charAt(0).toUpperCase() + side.slice(1)} — ${p.type
            .charAt(0)
            .toUpperCase()}${p.type.slice(1)}`,
          sublines: [],
          quantity: 1,
          discount: "",
          price: i === active.length - 1 ? total : 0,
          showPrice: i === active.length - 1,
        })),
      });
    }
  }

  // 1.4 Lighting & Accessories
  if (quote.lighting && typeof quote.lighting === "object") {
    const lighting = quote.lighting as Record<string, any>;
    const items: { label: string; price: number }[] = [];
    if (lighting.ledStrips) items.push({ label: "LED Strip Lighting", price: 120 });
    if (lighting.spotlights) items.push({ label: "Spotlights", price: 80 });
    if (lighting.ceilingFan) items.push({ label: "Ceiling Fan", price: 150 });
    if (lighting.heaters) items.push({ label: "Outdoor Heaters", price: 200 });
    if (items.length) {
      sections.push({
        id: uid(),
        code: "1.4",
        title: "Lighting & Accessories",
        items: items.map((it, i) => ({
          id: uid(),
          code: `1.4.${i + 1}`,
          label: it.label,
          sublines: [],
          quantity: 1,
          discount: "",
          price: it.price,
          showPrice: true,
        })),
      });
    }
  }

  return {
    branding: {
      companyName: "PERGOLA DESIGNS",
      tagline: "PREMIUM OUTDOOR LIVING",
      heroImage: "",
    },
    customer: {
      name: quote.customer_name || "",
      email: quote.customer_email || "",
      phone: quote.customer_phone || "",
      address: quote.customer_address || "",
    },
    quoteMeta: {
      number: quote.quote_number,
      date: fmtDate(created),
      validUntil: fmtDate(validUntil),
    },
    salesRep: {
      name: quote.sales_rep || "Admin",
      email: quote.sales_rep_email || "admin@pergola.com",
    },
    mainProduct: {
      name: `${quote.structure_type || "Pergola"} ${quote.style || ""}`.trim(),
      unitPrice: quote.price || 0,
      quantity: 1,
      discount: "",
      vatPct: 20,
    },
    sections,
    note: "This document represents a preliminary estimate based on your current configuration. Following a FREE site survey and design consultation a formal detailed offer will be prepared for your consideration.",
    included: [
      "Detailed site survey & design consultation",
      "Precision manufacture at our production facility",
      "Expert installation by our own salaried installers",
      "Up to 10-year guarantee for complete peace of mind",
    ],
    totals: {
      subtotalOverride: null,
      discountLabel: "Discount (20%)",
      discountPct: 20,
      discountAmountOverride: null,
      totalOverride: null,
    },
  };
}

export function getEstimateDoc(quote: Quote): EstimateDoc {
  const ov = (quote as any).estimate_overrides;
  if (ov && typeof ov === "object") {
    // Merge with defaults defensively (missing keys fall back)
    const def = buildDefaultEstimate(quote);
    return {
      ...def,
      ...ov,
      branding: { ...def.branding, ...(ov.branding || {}) },
      customer: { ...def.customer, ...(ov.customer || {}) },
      quoteMeta: { ...def.quoteMeta, ...(ov.quoteMeta || {}) },
      salesRep: { ...def.salesRep, ...(ov.salesRep || {}) },
      mainProduct: { ...def.mainProduct, ...(ov.mainProduct || {}) },
      sections: Array.isArray(ov.sections) ? ov.sections : def.sections,
      included: Array.isArray(ov.included) ? ov.included : def.included,
      totals: { ...def.totals, ...(ov.totals || {}) },
    };
  }
  return buildDefaultEstimate(quote);
}

export function computeMainSubtotal(m: EstimateDoc["mainProduct"]) {
  const gross = m.unitPrice * m.quantity;
  const dNum = parseFloat(m.discount.replace(/[^\d.]/g, ""));
  const discount = isNaN(dNum) ? 0 : (gross * dNum) / 100;
  return Math.max(0, gross - discount);
}

export const newSubItem = (code = ""): EstimateSubItem => ({
  id: uid(),
  code,
  label: "New item",
  sublines: [],
  quantity: 1,
  discount: "",
  price: 0,
  showPrice: true,
});

export const newSection = (code = ""): EstimateSection => ({
  id: uid(),
  code,
  title: "New section",
  items: [newSubItem(`${code}.1`)],
});
