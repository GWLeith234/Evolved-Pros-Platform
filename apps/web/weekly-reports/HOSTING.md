# Weekly report PWAs

These four apps are served by the Platform (this Next.js app). They are not a public static site.

| App | URL |
| --- | --- |
| Index | `/admin/reports` |
| AdCellerant Weekly | `/admin/reports/adcellerant/` |
| Evolved Pros Weekly | `/admin/reports/evolved-pros/` |
| EvolveX360 Weekly | `/admin/reports/evolvex360/` |
| GWLeith $ Weekly | `/admin/reports/gwleith-money/` |

Each app keeps its own manifest `start_url` and `scope` of `/admin/reports/<slug>/`, `display: standalone`, and its own service worker, so each one installs separately. The manifest link keeps `crossorigin="use-credentials"`.

Every one of those URLs, including `manifest.webmanifest`, `sw.js`, icons, and `report.json`, checks the Supabase session on the server. Only platform user ids in `private.report_viewers` are allowed. The admin role is not the gate. Anyone else who is signed in gets 404. Signed-out pages redirect to login. Signed-out JSON and asset requests get 401.

The allowlist and the report payloads live in the private schema (migration `105_private_weekly_reports.sql`). anon and authenticated have no grants. The server reads them with the service role after the gate. Do not apply that migration to a hosted database until George says YES.

`report.json` is not in git. The shell fetches it at runtime. Responses use `Cache-Control: private, no-store` and `Vary: Cookie`.

The normal admin nav does not link here. A Weekly reports link renders only for an allowlisted user.
