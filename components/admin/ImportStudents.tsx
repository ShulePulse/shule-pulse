'use client';

import { useMemo, useRef, useState, type DragEvent } from 'react';
import { Download, UploadCloud } from 'lucide-react';
import { autoMap, cellText, readSheet, type SheetData } from '@/lib/excel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/shared/Alert';
import { useT } from '@/components/admin/LangProvider';

const SYNONYMS: Record<string, string[]> = {
  full_name: ['name', 'jina', 'jinakamili', 'studentname', 'fullname'],
  admission_no: ['admission', 'admissionnumber', 'admno', 'adm', 'regno', 'nambayausajili'],
  class_name: ['class', 'darasa', 'form'],
  stream: ['mkondo', 'section'],
  parent_name: ['parent', 'mzazi', 'jinalamzazi', 'guardian'],
  parent_phone: ['parentphone', 'phone', 'simu', 'simuyamzazi'],
  parent_email: ['parentemail', 'email', 'barua', 'baruapepe'],
  relationship: ['uhusiano', 'relation'],
};

type Row = {
  line: number;
  full_name: string;
  admission_no: string;
  class_name: string;
  stream: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  relationship: 'Mother' | 'Father' | 'Guardian';
  error: string | null;
};

function toRelationship(value: string): 'Mother' | 'Father' | 'Guardian' {
  const v = value.trim().toLowerCase();
  if (v === 'mother' || v === 'mama') return 'Mother';
  if (v === 'father' || v === 'baba') return 'Father';
  return 'Guardian';
}

export function ImportStudents() {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ imported: number; parentErrors: string[]; credentials: { email: string; tempPassword: string }[] } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSummary(null);
    try {
      const data = await readSheet(file);
      if (data.rows.length === 0) {
        setError('Faili haina mistari ya data.');
        return;
      }
      setSheet(data);
      setFileName(file.name);
    } catch {
      setError('Imeshindwa kusoma faili. Tumia .xlsx au .csv.');
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    void handleFile(e.dataTransfer.files[0]);
  }

  const rows: Row[] = useMemo(() => {
    if (!sheet) return [];
    const map = autoMap(sheet.headers, SYNONYMS);
    return sheet.rows.map((r, i) => {
      const get = (f: string) => (map[f] ? cellText(r[map[f] as string]) : '');
      const row: Row = {
        line: i + 2,
        full_name: get('full_name'),
        admission_no: get('admission_no'),
        class_name: get('class_name'),
        stream: get('stream'),
        parent_name: get('parent_name'),
        parent_phone: get('parent_phone'),
        parent_email: get('parent_email'),
        relationship: toRelationship(get('relationship')),
        error: null,
      };
      if (row.full_name.length < 2) row.error = 'Jina halipo';
      else if (!row.admission_no) row.error = 'Namba ya usajili haipo';
      else if (!row.class_name) row.error = 'Darasa halipo';
      return row;
    });
  }, [sheet]);

  const valid = rows.filter((r) => !r.error);
  const invalid = rows.length - valid.length;
  const missingColumns = sheet ? (['full_name', 'admission_no', 'class_name'] as const).filter((f) => !autoMap(sheet.headers, SYNONYMS)[f]) : [];

  async function run() {
    setLoading(true);
    setError(null);
    const credentials: { email: string; tempPassword: string }[] = [];
    const parentErrors: string[] = [];
    let imported = 0;
    try {
      const CHUNK = 50;
      for (let i = 0; i < valid.length; i += CHUNK) {
        setProgress(`${Math.min(i + CHUNK, valid.length)} / ${valid.length}`);
        const chunk = valid.slice(i, i + CHUNK).map((r) => ({
          full_name: r.full_name,
          admission_no: r.admission_no,
          class_name: r.class_name,
          stream: r.stream || null,
          parent_name: r.parent_name || null,
          parent_phone: r.parent_phone || null,
          parent_email: r.parent_email || null,
          relationship: r.relationship,
        }));
        const res = await fetch('/api/admin/import-students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: chunk }),
        });
        const body = (await res.json().catch(() => null)) as
          | { error?: string; imported?: number; credentials?: { email: string; tempPassword: string }[]; parentErrors?: string[] }
          | null;
        if (!res.ok) {
          setError(`${body?.error ?? 'Imeshindwa kuingiza.'} (zilizoingizwa kabla ya kosa: ${imported})`);
          return;
        }
        imported += body?.imported ?? 0;
        credentials.push(...(body?.credentials ?? []));
        parentErrors.push(...(body?.parentErrors ?? []));
      }
      setSummary({ imported, credentials, parentErrors });
      setSheet(null);
      setFileName('');
    } catch {
      setError('Hakuna mtandao. Jaribu tena.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  function downloadCredentials() {
    if (!summary) return;
    const csv = ['email,temporary_password', ...summary.credentials.map((c) => `${c.email},${c.tempPassword}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nywila-za-muda-wazazi.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}

      {summary ? (
        <Alert variant="success">
          <p>Wanafunzi {summary.imported} wameingizwa.</p>
          {summary.credentials.length > 0 ? (
            <div className="mt-2 space-y-1">
              <p>Akaunti mpya za wazazi: {summary.credentials.length}. Pakua nywila za muda sasa, hazitaonekana tena.</p>
              <Button variant="outline" size="sm" onClick={downloadCredentials}>
                <Download className="h-4 w-4" aria-hidden /> Pakua nywila (CSV)
              </Button>
            </div>
          ) : null}
          {summary.parentErrors.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-amber-800">
              {summary.parentErrors.slice(0, 10).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
            }}
            className={cn(
              'flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors',
              dragging ? 'border-primary bg-primary/10' : 'border-input bg-muted/40',
            )}
          >
            <UploadCloud className="h-8 w-8 text-primary" aria-hidden />
            <p className="text-sm font-medium">{fileName || t('import.hint')}</p>
            <p className="text-xs text-muted-foreground">full_name, admission_no, class_name (zinahitajika); stream, parent_name, parent_phone, parent_email, relationship (hiari)</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
          </div>
          <a href="/templates/students-template.csv" download className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary">
            <Download className="h-4 w-4" aria-hidden /> Pakua mfano wa faili (CSV)
          </a>
        </CardContent>
      </Card>

      {sheet ? (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {missingColumns.length > 0 ? (
              <Alert variant="error">Safu hazipatikani: {missingColumns.join(', ')}. Angalia vichwa vya faili.</Alert>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{valid.length} sahihi</Badge>
              {invalid > 0 ? <Badge variant="danger">{invalid} zina makosa</Badge> : null}
            </div>
            <div className="max-h-80 overflow-auto rounded-lg border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Jina</th>
                    <th className="px-2 py-2">Usajili</th>
                    <th className="px-2 py-2">Darasa</th>
                    <th className="px-2 py-2">Mzazi</th>
                    <th className="px-2 py-2">Hali</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r) => (
                    <tr key={r.line} className={cn('border-t', r.error && 'bg-destructive/5')}>
                      <td className="px-2 py-2 text-muted-foreground">{r.line}</td>
                      <td className="px-2 py-2">{r.full_name}</td>
                      <td className="px-2 py-2">{r.admission_no}</td>
                      <td className="px-2 py-2">{r.class_name} {r.stream}</td>
                      <td className="px-2 py-2">{r.parent_name || '-'}</td>
                      <td className="px-2 py-2">{r.error ? <span className="text-destructive">{r.error}</span> : <span className="text-success">Sawa</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 ? <p className="text-xs text-muted-foreground">Inaonyesha mistari 50 ya kwanza kati ya {rows.length}.</p> : null}
            <Button size="lg" onClick={run} loading={loading} disabled={valid.length === 0 || missingColumns.length > 0}>
              {t('import.run')} ({valid.length}) {progress}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
