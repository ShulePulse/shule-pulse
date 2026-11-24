import type { Metadata } from 'next';
import { requireProfile } from '@/lib/auth';
import { T } from '@/components/admin/LangProvider';
import { ImportStudents } from '@/components/admin/ImportStudents';

export const metadata: Metadata = { title: 'Ingiza wanafunzi' };

export default async function AdminImportPage() {
  await requireProfile(['admin']);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        <T k="import.title" />
      </h1>
      <ImportStudents />
    </div>
  );
}
