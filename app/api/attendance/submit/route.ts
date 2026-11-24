import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyAbsences } from '@/lib/sms/notify';
import { todayEAT } from '@/lib/utils';

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z
    .array(
      z.object({
        student_id: z.string().uuid(),
        status: z.enum(['present', 'absent', 'late']),
      }),
    )
    .min(1)
    .max(500),
});

/**
 * Saves a class register (upsert per student+date). Newly absent students trigger an SMS
 * to their consenting parents. Also used by the offline queue when it syncs.
 */
export async function POST(request: Request) {
  const ctx = await getApiContext(['teacher', 'admin']);
  if ('error' in ctx) return ctx.error;
  const { supabase, user, profile } = ctx;
  if (!profile.school_id) return jsonError('Akaunti haina shule.', 400);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Data si sahihi.', 400);
  const { date, records } = parsed.data;
  if (date > todayEAT()) return jsonError('Huwezi kuingiza mahudhurio ya tarehe ijayo.', 400);

  // De-duplicate by student (last one wins).
  const byStudent = new Map<string, 'present' | 'absent' | 'late'>();
  for (const r of records) byStudent.set(r.student_id, r.status);
  const ids = Array.from(byStudent.keys());

  // RLS-scoped check: every student must be visible (= same school) to this user.
  const { data: visible, error: visibleError } = await supabase.from('students').select('id').in('id', ids);
  if (visibleError) return jsonError('Imeshindwa kuthibitisha wanafunzi.', 500);
  if ((visible?.length ?? 0) !== ids.length) return jsonError('Baadhi ya wanafunzi hawapo kwenye shule yako.', 403);

  const { data: existing } = await supabase.from('attendance').select('student_id, status').eq('date', date).in('student_id', ids);
  const previous = new Map<string, string>((existing ?? []).map((e) => [e.student_id, e.status]));

  const rows = ids.map((id) => ({
    student_id: id,
    teacher_id: user.id,
    date,
    status: byStudent.get(id) ?? 'present',
  }));

  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' });
  if (error) return jsonError('Imeshindwa kuhifadhi mahudhurio.', 500);

  // SMS only for students who just became absent (avoids duplicate SMS on re-submit / retry).
  const newlyAbsent = rows.filter((r) => r.status === 'absent' && previous.get(r.student_id) !== 'absent').map((r) => r.student_id);
  let sms = { sent: 0, failed: 0, skipped: 0 };
  if (newlyAbsent.length > 0) {
    try {
      sms = await notifyAbsences(createAdminClient(), { schoolId: profile.school_id, studentIds: newlyAbsent, date });
    } catch (e) {
      console.error('[attendance] sms notify failed', e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ saved: rows.length, absent: newlyAbsent.length, sms });
}
