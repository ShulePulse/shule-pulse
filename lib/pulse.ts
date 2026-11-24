import { ATTENDANCE_STATUS } from '@/lib/constants';
import { formatDateSw, percent } from '@/lib/utils';
import type { AttendanceRow, BehaviorLogRow, GradeRow, AcademicTermRow } from '@/types/database';
import type { PulseEvent } from '@/types';

/** Merge attendance, behavior and grades into one chronological feed (newest first). */
export function buildPulseEvents(
  attendance: Pick<AttendanceRow, 'id' | 'date' | 'status' | 'created_at'>[],
  behavior: Pick<BehaviorLogRow, 'id' | 'tag' | 'severity' | 'created_at'>[],
  grades: Pick<GradeRow, 'id' | 'subject' | 'assessment_name' | 'score' | 'max_score' | 'created_at'>[],
): PulseEvent[] {
  const events: PulseEvent[] = [];

  for (const a of attendance) {
    events.push({
      id: `a-${a.id}`,
      kind: 'attendance',
      at: a.created_at,
      title: `Mahudhurio: ${ATTENDANCE_STATUS[a.status]}`,
      detail: formatDateSw(a.date),
      tone: a.status === 'present' ? 'success' : a.status === 'absent' ? 'danger' : 'warning',
    });
  }

  for (const b of behavior) {
    events.push({
      id: `b-${b.id}`,
      kind: 'behavior',
      at: b.created_at,
      title: `Tabia: ${b.tag}`,
      detail: b.severity === 'positive' ? 'Jambo jema' : b.severity === 'negative' ? 'Linahitaji kuzingatiwa' : 'Taarifa',
      tone: b.severity === 'positive' ? 'success' : b.severity === 'negative' ? 'warning' : 'info',
    });
  }

  for (const g of grades) {
    const pct = percent(g.score, g.max_score);
    events.push({
      id: `g-${g.id}`,
      kind: 'grade',
      at: g.created_at,
      title: `${g.subject}: ${g.score}/${g.max_score} (${pct}%)`,
      detail: g.assessment_name,
      tone: pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger',
    });
  }

  return events.sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
}

export type GradeChartData = {
  subjects: string[];
  lineData: Array<Record<string, string | number>>;
  termData: Array<{ term: string; average: number }>;
};

/** Prepare data for the per-subject line chart and the per-term bar chart. */
export function buildGradeChartData(
  grades: Pick<GradeRow, 'subject' | 'assessment_name' | 'score' | 'max_score' | 'created_at' | 'term_id'>[],
  terms: Pick<AcademicTermRow, 'id' | 'name' | 'year'>[],
): GradeChartData {
  const sorted = [...grades].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const subjects = Array.from(new Set(sorted.map((g) => g.subject)));

  const rowsByKey = new Map<string, Record<string, string | number>>();
  for (const g of sorted) {
    const key = `${g.created_at.slice(0, 10)}|${g.assessment_name}`;
    const row = rowsByKey.get(key) ?? { label: `${g.assessment_name} (${formatDateSw(g.created_at.slice(0, 10))})` };
    row[g.subject] = percent(g.score, g.max_score);
    rowsByKey.set(key, row);
  }

  const byTerm = new Map<string, { total: number; count: number }>();
  for (const g of sorted) {
    const entry = byTerm.get(g.term_id) ?? { total: 0, count: 0 };
    entry.total += percent(g.score, g.max_score);
    entry.count += 1;
    byTerm.set(g.term_id, entry);
  }
  const termData = Array.from(byTerm.entries()).map(([termId, v]) => {
    const t = terms.find((x) => x.id === termId);
    return { term: t ? `${t.name} ${t.year}` : 'Muhula', average: Math.round((v.total / v.count) * 10) / 10 };
  });

  return { subjects, lineData: Array.from(rowsByKey.values()), termData };
}
