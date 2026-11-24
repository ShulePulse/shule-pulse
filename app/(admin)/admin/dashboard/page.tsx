import type { Metadata } from 'next';
import { requireProfile } from '@/lib/auth';
import { T } from '@/components/admin/LangProvider';
import { Card, CardContent } from '@/components/ui/card';
import type { I18nKey } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Dashibodi' };

export default async function AdminDashboardPage() {
  const { supabase, profile } = await requireProfile(['admin', 'super_admin']);

  if (profile.role === 'super_admin') {
    const { data: schools } = await supabase.from('schools').select('id, name, region, created_at').order('created_at', { ascending: false });
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Shule zote</h1>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {(schools ?? []).map((s) => (
                <li key={s.id} className="flex justify-between p-4 text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.region}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [students, sms, teachers, parents] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('sms_logs').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
  ]);

  const stats: { key: I18nKey; value: number }[] = [
    { key: 'dash.students', value: students.count ?? 0 },
    { key: 'dash.teachers', value: teachers.count ?? 0 },
    { key: 'dash.parents', value: parents.count ?? 0 },
    { key: 'dash.sms', value: sms.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        <T k="dash.title" />
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardContent className="p-6">
              <p className="text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="text-sm text-muted-foreground">
                <T k={s.key} />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
