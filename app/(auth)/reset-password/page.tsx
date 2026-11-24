'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROLE_HOME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/shared/Alert';

/** Reached from the password-reset email via /auth/callback (user already has a recovery session). */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Manenosiri hayafanani.');
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError || !data.user) {
      setError('Imeshindwa kubadilisha nenosiri. Kiungo kinaweza kuwa kimeisha muda; omba kingine.');
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    router.replace(profile ? ROLE_HOME[profile.role] : '/login');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nenosiri jipya</CardTitle>
        <CardDescription>Chagua nenosiri lenye angalau herufi 8.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div>
            <Label htmlFor="password">Nenosiri jipya</Label>
            <Input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="confirm">Rudia nenosiri</Label>
            <Input id="confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Hifadhi nenosiri
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
