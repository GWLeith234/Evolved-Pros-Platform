# LIVE v1 — archived

Replaced 2026-04-28 by the LIVE-REBUILD sprint per the design handoff
at `_design_refs/live/`.

Code preserved here in case the previous brochure-style page is needed
for reference. The new `/live` page is at:

  apps/web/app/(public)/live/page.tsx
  apps/web/components/live/*

The new page is a static brochure (no DB queries), composing 9 section
components including an animated SVG globe (LiveGlobe.tsx) showing
220+ speaking engagements.

## What was archived

- `apps/web/app/(public)/live/page.tsx`              — old 178-line
                                                       static page
- `apps/web/components/live/InquiryForm.tsx`         — booking inquiry
                                                       form (replaced
                                                       by mailto CTAs
                                                       on the new page)
- `apps/web/app/api/live/inquire/route.ts`           — backing API
                                                       route for the
                                                       form (orphaned
                                                       once the form
                                                       was archived)
