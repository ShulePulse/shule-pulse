import type { createClient } from '@/lib/supabase/server';
import type { Relationship } from '@/types';

type Supabase = ReturnType<typeof createClient>;

export type Child = { id: string; full_name: string; class_name: string; stream: string | null; admission_no: string; relationship: Relationship };

/** Children linked to this parent. RLS guarantees only consented, linked students come back. */
export async function getChildren(supabase: Supabase, parentId: string): Promise<Child[]> {
  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id, relationship')
    .eq('parent_id', parentId);
  if (!links || links.length === 0) return [];

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, class_name, stream, admission_no')
    .in('id', links.map((l) => l.student_id))
    .order('full_name');

  return (students ?? []).map((s) => ({
    ...s,
    relationship: links.find((l) => l.student_id === s.id)?.relationship ?? 'Guardian',
  }));
}
