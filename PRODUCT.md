# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Customers**: private clients planning a catered event (weddings, corporate functions, celebrations). They visit occasionally, around one event at a time, to book, follow their order, pay invoices and leave a review. They should feel looked after.
- **Admins**: Mlangeni staff who run the pipeline daily: enquiries, consultation requests and meetings, orders, invoices, payments, menus and testimonials. They need to scan and act quickly.

## Product Purpose

Mlangeni Group Holdings' booking and menu management system: the logged-in dashboards where a catering client's event moves from first contact to a paid, confirmed booking, and where staff run that pipeline.

## Positioning

A premium, fine-dining private-events caterer. The dashboards are its concierge desk, not a generic admin template.

## Operating Context

The workflow is booking or enquiry, then consultation (requested, scheduled, active meeting), then order, invoice (draft, sent, overdue, paid), PayFast payment (sandbox), and a review. Reviews are allowed only for past, non-cancelled events and need admin approval before they appear publicly.

- **Booking paths**: a package booking, or the Interactive Menu Builder (Event Details, Menu Selection, Beverages, Quote). The Menu Builder writes the order directly and emails a quote.
- **Roles**: `customer` and `admin` only, enforced client-side by `useRoleGuard`.

## Capabilities and Constraints

- **Stack**: Next.js 16 (App Router; read `node_modules/next/dist/docs/` before code), React 19, Tailwind v4, framer-motion, radix-ui, Supabase (auth and data), PayFast.
- **Terminology in the UI**: Booking, Enquire/Enquiry, Consultation, Active Meetings, Order, Quote, Invoice, Payment, Reviews/Testimonials, Menu, Menu Editor, Menu Builder, Event.
- **Statuses**: pending, confirmed, scheduled, requested, sent, overdue, paid, cancelled, draft.
- **Redesign scope** (Oct 2026): visual and UX-feel only for `app/dashboard/**` and `app/components/dashboard/**`. It does not touch data, auth, payment or booking logic, routes, or the meaning of copy. The public marketing site and the auth pages are out of scope.
- **Team**: this is a group student project (CPUT) with several contributors, so changes should land in reviewable phases.

## Brand Commitments

- **Name**: "Mlangeni Group Holdings" in the dashboards. The public site still says "Mlangeni Grand Hospitality" in places; leave that alone unless asked.
- **Palette (locked)**: black and gold, defined by the `--mgh-*` tokens in `app/globals.css`. Do not add hues, change the gold or black values, or add a light theme.
- **Faces**: Playfair Display (serif) and Geist (sans), loaded in `app/layout.tsx`.
- **Gold is an accent used with intent**: the primary action, the active state and key figures.

## Evidence on Hand

Logo: `public/logos/logoPNG.png`. Hero photo: `public/images/gallery_images/gallery-hero.png`. Real testimonials come from the database. No invented customers, figures or claims.

## Product Principles

1. Customers feel looked after: one clear next step, never a wall of tiles.
2. Admins get a calm, dense workspace built for scanning, not a showcase.
3. Restraint over decoration. Gold marks decisions, not surfaces.
4. Money and booking flows stay behaviourally identical through any visual change.

## Accessibility & Inclusion

Meet WCAG 2.1 AA for text contrast on the dark palette (`--mgh-text-faint` and `--mgh-text-disabled` fail AA and are not used for readable text), give keyboard access and dialog semantics to every interactive element, and respect `prefers-reduced-motion`.
