'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TZ_REGIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/shared/Alert';

export default function RegisterSchoolPage() {
  const router = useRouter();
  const [form, setForm] = useState({ schoolName: '', region: 'Dar es Salaam', headName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/signup-school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(body?.error ?? 'Imeshindwa kusajili shule. Jaribu tena.');
      setLoading(false);
      return;
    }

    // Sign in right away so the admin lands on the dashboard.
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    if (signInError) {
      router.replace('/login');
      return;
    }
    router.replace('/admin/dashboard');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sajili shule</CardTitle>
        <CardDescription>Utakuwa msimamizi wa shule hii. Utaongeza walimu na wanafunzi baadaye.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div>
            <Label htmlFor="schoolName">Jina la shule</Label>
            <Input id="schoolName" required minLength={2} value={form.schoolName} onChange={update('schoolName')} />
          </div>
          <div>
            <Label htmlFor="region">Mkoa</Label>
            <Select id="region" value={form.region} onChange={update('region')}>
              {TZ_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="headName">Jina la mkuu wa shule</Label>
            <Input id="headName" required minLength={2} value={form.headName} onChange={update('headName')} />
          </div>
          <div>
            <Label htmlFor="email">Barua pepe</Label>
            <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
          </div>
          <div>
            <Label htmlFor="password">Nenosiri (angalau herufi 8)</Label>
            <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update('password')} />
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Sajili shule
          </Button>
          <p className="text-center text-sm">
            Una akaunti tayari?{' '}
            <Link href="/login" className="text-primary underline-offset-2 hover:underline">
              Ingia
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
