import { NextResponse } from 'next/server';
import { getApiContext } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Records the parent's PDPA consent for ALL of their pending child links.
 * Parents cannot UPDATE parent_student_links through RLS, so this runs server-side,
 * strictly scoped to the signed-in parent's own rows.
 */
export async function POST() {
  const ctx = await getApiContext(['parent']);
  if ('error' in ctx) return ctx.error;

  const admin = createAdminClient();
  const { error } = await admin
    .from('parent_student_links')
    .update({ consent_given: true, consent_date: new Date().toISOString() })
    .eq('parent_id', ctx.user.id)
    .eq('consent_given', false);

  if (error) return NextResponse.json({ error: 'Imeshindwa kuhifadhi idhini.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
