---
version: 1
slug: "app-dashboard"
primary_target: "app/dashboard"
related_targets: ["app/components/dashboard"]
---

# Dashboards (customer + admin)

Scope: `app/dashboard/**` and `app/components/dashboard/**`. Mode: Operate. Visual and UX-feel redesign only; behaviour, data, routes and copy meaning are preserved. The public site and the auth pages are out of scope.

Audience: customers (an occasional visit about one event, who should feel looked after) and admins (daily users who scan orders, invoices and enquiries quickly).

Constraints: the `--mgh-*` palette is locked (black and gold, no new hues). Faces are Playfair Display and Geist. Build path: code-led (no image generation available).

## Direction contract

THESIS: A private-client concierge book, not a SaaS console. It refuses the stat-card grid with gradient icon tiles and gold on everything. Black and neutral greys do the work, and gold marks only the decision.

OWN-WORLD: The surface steps are bg #0a0a0a, surface, surface-2 and surface-3, separated by 1px line hairlines. Gold #d4af37 appears only on the single primary action, the active nav state, an amount due, and the next event's hairline. Playfair carries titles, key figures and dates; Geist carries everything else. Radii are 8px controls, 12px panels and 16px sheets. There is no glass, no glow and no hover lift.

STORY: The customer sees their next event and what they owe, then acts with one gold button. The admin sees what needs attention today, then scans real tables.

FIRST VIEWPORT:
- Customer: a top bar (wordmark plus three nav clusters). Below it, a Playfair greeting with a secondary "Plan an event" button. Then a two-column row: the "Your next event" feature panel, led by a large engraved date with a gold hairline, on the left; the invoices panel on the right, with the amount due as a gold Playfair figure and "Pay Now" as the page's one gold button.
- Admin: a 224px grouped left rail. The page opens with the date as a Playfair h1. Below it, a "Needs attention" queue (four count rows) sits beside a figures panel (revenue, active orders, upcoming events), followed by three dense date-led lists.

FORM: Signature move: the engraved date. Every event, order and consultation is led by its date: the day in Playfair numerals, the month and weekday in tracked caps, and a gold hairline only on the next event. Seed: n/a (the brief pinned the direction; no concept roll was run).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
