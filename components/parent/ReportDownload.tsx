'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DownloadReportButton } from '@/components/shared/DownloadReportButton';

type Props = { studentId: string; terms: { id: string; name: string; year: number }[] };

/** Term picker + PDF button for parents. */
export function ReportDownload({ studentId, terms }: Props) {
  const [termId, setTermId] = useState(terms[0]?.id ?? '');
  if (terms.length === 0) return null;
  return (
    <section className="space-y-3 rounded-lg border bg-card p-3">
      <h2 className="font-semibold">Ripoti ya PDF</h2>
      <div>
        <Label htmlFor="term">Muhula</Label>
        <Select id="term" value={termId} onChange={(e) => setTermId(e.target.value)}>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.year}
            </option>
          ))}
        </Select>
      </div>
      <DownloadReportButton studentId={studentId} termId={termId} label="Pakua ripoti (PDF)" />
    </section>
  );
}
