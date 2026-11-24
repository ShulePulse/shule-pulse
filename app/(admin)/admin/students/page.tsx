import type { Metadata } from 'next';
import { requireProfile } from '@/lib/auth';
import { T } from '@/components/admin/LangProvider';
import { StudentsManager, type StudentWithParents } from '@/components/admin/StudentsManager';

export const metadata: Metadata = { title: 'Wanafunzi' };

export default async function AdminStudentsPage() {
  const { supabase } = await requireProfile(['admin']);

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, admission_no, class_name, stream')
    .order('class_name')
    .order('full_name')
    .limit(2000);

  const ids = (students ?? []).map((s) => s.id);
  const { data: links } = ids.length
    ? await supabase.from('parent_student_links').select('student_id, parent_id, relationship, consent_given').in('student_id', ids)
    : { data: [] as { student_id: string; parent_id: string; relationship: 'Mother' | 'Father' | 'Guardian'; consent_given: boolean }[] };

  const parentIds = Array.from(new Set((links ?? []).map((l) => l.parent_id)));
  const { data: parents } = parentIds.length
    ? await supabase.from('users').select('id, full_name, phone, email').in('id', parentIds)
    : { data: [] as { id: string; full_name: string; phone: string | null; email: string | null }[] };

  const rows: StudentWithParents[] = (students ?? []).map((s) => ({
    ...s,
    parents: (links ?? [])
      .filter((l) => l.student_id === s.id)
      .map((l) => {
        const p = (parents ?? []).find((x) => x.id === l.parent_id);
        return {
          id: l.parent_id,
          full_name: p?.full_name ?? '-',
          phone: p?.phone ?? null,
          email: p?.email ?? null,
          relationship: l.relationship,
          consent_given: l.consent_given,
        };
      }),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        <T k="students.title" />
      </h1>
      <StudentsManager students={rows} />
    </div>
  );
}
