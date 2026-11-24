import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { BEHAVIOR_TAGS } from '@/lib/constants';

const bodySchema = z.object({
  student_id: z.string().uuid(),
  tag: z.string().min(1).max(60),
  notes: z.string().trim().max(300).optional().nullable(),
});

/** Records one behavior log. Severity is derived on the server from the tag. */
export async function POST(request: Request) {
  const ctx = await getApiContext(['teacher', 'admin']);
  if ('error' in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Data si sahihi.', 400);
  const { student_id, tag, notes } = parsed.data;

  const def = BEHAVIOR_TAGS.find((t) => t.value === tag);
  if (!def) return jsonError('Tag haijulikani.', 400);

  const { data: student } = await supabase.from('students').select('id').eq('id', student_id).maybeSingle();
  if (!student) return jsonError('Mwanafunzi hayupo kwenye shule yako.', 403);

  const { error } = await supabase.from('behavior_logs').insert({
    student_id,
    teacher_id: user.id,
    tag: def.value,
    severity: def.severity,
    notes: notes ? notes : null,
  });
  if (error) return jsonError('Imeshindwa kuhifadhi tabia.', 500);

  return NextResponse.json({ ok: true });
}
