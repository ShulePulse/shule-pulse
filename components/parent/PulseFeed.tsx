import { BookOpen, CalendarCheck, Star } from 'lucide-react';
import { formatDateTimeSw } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { PulseEvent } from '@/types';

const ICON = { attendance: CalendarCheck, behavior: Star, grade: BookOpen } as const;
const TONE = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/20 text-amber-700',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
} as const;

export function PulseFeed({ events }: { events: PulseEvent[] }) {
  if (events.length === 0) {
    return <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Hakuna matukio bado. Taarifa mpya zitaonekana hapa.</p>;
  }
  return (
    <ol className="space-y-2">
      {events.map((e) => {
        const Icon = ICON[e.kind];
        return (
          <li key={e.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', TONE[e.tone])}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{e.title}</p>
              <p className="text-sm text-muted-foreground">{e.detail}</p>
            </div>
            <time dateTime={e.at} className="shrink-0 text-xs text-muted-foreground">
              {formatDateTimeSw(e.at)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
