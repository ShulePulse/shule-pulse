import Link from 'next/link';
import type { Metadata } from 'next';
import { BookOpen, CalendarCheck } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { getChildren } from '@/lib/parent';
import { buildPulseEvents } from '@/lib/pulse';
import { classLabel } from '@/lib/classes';
import { buttonVariants } from '@/components/ui/button';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { PulseFeed } from '@/components/parent/PulseFeed';

export const metadata: Metadata = { title: 'Habari za mtoto' };

export default async function ParentDashboardPage({ searchParams }: { searchParams: { child?: string } }) {
  const { supabase, user } = await requireProfile(['parent']);
  const kids = await getChildren(supabase, user.id);

  if (kids.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm">
        <p className="font-medium">Hakuna mtoto aliyeunganishwa na akaunti yako bado.</p>
        <p className="mt-1 text-muted-foreground">Wasiliana na shule ili kuunganishwa na mtoto wako.</p>
      </div>
    );
  }

  const child = kids.find((k) => k.id === searchParams.child) ?? kids[0]!;

  const [{ data: attendance }, { data: behavior }, { data: grades }] = await Promise.all([
    supabase.from('attendance').select('id, date, status, created_at').eq('student_id', child.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('behavior_logs').select('id, tag, severity, created_at').eq('student_id', child.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('grades').select('id, subject, assessment_name, score, max_score, created_at').eq('student_id', child.id).order('created_at', { ascending: false }).limit(30),
  ]);

  const events = buildPulseEvents(attendance ?? [], behavior ?? [], grades ?? []).slice(0, 40);

  return (
    <>
      <ChildSwitcher kids={kids} selectedId={child.id} basePath="/parent/dashboard" />
      <div>
        <h1 className="text-2xl font-bold">{child.full_name}</h1>
        <p className="text-sm text-muted-foreground">{classLabel(child.class_name, child.stream)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/parent/child/${child.id}/grades`} className={buttonVariants({ variant: 'outline' })}>
          <BookOpen className="h-4 w-4" aria-hidden /> Alama
        </Link>
        <Link href={`/parent/child/${child.id}/attendance`} className={buttonVariants({ variant: 'outline' })}>
          <CalendarCheck className="h-4 w-4" aria-hidden /> Mahudhurio
        </Link>
      </div>
      <h2 className="font-semibold">Pulse Feed</h2>
      <PulseFeed events={events} />
    </>
  );
}
