import type { Metadata } from 'next';
import { requireProfile } from '@/lib/auth';
import { T } from '@/components/admin/LangProvider';
import { TeachersManager } from '@/components/admin/TeachersManager';

export const metadata: Metadata = { title: 'Walimu' };

export default async function AdminTeachersPage() {
  const { supabase } = await requireProfile(['admin']);
  // RLS (users_select_admin_school) limits this to the admin's own school.
  const { data: teachers } = await supabase
    .from('users')
    .select('id, full_name, email, phone')
    .eq('role', 'teacher')
    .order('full_name');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        <T k="teachers.title" />
      </h1>
      <TeachersManager teachers={teachers ?? []} />
    </div>
  );
}
