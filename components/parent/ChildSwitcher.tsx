import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Child } from '@/lib/parent';

type Props = { kids: Child[]; selectedId: string; basePath: string };

/** Pills for switching between a parent's children. Navigates with ?child=<id>. */
export function ChildSwitcher({ kids, selectedId, basePath }: Props) {
  if (kids.length < 2) return null;
  return (
    <nav aria-label="Chagua mtoto" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {kids.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}?child=${c.id}`}
          aria-current={c.id === selectedId ? 'page' : undefined}
          className={cn(
            'flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-medium',
            c.id === selectedId ? 'border-primary bg-primary text-white' : 'bg-card',
          )}
        >
          {c.full_name.split(' ')[0]}
        </Link>
      ))}
    </nav>
  );
}
