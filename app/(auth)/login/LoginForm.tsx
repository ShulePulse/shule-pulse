'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROLE_HOME } from '@/lib/constants';
import { safeNext } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/shared/Alert';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('error') === 'profile' ? 'Akaunti yako haina wasifu. Wasiliana na msimamizi wa shule.' : null,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setError('Barua pepe au nenosiri si sahihi.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    if (!profile) {
      await supabase.auth.signOut();
      setError('Akaunti yako haina wasifu. Wasiliana na msimamizi wa shule.');
      setLoading(false);
      return;
    }

    const next = safeNext(params.get('next'));
    router.replace(next ?? ROLE_HOME[profile.role]);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingia</CardTitle>
        <CardDescription>Tumia barua pepe na nenosiri ulilopewa.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div>
            <Label htmlFor="email">Barua pepe</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Nenosiri</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Ingia
          </Button>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <Link href="/forgot-password" className="text-primary underline-offset-2 hover:underline">
              Sijui password
            </Link>
            <Link href="/register-school" className="text-primary underline-offset-2 hover:underline">
              Sajili shule
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
