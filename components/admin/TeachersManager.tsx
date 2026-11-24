'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/shared/Alert';
import { useT } from '@/components/admin/LangProvider';

export type TeacherRow = { id: string; full_name: string; email: string | null; phone: string | null };

export function TeachersManager({ teachers }: { teachers: TeacherRow[] }) {
  const router = useRouter();
  const { t } = useT();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function openCreate() {
    setEditingId(null);
    setForm({ full_name: '', email: '', phone: '', password: '' });
    setError(null);
    setShowForm(true);
  }

  function openEdit(row: TeacherRow) {
    setEditingId(row.id);
    setForm({ full_name: row.full_name, email: row.email ?? '', phone: row.phone ?? '', password: '' });
    setError(null);
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId
            ? { id: editingId, full_name: form.full_name, phone: form.phone || null }
            : { full_name: form.full_name, email: form.email, phone: form.phone || null, password: form.password },
        ),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(body?.error ?? 'Imeshindwa kuhifadhi.');
        return;
      }
      setShowForm(false);
      router.refresh();
    } catch {
      setError('Hakuna mtandao. Jaribu tena.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: TeacherRow) {
    if (!window.confirm(`${t('common.confirmDelete')}\n\n${row.full_name}`)) return;
    setBusy(true);
    const res = await fetch('/api/admin/teachers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Imeshindwa kufuta.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && !showForm ? <Alert variant="error">{error}</Alert> : null}
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4" aria-hidden />
        {t('teachers.add')}
      </Button>

      {showForm ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {error ? <Alert variant="error">{error}</Alert> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="t-name">{t('common.name')}</Label>
                  <Input id="t-name" required value={form.full_name} onChange={set('full_name')} />
                </div>
                <div>
                  <Label htmlFor="t-phone">{t('common.phone')}</Label>
                  <Input id="t-phone" type="tel" value={form.phone} onChange={set('phone')} />
                </div>
                {!editingId ? (
                  <>
                    <div>
                      <Label htmlFor="t-email">{t('common.email')}</Label>
                      <Input id="t-email" type="email" required value={form.email} onChange={set('email')} />
                    </div>
                    <div>
                      <Label htmlFor="t-pass">{t('teachers.password')}</Label>
                      <Input id="t-pass" type="text" required minLength={8} autoComplete="off" value={form.password} onChange={set('password')} />
                    </div>
                  </>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={busy}>
                  {t('common.save')}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={busy}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {teachers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{t('teachers.empty')}</CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-3">{t('common.name')}</th>
                <th className="px-3 py-3">{t('common.email')}</th>
                <th className="px-3 py-3">{t('common.phone')}</th>
                <th className="px-3 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-3 font-medium">{row.full_name}</td>
                  <td className="px-3 py-3">{row.email}</td>
                  <td className="px-3 py-3">{row.phone ?? '-'}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`${t('common.edit')} ${row.full_name}`}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(row)} disabled={busy} aria-label={`${t('common.delete')} ${row.full_name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
