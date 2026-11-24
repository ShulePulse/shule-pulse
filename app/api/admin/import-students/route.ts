import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { linkParent } from '@/lib/admin/parents';
import { RELATIONSHIPS } from '@/lib/constants';

export const maxDuration = 60;

const rowSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  admission_no: z.string().trim().min(1).max(40),
  class_name: z.string().trim().min(1).max(40),
  stream: z.string().trim().max(10).optional().nullable(),
  parent_name: z.string().trim().max(120).optional().nullable(),
  parent_phone: z.string().trim().max(20).optional().nullable(),
  parent_email: z.string().trim().max(200).optional().nullable(),
  relationship: z.enum(RELATIONSHIPS).optional().nullable(),
});
// The browser sends chunks of ~50 rows so each request stays within serverless time limits.
const bodySchema = z.object({ rows: z.array(rowSchema).min(1).max(100) });

export async function POST(request: Request) {
  const ctx = await getApiContext(['admin']);
  if ('error' in ctx) return ctx.error;
  const { supabase, profile } = ctx;
  const schoolId = profile.school_id;
  if (!schoolId) return jsonError('Akaunti haina shule.', 400);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Data si sahihi. Kila mstari unahitaji jina, namba ya usajili na darasa.', 400);
  const { rows } = parsed.data;

  const { data: saved, error } = await supabase
    .from('students')
    .upsert(
      rows.map((r) => ({
        school_id: schoolId,
        full_name: r.full_name,
        admission_no: r.admission_no,
        class_name: r.class_name,
        stream: r.stream?.trim() || null,
      })),
      { onConflict: 'school_id,admission_no' },
    )
    .select('id, admission_no');
  if (error) return jsonError('Imeshindwa kuingiza wanafunzi.', 500);

  const idByAdmission = new Map<string, string>((saved ?? []).map((s) => [s.admission_no, s.id]));
  const admin = createAdminClient();
  const credentials: { email: string; tempPassword: string }[] = [];
  const parentErrors: string[] = [];

  for (const r of rows) {
    if (!r.parent_name || !r.parent_email || !r.parent_phone) continue;
    const studentId = idByAdmission.get(r.admission_no);
    if (!studentId) continue;
    const email = z.string().email().safeParse(r.parent_email);
    if (!email.success) {
      parentErrors.push(`${r.admission_no}: barua pepe ya mzazi si sahihi`);
      continue;
    }
    const res = await linkParent(admin, schoolId, studentId, {
      full_name: r.parent_name,
      phone: r.parent_phone,
      email: email.data,
      relationship: r.relationship ?? 'Guardian',
    });
    if (res.error) parentErrors.push(`${r.admission_no}: ${res.error}`);
    else if (res.tempPassword) credentials.push({ email: email.data.toLowerCase(), tempPassword: res.tempPassword });
  }

  return NextResponse.json({ imported: saved?.length ?? 0, credentials, parentErrors });
}
