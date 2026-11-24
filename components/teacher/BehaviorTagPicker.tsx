'use client';

import { useState } from 'react';
import { CheckCircle2, CloudOff } from 'lucide-react';
import { BEHAVIOR_TAGS } from '@/lib/constants';
import { submitOrQueue } from '@/lib/offline/queue';
import { cn } from '@/lib/utils';
import type { StudentLite } from '@/types';
import { Alert } from '@/components/shared/Alert';

type Props = { students: StudentLite[] };

const TAG_STYLE = {
  positive: 'border-success bg-success/10 text-success',
  neutral: 'border-input bg-card',
  negative: 'border-destructive/60 bg-destructive/10 text-destructive',
} as const;

type Toast = { kind: 'ok' | 'queued' | 'error'; text: string };

/** Two taps: pick a student, pick a tag. The second tap submits immediately. */
export function BehaviorTagPicker({ students }: Props) {
  const [selected, setSelected] = useState<StudentLite | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [count, setCount] = useState(0);

  async function pickTag(tag: string) {
    if (!selected || busy) return;
    setBusy(true);
    const outcome = await submitOrQueue('behavior', { student_id: selected.id, tag });
    setBusy(false);

    if (outcome.status === 'error') {
      setToast({ kind: 'error', text: outcome.message ?? 'Imeshindwa kuhifadhi.' });
      return;
    }
    setCount((c) => c + 1);
    setToast({
      kind: outcome.status === 'queued' ? 'queued' : 'ok',
      text:
        outcome.status === 'queued'
          ? `${selected.full_name}: "${tag}" imehifadhiwa, itatumwa mtandao ukirejea.`
          : `${selected.full_name}: "${tag}" imehifadhiwa.`,
    });
    setSelected(null);
  }

  return (
    <div className="space-y-4 pb-40">
      <p className="text-sm text-muted-foreground">
        1) Chagua mwanafunzi. 2) Chagua tag - inahifadhiwa papo hapo. Zilizohifadhiwa kikao hiki: <b>{count}</b>
      </p>

      {toast ? (
        <Alert variant={toast.kind === 'ok' ? 'success' : toast.kind === 'queued' ? 'warning' : 'error'}>
          <span className="flex items-start gap-2">
            {toast.kind === 'queued' ? <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            {toast.text}
          </span>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {students.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setToast(null);
              setSelected(s);
            }}
            aria-pressed={selected?.id === s.id}
            className={cn(
              'min-h-[56px] rounded-lg border-2 px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected?.id === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card',
            )}
          >
            {s.full_name}
          </button>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-sm font-medium">
            {selected ? <>Tag kwa <span className="text-primary">{selected.full_name}</span>:</> : 'Chagua mwanafunzi kwanza'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BEHAVIOR_TAGS.map((t) => (
              <button
                key={t.value}
                type="button"
                disabled={!selected || busy}
                onClick={() => pickTag(t.value)}
                className={cn(
                  'min-h-[52px] rounded-lg border-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
                  TAG_STYLE[t.severity],
                )}
              >
                {t.value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
