import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { buildGradeChartData } from '@/lib/pulse';
import { percent } from '@/lib/utils';
import { GradeCharts } from '@/components/parent/GradeCharts';
import { ReportDownload } from '@/components/parent/ReportDownload';

export const metadata: Metadata = { title: 'Alama' };

export default async function ChildGradesPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireProfile(['parent']);

  // RLS: returns null unless this parent is linked to the child AND has consented.
  const { data: child } = await supabase.from('students').select('id, full_name').eq('id', params.id).maybeSingle();
  if (!child) notFound();

  const [{ data: grades }, { data: terms }] = await Promise.all([
    supabase.from('grades').select('id, subject, assessment_name, score, max_score, created_at, term_id').eq('student_id', child.id).order('created_at', { ascending: false }),
    supabase.from('academic_terms').select('id, name, year').order('year', { ascending: false }),
  ]);

  const chart = buildGradeChartData(grades ?? [], terms ?? []);

  return (
    <>
      <Link href={`/parent/dashboard?child=${child.id}`} className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Rudi
      </Link>
      <h1 className="text-2xl font-bold">Alama: {child.full_name}</h1>

      <GradeCharts {...chart} />

      <section className="rounded-lg border bg-card">
        <h2 className="border-b p-3 font-semibold">Alama zote</h2>
        {(grades ?? []).length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Hakuna alama bado.</p>
        ) : (
          <ul className="divide-y">
            {(grades ?? []).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span>
                  <span className="font-medium">{g.subject}</span>
                  <span className="block text-muted-foreground">{g.assessment_name}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {g.score}/{g.max_score} ({percent(g.score, g.max_score)}%)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReportDownload studentId={child.id} terms={terms ?? []} />
    </>
  );
}
