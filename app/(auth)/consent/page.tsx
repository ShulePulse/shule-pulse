import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requireProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { RELATIONSHIP_LABELS } from '@/lib/constants';
import { ConsentForm } from './ConsentForm';

export const metadata: Metadata = { title: 'Idhini ya taarifa' };

export default async function ConsentPage() {
  const { user, supabase } = await requireProfile(['parent']);

  const { data: pending } = await supabase
    .from('parent_student_links')
    .select('student_id, relationship')
    .eq('parent_id', user.id)
    .eq('consent_given', false);

  if (!pending || pending.length === 0) redirect('/parent/dashboard');

  // Parents cannot read students before consenting (RLS), so fetch only the names
  // of THEIR OWN pending children server-side to make the consent informed.
  const admin = createAdminClient();
  const { data: students } = await admin
    .from('students')
    .select('id, full_name')
    .in('id', pending.map((p) => p.student_id));
  const names = new Map((students ?? []).map((s) => [s.id, s.full_name] as [string, string]));

  const children = pending.map((p) => ({
    name: names.get(p.student_id) ?? 'Mwanafunzi',
    relationship: RELATIONSHIP_LABELS[p.relationship],
  }));

  return <ConsentForm kids={children} />;
}
