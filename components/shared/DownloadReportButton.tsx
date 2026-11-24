'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/shared/Alert';

type Props = { studentId: string; termId: string; comment?: string; label?: string; disabled?: boolean };

/** Requests the PDF from /api/pdf/generate and opens it in a new tab. */
export function DownloadReportButton({ studentId, termId, comment, label = 'Zalisha PDF', disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, termId, comment: comment ?? '' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Imeshindwa kuzalisha PDF.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        // Popup blocked (common on phones): fall back to a download link.
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ripoti.pdf';
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError('Hakuna mtandao. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={generate} loading={loading} disabled={disabled || !studentId || !termId}>
        <FileDown className="h-4 w-4" aria-hidden />
        {label}
      </Button>
      {error ? <Alert variant="error">{error}</Alert> : null}
    </div>
  );
}
