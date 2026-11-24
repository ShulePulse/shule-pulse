import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyAbsences } from '@/lib/sms/notify';

const bodySchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Manually (re)send absence SMS. Safety: only students who are actually marked
 * absent on that date, in the caller's own school, can be notified - so this cannot
 * be abused as a generic SMS relay.
 */
export async function POST(request: Request) {
  const ctx = await getApiContext(['teacher', 'admin']);
  if ('error' in ctx) return ctx.error;
  const { supabase, profile } = ctx;
  if (!profile.school_id) return jsonError('Akaunti haina shule.', 400);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Data si sahihi.', 400);
  const { studentIds, date } = parsed.data;

  const { data: absent } = await supabase
    .from('attendance')
    .select('student_id')
    .eq('date', date)
    .eq('status', 'absent')
    .in('student_id', studentIds);

  const ids = (absent ?? []).map((a) => a.student_id);
  if (ids.length === 0) return jsonError('Hakuna mwanafunzi aliyewekwa "Hayupo" kwa tarehe hiyo.', 400);

  const sms = await notifyAbsences(createAdminClient(), { schoolId: profile.school_id, studentIds: ids, date });
  return NextResponse.json({ sms });
}
