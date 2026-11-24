import type { createClient } from '@/lib/supabase/server';
import { percent } from '@/lib/utils';

type Supabase = ReturnType<typeof createClient>;

export type ReportData = {
  schoolName: string;
  student: { full_name: string; admission_no: string; class_name: string; stream: string | null };
  term: { name: string; year: number };
  grades: { subject: string; assessment: string; score: number; max: number; pct: number }[];
  subjectAverages: { subject: string; average: number }[];
  overall: number | null;
  attendance: { present: number; absent: number; late: number; total: number; rate: number | null };
  behavior: { positive: number; neutral: number; negative: number; tags: { tag: string; count: number }[] };
  comment: string;
  generatedAt: string;
};

/**
 * Gathers everything for one report card through the CALLER's session,
 * so RLS decides whether they may see this student at all (returns null otherwise).
 */
export async function getReportData(
  supabase: Supabase,
  studentId: string,
  termId: string,
  comment: string,
): Promise<ReportData | null> {
  const { data: student } = await supabase
    .from('students')
    .select('id, school_id, full_name, admission_no, class_name, stream')
    .eq('id', studentId)
    .maybeSingle();
  if (!student) return null;

  const { data: term } = await supabase
    .from('academic_terms')
    .select('id, name, year, start_date, end_date')
    .eq('id', termId)
    .eq('school_id', student.school_id)
    .maybeSingle();
  if (!term) return null;

  const [{ data: school }, { data: grades }, { data: attendance }, { data: behavior }] = await Promise.all([
    supabase.from('schools').select('name').eq('id', student.school_id).maybeSingle(),
    supabase.from('grades').select('subject, assessment_name, score, max_score, created_at').eq('student_id', studentId).eq('term_id', termId).order('subject').order('created_at'),
    supabase.from('attendance').select('status').eq('student_id', studentId).gte('date', term.start_date).lte('date', term.end_date),
    supabase
      .from('behavior_logs')
      .select('tag, severity')
      .eq('student_id', studentId)
      .gte('created_at', `${term.start_date}T00:00:00+03:00`)
      .lte('created_at', `${term.end_date}T23:59:59+03:00`),
  ]);

  const gradeLines = (grades ?? []).map((g) => ({
    subject: g.subject,
    assessment: g.assessment_name,
    score: g.score,
    max: g.max_score,
    pct: percent(g.score, g.max_score),
  }));

  const bySubject = new Map<string, number[]>();
  for (const g of gradeLines) bySubject.set(g.subject, [...(bySubject.get(g.subject) ?? []), g.pct]);
  const subjectAverages = Array.from(bySubject.entries()).map(([subject, list]) => ({
    subject,
    average: Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10,
  }));
  const overall = subjectAverages.length
    ? Math.round((subjectAverages.reduce((a, b) => a + b.average, 0) / subjectAverages.length) * 10) / 10
    : null;

  const att = { present: 0, absent: 0, late: 0 };
  for (const a of attendance ?? []) att[a.status] += 1;
  const total = att.present + att.absent + att.late;

  const beh = { positive: 0, neutral: 0, negative: 0 };
  const tagCounts = new Map<string, number>();
  for (const b of behavior ?? []) {
    beh[b.severity] += 1;
    tagCounts.set(b.tag, (tagCounts.get(b.tag) ?? 0) + 1);
  }

  return {
    schoolName: school?.name ?? 'Shule',
    student: { full_name: student.full_name, admission_no: student.admission_no, class_name: student.class_name, stream: student.stream },
    term: { name: term.name, year: term.year },
    grades: gradeLines,
    subjectAverages,
    overall,
    attendance: { ...att, total, rate: total ? Math.round(((att.present + att.late) / total) * 100) : null },
    behavior: { ...beh, tags: Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count })) },
    comment,
    generatedAt: new Date().toISOString(),
  };
}
