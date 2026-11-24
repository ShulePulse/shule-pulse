import 'server-only';
import { randomBytes } from 'crypto';
import type { createAdminClient } from '@/lib/supabase/admin';
import type { Relationship } from '@/types';

type Admin = ReturnType<typeof createAdminClient>;

export type ParentInput = {
  full_name: string;
  phone: string;
  email: string;
  relationship: Relationship;
};

/**
 * Finds or creates a parent account in the given school and links it to a student
 * (consent_given stays false until the parent accepts the PDPA consent on first login).
 * Returns a temporary password ONLY when a new account was created.
 */
export async function linkParent(
  admin: Admin,
  schoolId: string,
  studentId: string,
  parent: ParentInput,
): Promise<{ tempPassword?: string; error?: string }> {
  const email = parent.email.trim().toLowerCase();

  const { data: existing } = await admin.from('users').select('id, role, school_id').eq('email', email).maybeSingle();

  let parentId: string;
  let tempPassword: string | undefined;

  if (existing) {
    if (existing.role !== 'parent' || existing.school_id !== schoolId) {
      return { error: `Barua pepe ${email} inatumika na akaunti nyingine.` };
    }
    parentId = existing.id;
  } else {
    tempPassword = randomBytes(9).toString('base64url');
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: parent.full_name },
      app_metadata: { role: 'parent', school_id: schoolId },
    });
    if (error || !data.user) return { error: error?.message ?? 'Imeshindwa kuunda akaunti ya mzazi.' };
    parentId = data.user.id;
    await admin.from('users').update({ phone: parent.phone }).eq('id', parentId);
  }

  const { error: linkError } = await admin
    .from('parent_student_links')
    .upsert(
      { parent_id: parentId, student_id: studentId, relationship: parent.relationship },
      { onConflict: 'parent_id,student_id', ignoreDuplicates: true },
    );
  if (linkError) return { error: linkError.message };

  return { tempPassword };
}
