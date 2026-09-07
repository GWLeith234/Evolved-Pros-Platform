# Admin button safety (EP-ADMIN-BUTTON-SAFETY-2026-09-06)

Reusable M1 confirm lives at `apps/web/components/admin/safety/ConfirmDialog.tsx`.
High-risk admin clicks open that dialog. They do not run the mutation immediately.

## M3 KEEP AS BAR (do not redesign)

Revenue, Speaking, and Careers empty states are the clarity bar. Keep them:
one honest line about what is missing, no invented metrics, no decorative empty.

- Revenue: `apps/web/app/(admin)/admin/revenue/page.tsx` — no billing events yet; do not estimate MRR from member count.
- Speaking: `apps/web/components/live/LiveUpcomingDates.tsx` (public) and the admin dates empty on `apps/web/app/(admin)/admin/speaking/page.tsx` — say there are no confirmed dates / holds yet.
- Careers: `apps/web/app/(public)/media/careers/CareersClient.tsx` — "No listings right now. Check back soon."

Do not restyle these three empties in a button-safety pass.

## Controls not found

- Course-level publish / delete on `/admin/courses` (list shows a Published / Draft badge only). Lesson publish + delete on `/admin/courses/[courseId]` are gated.
