'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/shared/Alert';

type Props = { kids: { name: string; relationship: string }[] };

export function ConsentForm({ kids }: Props) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setError(null);
    const res = await fetch('/api/consent', { method: 'POST' });
    if (!res.ok) {
      setError('Imeshindwa kuhifadhi idhini yako. Jaribu tena.');
      setLoading(false);
      return;
    }
    router.replace('/parent/dashboard');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Idhini ya matumizi ya taarifa</CardTitle>
        <CardDescription>Tafadhali soma kwa makini kabla ya kuendelea.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="mb-1 font-medium">Mtoto/watoto uliounganishwa nao:</p>
            <ul className="list-inside list-disc">
              {kids.map((c, i) => (
                <li key={`${c.name}-${i}`}>
                  {c.name} ({c.relationship})
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 text-sm leading-relaxed">
            <p>
              Kwa mujibu wa Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania ya mwaka 2022 (PDPA), tunahitaji idhini yako
              kabla ya kukuonyesha na kukutumia taarifa za mtoto wako.
            </p>
            <p>Kwa kukubali, unaruhusu ShulePulse na shule ya mtoto wako:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Kuhifadhi mahudhurio, tabia na alama za mtoto wako.</li>
              <li>Kukuonyesha taarifa hizo kwenye akaunti yako, na wewe tu.</li>
              <li>Kukutumia ujumbe mfupi (SMS) kwenye namba yako ya simu, mfano mtoto akikosa shule.</li>
              <li>Kuzalisha ripoti za PDF za maendeleo ya mtoto wako.</li>
            </ul>
            <p>
              Taarifa hazitauzwa wala kushirikiwa na watu wa nje. Unaweza kuomba kuona, kusahihisha au kufuta taarifa zako
              kwa kuwasiliana na shule. Pia unaweza kuondoa idhini wakati wowote kupitia shule.
            </p>
          </div>

          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(221_83%_53%)]"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="font-medium">Nakubali</span>
          </label>

          {error ? <Alert variant="error">{error}</Alert> : null}

          <Button type="submit" className="w-full" size="lg" disabled={!agreed} loading={loading}>
            Endelea
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
