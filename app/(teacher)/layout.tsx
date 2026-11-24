import Link from 'next/link';
import { Activity } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { LogoutButton } from '@/components/shared/LogoutButton';
import { ForbiddenNotice } from '@/components/shared/ForbiddenNotice';
import { OfflineSync } from '@/components/teacher/OfflineSync';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile(['teacher']);

  return (
    <div className="min-h-screen">
      <OfflineSync />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <Link href="/teacher/dashboard" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Activity className="h-4 w-4" aria-hidden />
            </span>
            ShulePulse
          </Link>
          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile.full_name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">
        <ForbiddenNotice />
        {children}
      </main>
    </div>
  );
}
