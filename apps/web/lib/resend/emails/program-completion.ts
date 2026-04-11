import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const LOGO_URL = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_nav_dark.png'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://web-production-db912.up.railway.app'

function completionEmailHtml({ displayName, completionDate }: { displayName: string; completionDate: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You've completed The Evolved Architecture™</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0F18;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0F18;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="background-color:#112535;border-radius:12px 12px 0 0;padding:28px 40px;border-bottom:2px solid #0ABFA3;">
            <img src="${LOGO_URL}" alt="Evolved Pros" width="160" style="display:block;max-width:160px;height:auto;" />
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td align="center" style="background-color:#111926;padding:48px 40px 32px;">
            <div style="width:72px;height:72px;border-radius:50%;border:2px solid #0ABFA3;background-color:rgba(10,191,163,0.08);display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
              <span style="font-size:32px;">✓</span>
            </div>
            <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#C9A84C;margin:0 0 12px;letter-spacing:0.04em;">EVOLVED</h1>
            <p style="font-size:18px;color:#ffffff;font-weight:600;margin:0 0 8px;">You have completed The Evolved Architecture™</p>
            <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0;">${displayName} &nbsp;·&nbsp; ${completionDate}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#111926;padding:0 40px 40px;">
            <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin:0 0 20px;">
              ${displayName},
            </p>
            <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin:0 0 20px;">
              You have completed all six pillars of The Evolved Architecture™ — Foundation, Identity, Mental Toughness, Strategy, Accountability, and Execution.
            </p>
            <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin:0 0 20px;">
              You are now part of a small group of sales professionals who have done the work.
            </p>
            <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin:0 0 32px;">
              The EVOLVED Alumni badge has been added to your profile. Use this framework for the rest of your career.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <a href="${APP_URL}/academy/completion"
                     style="display:inline-block;background-color:#0ABFA3;color:#0A0F18;font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:14px 36px;border-radius:6px;text-decoration:none;">
                    View Your Completion Certificate →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background-color:#0d1520;border-radius:0 0 12px 12px;padding:24px 40px;">
            <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:0 0 4px;font-style:italic;">
              "Vision is common. Execution is rare. Be rare."
            </p>
            <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;">
              — George Leith, Evolved Pros
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendProgramCompletionEmail({
  email,
  displayName,
  completionDate,
}: {
  email: string
  displayName: string
  completionDate: string
}) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: "You've completed The Evolved Architecture™ — George Leith",
      html: completionEmailHtml({ displayName, completionDate }),
    })
  } catch (err) {
    console.error('[Resend] Program completion email failed:', err)
    // Fire-and-forget — don't throw
  }
}
