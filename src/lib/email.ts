// Best-effort transactional email via SendGrid v3. No-ops (returns { sent:false })
// when SENDGRID_API_KEY / EMAIL_FROM are not configured, so flows never hard-fail
// on email. Zero-dependency (uses fetch); runs on the Node/serverless runtime.
interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { sent: false };
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: process.env.EMAIL_FROM_NAME || "承策 Chengce" },
        subject,
        // SendGrid requires text/plain before text/html.
        content: [...(text ? [{ type: "text/plain", value: text }] : []), { type: "text/html", value: html }],
      }),
    });
    if (res.status >= 200 && res.status < 300) return { sent: true };
    return { sent: false, error: `SendGrid ${res.status}` };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "email failed" };
  }
}
