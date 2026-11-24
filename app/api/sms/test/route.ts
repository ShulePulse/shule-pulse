import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { sendSms } from '@/lib/sms/beem';
import { normalizeTzPhone } from '@/lib/utils';

const bodySchema = z.object({ phone: z.string().min(9).max(20) });

/** DEVELOPMENT ONLY: sends one test SMS to your own number. Returns 404 in production. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Haipatikani.' }, { status: 404 });
  }
  const ctx = await getApiContext(['admin', 'teacher']);
  if ('error' in ctx) return ctx.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Weka namba ya simu.', 400);
  const phone = normalizeTzPhone(parsed.data.phone);
  if (!phone) return jsonError('Namba ya simu si sahihi. Tumia 07XXXXXXXX au 2557XXXXXXXX.', 400);

  const result = await sendSms({ to: phone, message: 'ShulePulse: huu ni ujumbe wa majaribio.' });
  return NextResponse.json({ result, dryRun: process.env.SMS_DRY_RUN === 'true' });
}
