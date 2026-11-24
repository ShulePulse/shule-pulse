import 'server-only';
import type { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';
import { sendSms } from '@/lib/sms/beem';
import { formatDateSw, normalizeTzPhone } from '@/lib/utils';

type Admin = ReturnType<typeof createAdminClient>;
type SmsLogUpdate = Database['public']['Tables']['sms_logs']['Update'];

export type NotifyResult = { sent: number; failed: number; skipped: number };

/**
 * Sends an absence SMS to every parent (with PDPA consent) of each given student,
 * and records every attempt in sms_logs. Runs with the service role, so callers MUST
 * have verified that the students belong to the caller's school first.
 */
export async function notifyAbsences(
  admin: Admin,
  input: { schoolId: string; studentIds: string[]; date: string },
): Promise<NotifyResult> {
  const result: NotifyResult = { sent: 0, failed: 0, skipped: 0 };
  if (input.studentIds.length === 0) return result;

  const [{ data: students }, { data: school }, { data: links }] = await Promise.all([
    admin.from('students').select('id, full_name').in('id', input.studentIds).eq('school_id', input.schoolId),
    admin.from('schools').select('name').eq('id', input.schoolId).single(),
    admin
      .from('parent_student_links')
      .select('parent_id, student_id')
      .in('student_id', input.studentIds)
      .eq('consent_given', true),
  ]);

  const parentIds = Array.from(new Set((links ?? []).map((l) => l.parent_id)));
  const { data: parents } = parentIds.length
    ? await admin.from('users').select('id, phone').in('id', parentIds)
    : { data: [] as { id: string; phone: string | null }[] };

  const phoneByParent = new Map<string, string | null>((parents ?? []).map((p) => [p.id, p.phone]));
  const schoolName = school?.name ?? 'Shule';

  const jobs: Promise<void>[] = [];
  for (const student of students ?? []) {
    const studentLinks = (links ?? []).filter((l) => l.student_id === student.id);
    if (studentLinks.length === 0) result.skipped += 1;

    for (const link of studentLinks) {
      const phone = normalizeTzPhone(phoneByParent.get(link.parent_id));
      if (!phone) {
        result.skipped += 1;
        continue;
      }
      const message = `ShulePulse: ${student.full_name} hayupo shuleni leo (${formatDateSw(input.date)}). ${schoolName}`;
      jobs.push(
        dispatch(admin, { schoolId: input.schoolId, studentId: student.id, phone, message }).then((ok) => {
          if (ok === 'sent') result.sent += 1;
          else if (ok === 'failed') result.failed += 1;
          else result.skipped += 1;
        }),
      );
    }
  }

  await Promise.all(jobs);
  return result;
}

async function dispatch(
  admin: Admin,
  args: { schoolId: string; studentId: string; phone: string; message: string },
): Promise<'sent' | 'failed' | 'dry-run'> {
  const { data: log } = await admin
    .from('sms_logs')
    .insert({
      school_id: args.schoolId,
      student_id: args.studentId,
      recipient_phone: args.phone,
      message: args.message,
      status: 'pending',
    })
    .select('id')
    .single();

  const res = await sendSms({ to: args.phone, message: args.message });

  let patch: SmsLogUpdate;
  let outcome: 'sent' | 'failed' | 'dry-run';
  if (res.ok) {
    patch = { status: 'sent', sent_at: new Date().toISOString(), error: null };
    outcome = 'sent';
  } else if (res.dryRun) {
    patch = { error: 'dry-run' };
    outcome = 'dry-run';
  } else {
    patch = { status: 'failed', error: res.error ?? 'unknown' };
    outcome = 'failed';
  }

  if (log) await admin.from('sms_logs').update(patch).eq('id', log.id);
  return outcome;
}
