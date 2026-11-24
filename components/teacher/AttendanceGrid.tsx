'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CloudOff, Timer } from 'lucide-react';
import { ATTENDANCE_STATUS, ATTENDANCE_TARGET_SECONDS } from '@/lib/constants';
import { cacheClass, submitOrQueue } from '@/lib/offline/queue';
import { cn, todayEAT } from '@/lib/utils';
import type { AttendanceStatus, StudentLite } from '@/types';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/shared/Alert';

type Props = {
  classId: string;
  students: StudentLite[];
  /** Statuses already saved for today (so re-opening the page shows the current register). */
  initialStatuses: Record<string, AttendanceStatus>;
};

const NEXT: Record<AttendanceStatus, AttendanceStatus> = { present: 'absent', absent: 'late', late: 'present' };

const STYLE: Record<AttendanceStatus, string> = {
  present: 'border-input bg-card',
  absent: 'border-destructive bg-destructive/10 text-destructive',
  late: 'border-warning bg-warning/20 text-amber-800',
};

type Result = { kind: 'sent' | 'queued' | 'error'; text: string; seconds: number };

export function AttendanceGrid({ classId, students, initialStatuses }: Props) {
  // Everyone is "Yupo" by default; the teacher only taps the exceptions.
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(initialStatuses);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const startRef = useRef<number>(Date.now());
  const stoppedRef = useRef(false);

  useEffect(() => {
    void cacheClass(classId, students);
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      if (!stoppedRef.current) setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, [classId, students]);

  const statusOf = (id: string): AttendanceStatus => statuses[id] ?? 'present';
  const absentCount = students.filter((s) => statusOf(s.id) === 'absent').length;
  const lateCount = students.filter((s) => statusOf(s.id) === 'late').length;

  function toggle(id: string) {
    setResult(null);
    setStatuses((prev) => ({ ...prev, [id]: NEXT[prev[id] ?? 'present'] }));
  }

  function resetAll() {
    setResult(null);
    setStatuses({});
  }

  async function submit() {
    stoppedRef.current = true;
    const seconds = (Date.now() - startRef.current) / 1000;
    setElapsed(seconds);
    setSubmitting(true);

    const outcome = await submitOrQueue('attendance', {
      date: todayEAT(),
      records: students.map((s) => ({ student_id: s.id, status: statusOf(s.id) })),
    });
    setSubmitting(false);

    if (outcome.status === 'sent') {
      setResult({ kind: 'sent', text: 'Mahudhurio yamewasilishwa.', seconds });
    } else if (outcome.status === 'queued') {
      setResult({ kind: 'queued', text: 'Hakuna mtandao. Imehifadhiwa na itatumwa mtandao ukirejea.', seconds });
    } else {
      stoppedRef.current = false;
      startRef.current = Date.now() - seconds * 1000;
      setResult({ kind: 'error', text: outcome.message ?? 'Imeshindwa kuwasilisha.', seconds });
    }
  }

  const withinTarget = elapsed <= ATTENDANCE_TARGET_SECONDS;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="text-sm">
          <span className="font-semibold">{students.length}</span> wanafunzi ·{' '}
          <span className={cn('font-semibold', absentCount > 0 && 'text-destructive')}>{absentCount} hayupo</span>
          {lateCount > 0 ? <> · <span className="font-semibold text-amber-700">{lateCount} wamechelewa</span></> : null}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold tabular-nums',
            withinTarget ? 'bg-success/10 text-success' : 'bg-warning/20 text-amber-800',
          )}
          aria-label="Muda uliotumika"
        >
          <Timer className="h-4 w-4" aria-hidden />
          {elapsed.toFixed(1)}s
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Wote wamewekwa <b>Yupo</b>. Bofya jina la mwanafunzi asiyekuwepo (mara 1 = Hayupo, mara 2 = Amechelewa).
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {students.map((s) => {
          const status = statusOf(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={status !== 'present'}
              className={cn(
                'flex min-h-[64px] flex-col items-start justify-center rounded-lg border-2 px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                STYLE[status],
              )}
            >
              <span className="text-sm font-medium leading-tight">{s.full_name}</span>
              <span className="text-xs">{ATTENDANCE_STATUS[status]}</span>
            </button>
          );
        })}
      </div>

      {result ? (
        <Alert variant={result.kind === 'sent' ? 'success' : result.kind === 'queued' ? 'warning' : 'error'}>
          <div className="flex items-start gap-2">
            {result.kind === 'queued' ? <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            <div>
              {result.text}
              {result.kind !== 'error' ? (
                <span className="block font-semibold">
                  Muda: {result.seconds.toFixed(1)}s {result.seconds <= ATTENDANCE_TARGET_SECONDS ? '(umefikia lengo)' : `(lengo ni chini ya ${ATTENDANCE_TARGET_SECONDS}s)`}
                </span>
              ) : null}
            </div>
          </div>
        </Alert>
      ) : null}

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="outline" onClick={resetAll} disabled={submitting}>
          Wote Yupo
        </Button>
        <Button className="flex-1" size="lg" variant="success" onClick={submit} loading={submitting}>
          Wasilisha
        </Button>
      </div>
    </div>
  );
}
