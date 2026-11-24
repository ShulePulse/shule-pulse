import { requireProfile } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { LangProvider } from '@/components/admin/LangProvider';
import { ForbiddenNotice } from '@/components/shared/ForbiddenNotice';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireProfile(['admin', 'super_admin']);

  let schoolName = profile.role === 'super_admin' ? 'Msimamizi mkuu' : 'Shule';
  if (profile.school_id) {
    const { data: school } = await supabase.from('schools').select('name').eq('id', profile.school_id).maybeSingle();
    if (school) schoolName = school.name;
  }

  return (
    <LangProvider>
      <div className="min-h-screen lg:flex">
        <AdminNav name={profile.full_name} schoolName={schoolName} />
        <main className="min-w-0 flex-1 p-4 lg:p-8">
          <ForbiddenNotice />
          {children}
        </main>
      </div>
    </LangProvider>
  );
}
