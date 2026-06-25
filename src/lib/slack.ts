// Best-effort Slack notification via an Incoming Webhook. No-ops when
// SLACK_WEBHOOK_URL is unset, so flows never hard-fail on Slack.
export async function postSlack(text: string): Promise<{ sent: boolean }> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return { sent: false };
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    return { sent: res.ok };
  } catch {
    return { sent: false };
  }
}
