import Link from 'next/link';
import type { Metadata } from 'next';
import { ClipboardCheck, FileSpreadsheet, MessageSquarePlus, Users } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { classLabel, makeClassId } from '@/lib/classes';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Madarasa yangu' };

export default async function TeacherDashboardPage() {
  const { supabase, profile } = await requireProfile(['teacher']);

  // RLS already limits this to the teacher's school.
  const { data: students } = await supabase.from('students').select('class_name, stream').order('class_name').limit(5000);

  const groups = new Map<string, { className: string; stream: string | null; count: number }>();
  for (const s of students ?? []) {
    const id = makeClassId(s.class_name, s.stream);
    const existing = groups.get(id);
    if (existing) existing.count += 1;
    else groups.set(id, { className: s.class_name, stream: s.stream, count: 1 });
  }
  const classes = Array.from(groups.entries()).sort((a, b) =>
    classLabel(a[1].className, a[1].stream).localeCompare(classLabel(b[1].className, b[1].stream)),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Karibu, {profile.full_name.split(' ')[0] || 'Mwalimu'}</h1>
        <p className="text-sm text-muted-foreground">Chagua darasa kuingiza mahudhurio au tabia.</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Hakuna madarasa bado. Msimamizi wa shule anapaswa kuongeza wanafunzi kwanza.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map(([id, c]) => (
            <Card key={id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  {classLabel(c.className, c.stream)}
                  <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                    <Users className="h-4 w-4" aria-hidden />
                    {c.count}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Link href={`/teacher/attendance/${id}`} className={buttonVariants({ variant: 'success' })}>
                  <ClipboardCheck className="h-4 w-4" aria-hidden />
                  Mahudhurio
                </Link>
                <Link href={`/teacher/behavior/${id}`} className={buttonVariants({ variant: 'outline' })}>
                  <MessageSquarePlus className="h-4 w-4" aria-hidden />
                  Tabia
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Link href="/teacher/grades/upload" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
        <FileSpreadsheet className="h-4 w-4" aria-hidden />
        Pakia alama (Excel / CSV)
      </Link>
    </div>
  );
}
