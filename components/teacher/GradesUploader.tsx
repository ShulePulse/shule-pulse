'use client';

import { useMemo, useRef, useState, type DragEvent } from 'react';
import { CheckCircle2, Download, UploadCloud } from 'lucide-react';
import { autoMap, cellText, readSheet, type SheetData } from '@/lib/excel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/shared/Alert';

type Term = { id: string; name: string; year: number };

const FIELDS = ['admission_no', 'subject', 'score', 'max_score'] as const;
type Field = (typeof FIELDS)[number];

const FIELD_LABEL: Record<Field, string> = {
  admission_no: 'Namba ya usajili',
  subject: 'Somo',
  score: 'Alama',
  max_score: 'Alama kamili (hiari)',
};

const SYNONYMS: Record<Field, string[]> = {
  admission_no: ['admission', 'admissionnumber', 'admno', 'adm', 'regno', 'registration', 'nambayausajili', 'usajili'],
  subject: ['somo', 'masomo', 'course'],
  score: ['alama', 'marks', 'mark', 'points', 'matokeo'],
  max_score: ['maxscore', 'max', 'outof', 'total', 'alamakamili', 'fullmarks'],
};

type ParsedRow = {
  line: number;
  admission_no: string;
  subject: string;
  score: number;
  max_score: number;
  error: string | null;
};

export function GradesUploader({ terms }: { terms: Term[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [mapping, setMapping] = useState<Record<Field, string>>({ admission_no: '', subject: '', score: '', max_score: '' });
  const [termId, setTermId] = useState(terms[0]?.id ?? '');
  const [assessment, setAssessment] = useState('Mtihani wa Mwezi');
  const [defaultMax, setDefaultMax] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ inserted: number; unknown: string[] } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setDone(null);
    try {
      const data = await readSheet(file);
      if (data.rows.length === 0) {
        setError('Faili haina mistari ya data.');
        return;
      }
      setSheet(data);
      setFileName(file.name);
      setMapping(autoMap(data.headers, SYNONYMS) as Record<Field, string>);
    } catch {
      setError('Imeshindwa kusoma faili. Tumia .xlsx au .csv.');
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    void handleFile(e.dataTransfer.files[0]);
  }

  const parsed: ParsedRow[] = useMemo(() => {
    if (!sheet) return [];
    return sheet.rows.map((row, i) => {
      const admission_no = cellText(row[mapping.admission_no]);
      const subject = cellText(row[mapping.subject]);
      const scoreText = cellText(row[mapping.score]).replace(',', '.');
      const score = Number(scoreText);
      const maxText = mapping.max_score ? cellText(row[mapping.max_score]).replace(',', '.') : '';
      const max_score = maxText ? Number(maxText) : defaultMax;

      let rowError: string | null = null;
      if (!admission_no) rowError = 'Namba ya usajili haipo';
      else if (!subject) rowError = 'Somo halipo';
      else if (scoreText === '' || !Number.isFinite(score)) rowError = 'Alama si namba';
      else if (!Number.isFinite(max_score) || max_score <= 0) rowError = 'Alama kamili si sahihi';
      else if (score < 0 || score > max_score) rowError = 'Alama nje ya kiwango';
      return { line: i + 2, admission_no, subject, score, max_score, error: rowError };
    });
  }, [sheet, mapping, defaultMax]);

  const valid = parsed.filter((r) => !r.error);
  const invalid = parsed.length - valid.length;
  const mappingComplete = Boolean(mapping.admission_no && mapping.subject && mapping.score);

  async function submit() {
    setLoading(true);
    setError(null);
    let inserted = 0;
    const unknown = new Set<string>();
    try {
      // Send in chunks so large files never hit request limits.
      for (let i = 0; i < valid.length; i += 500) {
        const chunk = valid.slice(i, i + 500).map(({ admission_no, subject, score, max_score }) => ({ admission_no, subject, score, max_score }));
        const res = await fetch('/api/grades/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term_id: termId, assessment_name: assessment, rows: chunk }),
        });
        const body = (await res.json().catch(() => null)) as { error?: string; inserted?: number; unknownAdmissionNos?: string[] } | null;
        if (!res.ok) {
          setError(`${body?.error ?? 'Imeshindwa kuingiza alama.'}${inserted > 0 ? ` (zilizoingizwa kabla ya kosa: ${inserted})` : ''}`);
          return;
        }
        inserted += body?.inserted ?? 0;
        body?.unknownAdmissionNos?.forEach((a) => unknown.add(a));
      }
      setDone({ inserted, unknown: Array.from(unknown) });
      setSheet(null);
      setFileName('');
    } catch {
      setError('Hakuna mtandao. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  }

  if (terms.length === 0) {
    return <Alert variant="warning">Hakuna muhula uliowekwa. Msimamizi wa shule anapaswa kuongeza muhula kwanza.</Alert>;
  }

  return (
    <div className="space-y-4">
      {done ? (
        <Alert variant="success">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              Alama {done.inserted} zimeingizwa.
              {done.unknown.length > 0 ? (
                <span className="block text-amber-800">Namba zisizopatikana (zimerukwa): {done.unknown.slice(0, 15).join(', ')}{done.unknown.length > 15 ? '...' : ''}</span>
              ) : null}
            </div>
          </div>
        </Alert>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
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
            <div>
              <Label htmlFor="assessment">Jina la mtihani</Label>
              <Input id="assessment" value={assessment} onChange={(e) => setAssessment(e.target.value)} maxLength={80} />
            </div>
          </div>

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
              'flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors',
              dragging ? 'border-primary bg-primary/10' : 'border-input bg-muted/40',
            )}
          >
            <UploadCloud className="h-8 w-8 text-primary" aria-hidden />
            <p className="text-sm font-medium">{fileName || 'Buruta faili ya Excel / CSV hapa, au bofya kuchagua'}</p>
            <p className="text-xs text-muted-foreground">Safu zinazohitajika: admission_no, subject, score</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
          </div>

          <a href="/templates/grades-template.csv" download className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary">
            <Download className="h-4 w-4" aria-hidden /> Pakua mfano wa faili (CSV)
          </a>
        </CardContent>
      </Card>

      {sheet ? (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <h2 className="mb-2 font-semibold">1. Thibitisha safu</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <div key={f}>
                    <Label htmlFor={`map-${f}`}>{FIELD_LABEL[f]}</Label>
                    <Select id={`map-${f}`} value={mapping[f]} onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value }))}>
                      <option value="">{f === 'max_score' ? 'Tumia chaguo-msingi' : '- chagua -'}</option>
                      {sheet.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
                {!mapping.max_score ? (
                  <div>
                    <Label htmlFor="defaultMax">Alama kamili (chaguo-msingi)</Label>
                    <Input id="defaultMax" type="number" min={1} value={defaultMax} onChange={(e) => setDefaultMax(Number(e.target.value) || 100)} />
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <h2 className="mb-2 flex flex-wrap items-center gap-2 font-semibold">
                2. Hakiki kabla ya kuingiza
                <Badge variant="success">{valid.length} sahihi</Badge>
                {invalid > 0 ? <Badge variant="danger">{invalid} zina makosa</Badge> : null}
              </h2>
              {mappingComplete ? (
                <div className="max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-2 py-2">Mstari</th>
                        <th className="px-2 py-2">Usajili</th>
                        <th className="px-2 py-2">Somo</th>
                        <th className="px-2 py-2">Alama</th>
                        <th className="px-2 py-2">Hali</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.slice(0, 50).map((r) => (
                        <tr key={r.line} className={cn('border-t', r.error && 'bg-destructive/5')}>
                          <td className="px-2 py-2 text-muted-foreground">{r.line}</td>
                          <td className="px-2 py-2">{r.admission_no}</td>
                          <td className="px-2 py-2">{r.subject}</td>
                          <td className="px-2 py-2">{Number.isFinite(r.score) ? `${r.score}/${r.max_score}` : '-'}</td>
                          <td className="px-2 py-2">{r.error ? <span className="text-destructive">{r.error}</span> : <span className="text-success">Sawa</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert variant="warning">Chagua safu za namba ya usajili, somo na alama.</Alert>
              )}
              {parsed.length > 50 ? <p className="mt-1 text-xs text-muted-foreground">Inaonyesha mistari 50 ya kwanza kati ya {parsed.length}.</p> : null}
            </div>

            <Button size="lg" className="w-full" onClick={submit} loading={loading} disabled={!mappingComplete || valid.length === 0 || !assessment.trim()}>
              Ingiza alama {valid.length}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
