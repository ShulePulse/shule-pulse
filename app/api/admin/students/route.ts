import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { linkParent } from '@/lib/admin/parents';
import { RELATIONSHIPS } from '@/lib/constants';

const parentSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(9).max(20),
  email: z.string().trim().email().max(200),
  relationship: z.enum(RELATIONSHIPS),
});

const fields = {
  full_name: z.string().trim().min(2).max(120),
  admission_no: z.string().trim().min(1).max(40),
  class_name: z.string().trim().min(1).max(40),
  stream: z.string().trim().max(10).optional().nullable(),
};

const createSchema = z.object({ ...fields, parent: parentSchema.optional() });
const updateSchema = z.object({ id: z.string().uuid(), ...fields, parent: parentSchema.optional() });
const deleteSchema = z.object({ id: z.string().uuid() });

// Students are written through the signed-in admin's session, so RLS enforces the school boundary.

export async function POST(request: Request) {
  const ctx = await getApiContext(['admin']);
  if ('error' in ctx) return ctx.error;
  const { supabase, profile } = ctx;
  if (!profile.school_id) return jsonError('Akaunti haina shule.', 400);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Taarifa si sahihi. Angalia fomu.', 400);
  const { parent, stream, ...student } = parsed.data;

  const { data, error } = await supabase
    .from('students')
    .insert({ ...student, stream: stream?.trim() || null, school_id: profile.school_id })
    .select('id')
    .single();
  if (error || !data) {
    return jsonError(error?.code === '23505' ? 'Namba hii ya usajili tayari ipo.' : 'Imeshindwa kuongeza mwanafunzi.', error?.code === '23505' ? 409 : 500);
  }

  let tempPassword: string | undefined;
  if (parent) {
    const res = await linkParent(createAdminClient(), profile.school_id, data.id, parent);
    if (res.error) return NextResponse.json({ id: data.id, warning: `Mwanafunzi ameongezwa, lakini mzazi hakuunganishwa: ${res.error}` }, { status: 201 });
    tempPassword = res.tempPassword;
  }
  return NextResponse.json({ id: data.id, tempPassword }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getApiContext(['admin']);
  if ('error' in ctx) return ctx.error;
  const { supabase, profile } = ctx;
  if (!profile.school_id) return jsonError('Akaunti haina shule.', 400);

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Taarifa si sahihi. Angalia fomu.', 400);
  const { id, parent, stream, ...student } = parsed.data;

  const { data, error } = await supabase
    .from('students')
    .update({ ...student, stream: stream?.trim() || null })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) return jsonError(error.code === '23505' ? 'Namba hii ya usajili tayari ipo.' : 'Imeshindwa kuhifadhi.', error.code === '23505' ? 409 : 500);
  if (!data) return jsonError('Mwanafunzi hapatikani.', 404);

  let tempPassword: string | undefined;
  if (parent) {
    const res = await linkParent(createAdminClient(), profile.school_id, id, parent);
    if (res.error) return jsonError(`Mwanafunzi amehifadhiwa, lakini mzazi hakuunganishwa: ${res.error}`, 400);
    tempPassword = res.tempPassword;
  }
  return NextResponse.json({ ok: true, tempPassword });
}

export async function DELETE(request: Request) {
  const ctx = await getApiContext(['admin']);
  if ('error' in ctx) return ctx.error;

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Ombi si sahihi.', 400);

  const { data, error } = await ctx.supabase.from('students').delete().eq('id', parsed.data.id).select('id');
  if (error) return jsonError('Imeshindwa kufuta.', 500);
  if (!data || data.length === 0) return jsonError('Mwanafunzi hapatikani.', 404);
  return NextResponse.json({ ok: true });
}
