import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { GradesUploader } from '@/components/teacher/GradesUploader';

export const metadata: Metadata = { title: 'Pakia alama' };

export default async function GradesUploadPage() {
  const { supabase } = await requireProfile(['teacher']);
  const { data: terms } = await supabase
    .from('academic_terms')
    .select('id, name, year')
    .order('year', { ascending: false })
    .order('start_date', { ascending: false });

  return (
    <div className="space-y-3">
      <Link href="/teacher/dashboard" className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Madarasa
      </Link>
      <h1 className="text-2xl font-bold">Pakia alama</h1>
      <GradesUploader terms={terms ?? []} />
    </div>
  );
}
