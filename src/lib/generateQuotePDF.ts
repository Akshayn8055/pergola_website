import jsPDF from "jspdf";
import { type Quote, uploadQuotePDF, updateQuote } from "./quotesStore";
import { getEstimateDoc, computeTotals } from "./estimateModel";

const MARGIN = 20;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addHeader(pdf: jsPDF, title: string) {
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  pdf.text(title, MARGIN, 35);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(MARGIN, 40, PAGE_W - MARGIN, 40);
}

function addRow(pdf: jsPDF, y: number, label: string, value: string): number {
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(label, MARGIN, y);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont("helvetica", "bold");
  pdf.text(value, PAGE_W - MARGIN, y, { align: "right" });
  return y + 8;
}

function addSectionTitle(pdf: jsPDF, y: number, title: string): number {
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  pdf.text(title, MARGIN, y);
  return y + 10;
}

export async function generateQuotePDF(quote: Quote): Promise<string | null> {
  try {
    const pdf = new jsPDF("p", "mm", "a4");

    // ===== PAGE 1: Customer Details =====
    addHeader(pdf, "Customer Details");
    let y = 55;
    y = addRow(pdf, y, "Quote Number", quote.quote_number);
    y = addRow(pdf, y, "Name", quote.customer_name);
    if (quote.customer_phone) y = addRow(pdf, y, "Phone", quote.customer_phone);
    if (quote.customer_email) y = addRow(pdf, y, "Email", quote.customer_email);
    if (quote.customer_address) y = addRow(pdf, y, "Address", quote.customer_address);
    y += 5;
    if (quote.budget) y = addRow(pdf, y, "Budget", quote.budget);
    if (quote.timeline) y = addRow(pdf, y, "Timeline", quote.timeline);
    if (quote.notes) {
      y += 5;
      y = addSectionTitle(pdf, y, "Notes");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      const lines = pdf.splitTextToSize(quote.notes, CONTENT_W);
      pdf.text(lines, MARGIN, y);
    }

    // ===== PAGE 2: Design Preview =====
    pdf.addPage();
    addHeader(pdf, "Design Preview");
    if (quote.design_image) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = quote.design_image!;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL("image/png");
        const imgW = CONTENT_W;
        const imgH = (img.naturalHeight / img.naturalWidth) * imgW;
        pdf.addImage(imgData, "PNG", MARGIN, 50, imgW, Math.min(imgH, 180));
      } catch {
        pdf.setFontSize(11);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Design image unavailable", MARGIN, 60);
      }
    } else {
      pdf.setFontSize(11);
      pdf.setTextColor(150, 150, 150);
      pdf.text("No design image captured", MARGIN, 60);
    }

    // ===== PAGE 3: Configuration Summary =====
    pdf.addPage();
    addHeader(pdf, "Configuration Summary");
    y = 55;
    if (quote.pergola_type) y = addRow(pdf, y, "Pergola Type", quote.pergola_type.charAt(0).toUpperCase() + quote.pergola_type.slice(1));
    if (quote.structure_type) y = addRow(pdf, y, "Structure Type", quote.structure_type.charAt(0).toUpperCase() + quote.structure_type.slice(1));
    if (quote.dimensions) y = addRow(pdf, y, "Dimensions", quote.dimensions);
    if (quote.material) y = addRow(pdf, y, "Material", quote.material.charAt(0).toUpperCase() + quote.material.slice(1));
    if (quote.roof_type) y = addRow(pdf, y, "Roof Type", quote.roof_type.charAt(0).toUpperCase() + quote.roof_type.slice(1));
    if (quote.mounting) y = addRow(pdf, y, "Mounting", quote.mounting.charAt(0).toUpperCase() + quote.mounting.slice(1));
    if (quote.frame_color) y = addRow(pdf, y, "Frame Color", quote.frame_color);
    if (quote.roof_color) y = addRow(pdf, y, "Roof Color", quote.roof_color);
    if (quote.automation) y = addRow(pdf, y, "Automation", quote.automation.charAt(0).toUpperCase() + quote.automation.slice(1));

    const deck = quote.panels && typeof quote.panels === "object" ? (quote.panels as Record<string, any>).__deck : null;
    if (deck) {
      y += 5;
      y = addSectionTitle(pdf, y, "Deck Configuration");
      y = addRow(pdf, y, "Shape", String(deck.shape || "square").replace(/-/g, " "));
      y = addRow(pdf, y, "Deck Dimensions", `${(deck.dimensions.length / 1000).toFixed(2)}m × ${(deck.dimensions.width / 1000).toFixed(2)}m × ${(deck.dimensions.height / 1000).toFixed(2)}m`);
      y = addRow(pdf, y, "Boards", `${deck.material} — ${deck.colorName || deck.color}`);
      y = addRow(pdf, y, "Board Direction", deck.boardDirection);
      y = addRow(pdf, y, "Balustrade", deck.railingType || "none");
      y = addRow(pdf, y, "Handrail", deck.handrailType || "none");
      const stairSides = Object.entries(deck.stairs || {}).filter(([, value]: [string, any]) => value?.enabled).map(([side]) => side);
      y = addRow(pdf, y, "Stairs", stairSides.length ? stairSides.join(", ") : "None");
    }

    // Panels summary
    if (quote.panels && typeof quote.panels === "object") {
      y += 5;
      y = addSectionTitle(pdf, y, "Side Panels");
      const panels = quote.panels as Record<string, any>;
      for (const [side, panel] of Object.entries(panels)) {
        if (side !== "__deck" && panel?.enabled && panel?.type !== "open") {
          y = addRow(pdf, y, side.charAt(0).toUpperCase() + side.slice(1), panel.type.charAt(0).toUpperCase() + panel.type.slice(1));
        }
      }
    }

    // Lighting summary
    if (quote.lighting && typeof quote.lighting === "object") {
      y += 5;
      y = addSectionTitle(pdf, y, "Lighting & Accessories");
      const lighting = quote.lighting as Record<string, any>;
      if (lighting.ledStrips) y = addRow(pdf, y, "LED Strips", "Yes");
      if (lighting.spotlights) y = addRow(pdf, y, "Spotlights", "Yes");
      if (lighting.ceilingFan) y = addRow(pdf, y, "Ceiling Fan", "Yes");
      if (lighting.heaters) y = addRow(pdf, y, "Heaters", "Yes");
    }

    // ===== PAGE 4: Detailed Price Breakdown =====
    pdf.addPage();
    addHeader(pdf, "Price Breakdown");
    y = 55;
    const fmt = (v: number) => `€${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    // 1.1 Base Structure
    y = addSectionTitle(pdf, y, "1.1  Base Structure");
    y = addRow(pdf, y, "Pergola base" + (quote.material ? ` (${quote.material})` : ""), fmt(quote.base_price || quote.price));
    if (quote.dimensions) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(150, 150, 150);
      pdf.text(quote.dimensions, MARGIN + 8, y);
      y += 7;
    }

    // 1.2 Roof System
    if (quote.roof_type && quote.roof_type !== "open" && quote.roof_price) {
      y += 3;
      y = addSectionTitle(pdf, y, "1.2  Roof System");
      y = addRow(pdf, y, `${quote.roof_type.charAt(0).toUpperCase() + quote.roof_type.slice(1)} roof`, fmt(quote.roof_price));
    }

    // 1.3 Side Panels
    if (quote.panels && typeof quote.panels === "object") {
      const panels = quote.panels as Record<string, any>;
      const activePanels = Object.entries(panels).filter(([, p]) => p?.enabled && p?.type !== "open");
      if (activePanels.length > 0) {
        y += 3;
        y = addSectionTitle(pdf, y, "1.3  Side Panels");
        for (const [side, panel] of activePanels) {
          y = addRow(pdf, y, `${side.charAt(0).toUpperCase() + side.slice(1)} — ${panel.type.charAt(0).toUpperCase() + panel.type.slice(1)}`, "");
        }
        y = addRow(pdf, y, "Panels subtotal", fmt(quote.panel_price || 0));
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
      if (items.length > 0) {
        y += 3;
        y = addSectionTitle(pdf, y, "1.4  Lighting & Accessories");
        for (const item of items) {
          y = addRow(pdf, y, item.label, fmt(item.price));
        }
      }
    }

    // Total
    y += 8;
    pdf.setDrawColor(40, 40, 40);
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 8;
    const estDoc = getEstimateDoc(quote);
    const { subtotal, discountAmount, total } = computeTotals(estDoc);
    y = addRow(pdf, y, "Subtotal", fmt(subtotal));
    y = addRow(pdf, y, estDoc.totals.discountLabel, fmt(discountAmount));
    y += 3;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 40);
    pdf.text("TOTAL", MARGIN, y);
    pdf.text(fmt(total), PAGE_W - MARGIN, y, { align: "right" });

    // ===== PAGE 5: Services Included =====
    pdf.addPage();
    addHeader(pdf, "Services Included");
    y = 55;
    const services = [
      { title: "Site Survey", desc: "A professional surveyor will visit your property to assess the installation area." },
      { title: "UK Manufacture", desc: "Your pergola will be manufactured in the UK using premium materials." },
      { title: "Expert Installation", desc: "Our certified team will install your structure with full care and precision." },
      { title: "10 Year Guarantee", desc: "All our structures come with a comprehensive 10-year guarantee." },
    ];
    for (const svc of services) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(40, 40, 40);
      pdf.text(`✓  ${svc.title}`, MARGIN, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(svc.desc, MARGIN + 8, y);
      y += 12;
    }

    // Generate blob and upload
    const pdfBlob = pdf.output("blob");
    const pdfUrl = await uploadQuotePDF(quote.id, pdfBlob);
    if (pdfUrl) {
      await updateQuote(quote.id, { pdf_url: pdfUrl } as any);
    }
    return pdfUrl;
  } catch (err) {
    console.error("PDF generation failed:", err);
    return null;
  }
}
