import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { classLabel, parseClassId } from '@/lib/classes';
import { todayEAT, formatDateSw } from '@/lib/utils';
import type { AttendanceStatus } from '@/types';
import { AttendanceGrid } from '@/components/teacher/AttendanceGrid';

export const metadata: Metadata = { title: 'Mahudhurio' };

export default async function AttendancePage({ params }: { params: { classId: string } }) {
  const { supabase } = await requireProfile(['teacher']);
  const { className, stream } = parseClassId(params.classId);

  // Apply filters BEFORE order(): ordering returns a builder without filter methods.
  const base = supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('class_name', className);
  const filtered = stream === null ? base.is('stream', null) : base.eq('stream', stream);
  const { data: students } = await filtered.order('full_name');
  if (!students || students.length === 0) notFound();

  // Pre-load today's saved register so the teacher can correct it.
  const today = todayEAT();
  const { data: saved } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('date', today)
    .in('student_id', students.map((s) => s.id));

  const initialStatuses: Record<string, AttendanceStatus> = {};
  for (const row of saved ?? []) initialStatuses[row.student_id] = row.status;

  return (
    <div className="space-y-3">
      <Link href="/teacher/dashboard" className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Madarasa
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Mahudhurio: {classLabel(className, stream)}</h1>
        <p className="text-sm text-muted-foreground">{formatDateSw(today)}</p>
      </div>
      <AttendanceGrid classId={params.classId} students={students} initialStatuses={initialStatuses} />
    </div>
  );
}
