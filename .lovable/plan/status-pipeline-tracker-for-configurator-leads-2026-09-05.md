# Status: pipeline tracker for configurator leads

Add a new "Status" item in the dashboard sidebar, right after Inbox, that opens a two-panel tracker showing how far each person got in the 3D configurator, with their design and next actions.

## Layout

Left list ("Today")
- Filter chips: Needs you, Renders, At risk (with counts).
- One card per lead: small thumbnail of their 3D design, name, quote number and product, value, labels, and the most urgent alert (call overdue, follow-up overdue, render requested).

Right detail panel
- Header: customer name, quote number, labels, "+ Label", Edit, and a "Move to <next stage>" button, plus Won / Lost.
- Stage bar: New → Qualified → Consultation → Committed, current stage highlighted.
- Tabs: Overview, Quote Detail, Messages, Activity, Notes.
- Overview left column: "Opportunity health" (x/5 with a ring) listing Customer information, Configuration, Quote sent, Meeting scheduled, Render available — each auto-computed from the record.
- Overview right column ("Summary"): the customer's saved 3D design image, deal value, product, assigned to, engagement (times viewed), next call, quote expiry.
- Recommended actions card: Schedule meeting (with the line "A booked consultation keeps the deal moving.") and a Schedule button, Call customer → Open, Add note → Open.

## Behaviour

- Each existing quote becomes a lead row; progress steps are derived automatically: configuration complete when a design exists, quote sent from the sent flag, render available when a design image exists.
- Schedule meeting opens a date/time picker; the saved time drives "Meeting scheduled" and the Call/Quote-expiry lines.
- Call customer opens the phone dialer with the stored number and logs a call activity.
- Add note saves a note against the lead and shows it in the Notes tab and Activity.
- Moving stage, Won and Lost update the lead stage and are recorded in Activity.
- Labels can be added and removed from the header.

## Technical notes

- New tables: `lead_pipeline` (quote_id, stage, assigned_to, labels, next_call_at, meeting_at, quote_expires_at, view_count, won/lost outcome) and `lead_activities` (quote_id, type: note/call/meeting/stage_change, body, created_at). Both with grants and permissive policies matching the existing `quotes` table so the dev dashboard keeps working.
- A row in `lead_pipeline` is created on demand the first time a lead is opened or acted on.
- New sidebar filter value `status` in `AdminDashboard.tsx`, rendering a new `src/components/dashboard/StatusPipeline.tsx` instead of the quotes table.
- Data access helpers added to `src/lib/quotesStore.ts` (or a new `src/lib/pipelineStore.ts`) using the existing Supabase client.
- Design thumbnails reuse `design_image` already stored on quotes.
