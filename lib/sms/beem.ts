import 'server-only';

export type SmsResult = { ok: boolean; dryRun?: boolean; error?: string };

const BEEM_URL = 'https://apisms.beem.africa/v1/send';

/**
 * Minimal Beem Africa client. `to` must be in 2557XXXXXXXX format.
 * Verify the payload against Beem's current docs before going live: https://docs.beem.africa
 * With SMS_DRY_RUN=true nothing is sent (safe for development).
 */
export async function sendSms({ to, message }: { to: string; message: string }): Promise<SmsResult> {
  if (process.env.SMS_DRY_RUN === 'true') {
    // Mask the number so we do not write phone numbers into logs.
    console.info(`[sms:dry-run] to=***${to.slice(-3)} chars=${message.length}`);
    return { ok: false, dryRun: true };
  }

  const apiKey = process.env.BEEM_API_KEY;
  const secret = process.env.BEEM_SECRET;
  if (!apiKey || !secret) return { ok: false, error: 'Beem haijasanidiwa (BEEM_API_KEY / BEEM_SECRET).' };

  const auth = Buffer.from(`${apiKey}:${secret}`).toString('base64');
  try {
    const res = await fetch(BEEM_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_addr: process.env.BEEM_SENDER_ID ?? 'INFO',
        schedule_time: '',
        encoding: 0,
        message,
        recipients: [{ recipient_id: 1, dest_addr: to }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => null)) as { successful?: boolean; message?: string } | null;
    if (res.ok && json?.successful !== false) return { ok: true };
    return { ok: false, error: json?.message ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Hitilafu ya mtandao' };
  }
}
