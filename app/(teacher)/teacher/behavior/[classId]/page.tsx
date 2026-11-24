import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { classLabel, parseClassId } from '@/lib/classes';
import { BehaviorTagPicker } from '@/components/teacher/BehaviorTagPicker';

export const metadata: Metadata = { title: 'Tabia' };

export default async function BehaviorPage({ params }: { params: { classId: string } }) {
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

  return (
    <div className="space-y-3">
      <Link href="/teacher/dashboard" className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Madarasa
      </Link>
      <h1 className="text-2xl font-bold">Tabia: {classLabel(className, stream)}</h1>
      <BehaviorTagPicker students={students} />
    </div>
  );
}
