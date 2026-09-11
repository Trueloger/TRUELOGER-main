// src/lib/email/template.ts
// One branded HTML shell every transactional email is rendered inside
// — TrueLoger wordmark, ivory/lavender/purple/gold palette, serif
// heading, a CTA button, and a footer — so nothing looks like a raw
// automated backend email (AGENTS "email template design").
export function emailShell(input: { heading: string; bodyHtml: string; ctaLabel?: string; ctaHref?: string }): string {
  const cta =
    input.ctaLabel && input.ctaHref
      ? `<tr><td style="padding:28px 40px 8px;">
           <a href="${input.ctaHref}" style="display:inline-block;background:#6D3FA8;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 28px;border-radius:999px;">${input.ctaLabel}</a>
         </td></tr>`
      : "";

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#F7F3EE;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EE;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E7DCF0;">
        <tr><td style="background:linear-gradient(135deg,#F3ECFA,#EFE6F7);padding:28px 40px;text-align:center;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#4A2E73;letter-spacing:0.04em;">TRUELOGER</span>
        </td></tr>
        <tr><td style="padding:32px 40px 4px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:#3E2A5C;">${input.heading}</h1>
        </td></tr>
        <tr><td style="padding:12px 40px 4px;font-size:14px;line-height:1.6;color:#4A3F5C;">${input.bodyHtml}</td></tr>
        ${cta}
        <tr><td style="padding:28px 40px 32px;border-top:1px solid #EFE6F7;margin-top:16px;">
          <p style="margin:16px 0 0;font-size:12px;color:#8B7FA0;">Traditional astrological interpretation, offered for spiritual guidance and reflection — never medical, legal, or financial advice.</p>
          <p style="margin:8px 0 0;font-size:12px;color:#8B7FA0;">TrueLoger · support@trueloger.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
