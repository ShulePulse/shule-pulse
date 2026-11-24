import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { ATTENDANCE_STATUS } from '@/lib/constants';
import { formatDateSw } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Mahudhurio' };

export default async function ChildAttendancePage({ params }: { params: { id: string } }) {
  const { supabase } = await requireProfile(['parent']);

  const { data: child } = await supabase.from('students').select('id, full_name').eq('id', params.id).maybeSingle();
  if (!child) notFound();

  const { data: records } = await supabase
    .from('attendance')
    .select('id, date, status')
    .eq('student_id', child.id)
    .order('date', { ascending: false })
    .limit(120);

  const all = records ?? [];
  const count = { present: 0, absent: 0, late: 0 };
  for (const r of all) count[r.status] += 1;
  const total = all.length;
  // A late arrival still attended school.
  const rate = total === 0 ? null : Math.round(((count.present + count.late) / total) * 100);

  return (
    <>
      <Link href={`/parent/dashboard?child=${child.id}`} className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Rudi
      </Link>
      <h1 className="text-2xl font-bold">Mahudhurio: {child.full_name}</h1>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-2xl font-bold text-success">{count.present}</p>
          <p className="text-xs text-muted-foreground">Yupo</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-2xl font-bold text-destructive">{count.absent}</p>
          <p className="text-xs text-muted-foreground">Hayupo</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-2xl font-bold text-amber-600">{count.late}</p>
          <p className="text-xs text-muted-foreground">Amechelewa</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {rate === null ? 'Hakuna rekodi bado.' : `Kiwango cha mahudhurio: ${rate}% (siku ${total})`}
      </p>

      <section className="rounded-lg border bg-card">
        <h2 className="border-b p-3 font-semibold">Rekodi za hivi karibuni</h2>
        <ul className="divide-y">
          {all.map((r) => (
            <li key={r.id} className="flex items-center justify-between p-3 text-sm">
              <span>{formatDateSw(r.date)}</span>
              <Badge variant={r.status === 'present' ? 'success' : r.status === 'absent' ? 'danger' : 'warning'}>{ATTENDANCE_STATUS[r.status]}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
