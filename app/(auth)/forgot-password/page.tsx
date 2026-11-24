'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/shared/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError('Imeshindwa kutuma kiungo. Jaribu tena baada ya dakika chache.');
      return;
    }
    // Always show the same message so we do not reveal which emails are registered.
    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weka upya nenosiri</CardTitle>
        <CardDescription>Tutakutumia kiungo cha kuweka nenosiri jipya kwenye barua pepe yako.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <Alert variant="success">Kama barua pepe hiyo imesajiliwa, utapokea kiungo ndani ya dakika chache.</Alert>
            <Link href="/login" className="text-sm text-primary underline-offset-2 hover:underline">
              Rudi kwenye kuingia
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error ? <Alert variant="error">{error}</Alert> : null}
            <div>
              <Label htmlFor="email">Barua pepe</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Tuma kiungo
            </Button>
            <Link href="/login" className="block text-center text-sm text-primary underline-offset-2 hover:underline">
              Rudi kwenye kuingia
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
