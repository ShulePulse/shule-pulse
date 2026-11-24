import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';

const bodySchema = z.object({
  term_id: z.string().uuid(),
  assessment_name: z.string().trim().min(1).max(80),
  rows: z
    .array(
      z.object({
        admission_no: z.string().trim().min(1).max(40),
        subject: z.string().trim().min(1).max(60),
        score: z.number().finite().min(0),
        max_score: z.number().finite().positive().max(1000),
      }),
    )
    .min(1)
    .max(1000),
});

/** Bulk-inserts grades from the Excel/CSV preview. RLS restricts to the caller's school. */
export async function POST(request: Request) {
  const ctx = await getApiContext(['teacher', 'admin']);
  if ('error' in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Data si sahihi.', 400);
  const { term_id, assessment_name, rows } = parsed.data;

  if (rows.some((r) => r.score > r.max_score)) return jsonError('Kuna alama zinazozidi alama kamili.', 400);

  const { data: term } = await supabase.from('academic_terms').select('id').eq('id', term_id).maybeSingle();
  if (!term) return jsonError('Muhula haupo.', 404);

  const admissionNos = Array.from(new Set(rows.map((r) => r.admission_no)));
  const { data: students } = await supabase.from('students').select('id, admission_no').in('admission_no', admissionNos);
  const idByAdmission = new Map<string, string>((students ?? []).map((s) => [s.admission_no, s.id]));

  const unknown = admissionNos.filter((a) => !idByAdmission.has(a));
  const inserts = rows.flatMap((r) => {
    const studentId = idByAdmission.get(r.admission_no);
    if (!studentId) return [];
    return [
      {
        student_id: studentId,
        term_id,
        subject: r.subject,
        assessment_name,
        score: r.score,
        max_score: r.max_score,
        teacher_id: user.id,
      },
    ];
  });

  if (inserts.length > 0) {
    const { error } = await supabase.from('grades').insert(inserts);
    if (error) return jsonError('Imeshindwa kuhifadhi alama.', 500);
  }

  return NextResponse.json({ inserted: inserts.length, unknownAdmissionNos: unknown });
}
