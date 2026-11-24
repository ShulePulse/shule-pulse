import Link from 'next/link';
import { Activity, MessageSquare, WifiOff } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
        <Activity className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">ShulePulse</h1>
      <p className="mt-3 max-w-xl text-lg text-muted-foreground">
        Mahudhurio na tabia kwa sekunde 15, hata bila mtandao. Wazazi wanapata taarifa papo hapo.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className={buttonVariants({ size: 'lg' })}>
          Ingia
        </Link>
        <Link href="/register-school" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
          Sajili shule
        </Link>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        <li className="rounded-lg border bg-card p-4">
          <WifiOff className="mb-2 h-5 w-5 text-primary" aria-hidden />
          <p className="font-medium">Inafanya kazi offline</p>
          <p className="text-sm text-muted-foreground">Data inasubiri kisha inatumwa mtandao ukirejea.</p>
        </li>
        <li className="rounded-lg border bg-card p-4">
          <MessageSquare className="mb-2 h-5 w-5 text-primary" aria-hidden />
          <p className="font-medium">SMS kwa wazazi</p>
          <p className="text-sm text-muted-foreground">Mtoto akikosa shule, mzazi anaarifiwa mara moja.</p>
        </li>
        <li className="rounded-lg border bg-card p-4">
          <Activity className="mb-2 h-5 w-5 text-primary" aria-hidden />
          <p className="font-medium">Pulse Feed</p>
          <p className="text-sm text-muted-foreground">Mahudhurio, tabia na alama za mtoto mahali pamoja.</p>
        </li>
      </ul>
    </main>
  );
}
