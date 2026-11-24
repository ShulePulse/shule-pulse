import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

const createSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(20).optional().nullable(),
  password: z.string().min(8).max(72),
});
const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional().nullable(),
});
const deleteSchema = z.object({ id: z.string().uuid() });

/** Confirms the target is a teacher of the caller's own school (service role bypasses RLS). */
async function ownTeacher(schoolId: string, id: string) {
  const { data } = await createAdminClient().from('users').select('id, role, school_id').eq('id', id).maybeSingle();
  return data && data.role === 'teacher' && data.school_id === schoolId ? data : null;
}

export async function POST(request: Request) {
  const ctx = await getApiContext(['admin']);
  if ('error' in ctx) return ctx.error;
  const schoolId = ctx.profile.school_id;
  if (!schoolId) return jsonError('Akaunti haina shule.', 400);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Taarifa si sahihi. Nenosiri liwe angalau herufi 8.', 400);
  const { full_name, email, phone, password } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name },
    app_metadata: { role: 'teacher', school_id: schoolId },
  });
  if (error || !data.user) {
    const exists = error?.message.toLowerCase().includes('already');
    return jsonError(exists ? 'Barua pepe hii tayari inatumika.' : 'Imeshindwa kuunda mwalimu.', exists ? 409 : 500);
  }
  if (phone) await admin.from('users').update({ phone }).eq('id', data.user.id);
  return NextResponse.json({ id: data.user.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getApiContext(['admin']);
  if ('error' in ctx) return ctx.error;
  const schoolId = ctx.profile.school_id;
  if (!schoolId) return jsonError('Akaunti haina shule.', 400);

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Taarifa si sahihi.', 400);
  if (!(await ownTeacher(schoolId, parsed.data.id))) return jsonError('Mwalimu hapatikani.', 404);

  const { error } = await createAdminClient()
    .from('users')
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq('id', parsed.data.id);
  if (error) return jsonError('Imeshindwa kuhifadhi.', 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ctx = await getApiContext(['admin']);
  if ('error' in ctx) return ctx.error;
  const schoolId = ctx.profile.school_id;
  if (!schoolId) return jsonError('Akaunti haina shule.', 400);

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Ombi si sahihi.', 400);
  if (!(await ownTeacher(schoolId, parsed.data.id))) return jsonError('Mwalimu hapatikani.', 404);

  const { error } = await createAdminClient().auth.admin.deleteUser(parsed.data.id);
  if (error) return jsonError('Imeshindwa kufuta.', 500);
  return NextResponse.json({ ok: true });
}
