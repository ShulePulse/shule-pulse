import type { Metadata } from 'next';
import { requireProfile } from '@/lib/auth';
import { T } from '@/components/admin/LangProvider';
import { ReportsForm } from '@/components/admin/ReportsForm';
import { Alert } from '@/components/shared/Alert';

export const metadata: Metadata = { title: 'Ripoti za PDF' };

export default async function AdminReportsPage() {
  const { supabase } = await requireProfile(['admin']);

  const [{ data: students }, { data: terms }] = await Promise.all([
    supabase.from('students').select('id, full_name, class_name, stream, admission_no').order('class_name').order('full_name').limit(2000),
    supabase.from('academic_terms').select('id, name, year').order('year', { ascending: false }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        <T k="reports.title" />
      </h1>
      {(students ?? []).length === 0 || (terms ?? []).length === 0 ? (
        <Alert variant="warning">Unahitaji angalau mwanafunzi mmoja na muhula mmoja ili kuzalisha ripoti.</Alert>
      ) : (
        <ReportsForm students={students ?? []} terms={terms ?? []} />
      )}
    </div>
  );
}
