'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, FileText, FileUp, GraduationCap, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { I18nKey } from '@/lib/i18n';
import { LogoutButton } from '@/components/shared/LogoutButton';
import { useT } from '@/components/admin/LangProvider';

const LINKS: { href: string; key: I18nKey; icon: typeof Users }[] = [
  { href: '/admin/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/admin/students', key: 'nav.students', icon: GraduationCap },
  { href: '/admin/teachers', key: 'nav.teachers', icon: Users },
  { href: '/admin/import', key: 'nav.import', icon: FileUp },
  { href: '/admin/reports', key: 'nav.reports', icon: FileText },
];

export function AdminNav({ name, schoolName }: { name: string; schoolName: string }) {
  const pathname = usePathname();
  const { t, lang, setLang } = useT();

  return (
    <aside className="border-b bg-card lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2 px-4 py-3 lg:block">
        <div className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Activity className="h-4 w-4" aria-hidden />
          </span>
          ShulePulse
        </div>
        <p className="hidden truncate text-sm text-muted-foreground lg:mt-2 lg:block">{schoolName}</p>
        <div className="flex items-center gap-1 lg:hidden">
          <LangToggle lang={lang} setLang={setLang} />
          <LogoutButton label={t('nav.logout')} />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
        {LINKS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium',
                active ? 'bg-primary text-white' : 'hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 hidden space-y-2 border-t p-3 lg:block">
        <p className="truncate text-sm font-medium">{name}</p>
        <div className="flex items-center justify-between">
          <LangToggle lang={lang} setLang={setLang} />
          <LogoutButton label={t('nav.logout')} />
        </div>
      </div>
    </aside>
  );
}

function LangToggle({ lang, setLang }: { lang: 'sw' | 'en'; setLang: (l: 'sw' | 'en') => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border text-xs font-medium" role="group" aria-label="Lugha / Language">
      {(['sw', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn('min-h-[44px] min-w-[44px] px-3', lang === l ? 'bg-primary text-white' : 'bg-card')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
