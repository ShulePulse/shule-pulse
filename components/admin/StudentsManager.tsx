'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { RELATIONSHIPS, RELATIONSHIP_LABELS } from '@/lib/constants';
import type { Relationship } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/shared/Alert';
import { useT } from '@/components/admin/LangProvider';

type ParentInfo = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  relationship: Relationship;
  consent_given: boolean;
};
export type StudentWithParents = {
  id: string;
  full_name: string;
  admission_no: string;
  class_name: string;
  stream: string | null;
  parents: ParentInfo[];
};

type FormState = {
  full_name: string;
  admission_no: string;
  class_name: string;
  stream: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  relationship: Relationship;
};
const EMPTY: FormState = { full_name: '', admission_no: '', class_name: '', stream: '', parent_name: '', parent_phone: '', parent_email: '', relationship: 'Mother' };

export function StudentsManager({ students }: { students: StudentWithParents[] }) {
  const router = useRouter();
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.full_name} ${s.admission_no} ${s.class_name} ${s.stream ?? ''}`.toLowerCase().includes(q));
  }, [students, query]);

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  }

  function openEdit(s: StudentWithParents) {
    setEditingId(s.id);
    setForm({ ...EMPTY, full_name: s.full_name, admission_no: s.admission_no, class_name: s.class_name, stream: s.stream ?? '' });
    setError(null);
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const hasParent = form.parent_name.trim() && form.parent_email.trim() && form.parent_phone.trim();
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      full_name: form.full_name,
      admission_no: form.admission_no,
      class_name: form.class_name,
      stream: form.stream || null,
      ...(hasParent
        ? { parent: { full_name: form.parent_name, phone: form.parent_phone, email: form.parent_email, relationship: form.relationship } }
        : {}),
    };

    try {
      const res = await fetch('/api/admin/students', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as { error?: string; warning?: string; tempPassword?: string } | null;
      if (!res.ok) {
        setError(body?.error ?? 'Imeshindwa kuhifadhi.');
        return;
      }
      const parts: string[] = [];
      if (body?.tempPassword) parts.push(`Akaunti ya mzazi imeundwa. Nywila ya muda: ${body.tempPassword} (itaonekana mara moja tu; mpe mzazi).`);
      if (body?.warning) parts.push(body.warning);
      setNotice(parts.length ? parts.join(' ') : null);
      setShowForm(false);
      setForm(EMPTY);
      router.refresh();
    } catch {
      setError('Hakuna mtandao. Jaribu tena.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: StudentWithParents) {
    if (!window.confirm(`${t('common.confirmDelete')}\n\n${s.full_name}`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/students', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
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
      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {error && !showForm ? <Alert variant="error">{error}</Alert> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Input className="max-w-xs" placeholder={t('common.search')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('common.search')} />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('students.add')}
        </Button>
      </div>

      {showForm ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {error ? <Alert variant="error">{error}</Alert> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="s-name">{t('common.name')}</Label>
                  <Input id="s-name" required value={form.full_name} onChange={set('full_name')} />
                </div>
                <div>
                  <Label htmlFor="s-adm">{t('students.admission')}</Label>
                  <Input id="s-adm" required value={form.admission_no} onChange={set('admission_no')} />
                </div>
                <div>
                  <Label htmlFor="s-class">{t('students.class')}</Label>
                  <Input id="s-class" required placeholder="Form 1" value={form.class_name} onChange={set('class_name')} />
                </div>
                <div>
                  <Label htmlFor="s-stream">{t('students.stream')}</Label>
                  <Input id="s-stream" placeholder="A" maxLength={10} value={form.stream} onChange={set('stream')} />
                </div>
              </div>

              <fieldset className="space-y-3 rounded-lg border p-3">
                <legend className="px-1 text-sm font-medium">{t('students.parentInfo')}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="p-name">{t('students.parentName')}</Label>
                    <Input id="p-name" value={form.parent_name} onChange={set('parent_name')} />
                  </div>
                  <div>
                    <Label htmlFor="p-rel">{t('students.relationship')}</Label>
                    <Select id="p-rel" value={form.relationship} onChange={set('relationship')}>
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>
                          {RELATIONSHIP_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="p-phone">{t('common.phone')}</Label>
                    <Input id="p-phone" type="tel" placeholder="0712345678" value={form.parent_phone} onChange={set('parent_phone')} />
                  </div>
                  <div>
                    <Label htmlFor="p-email">{t('common.email')}</Label>
                    <Input id="p-email" type="email" value={form.parent_email} onChange={set('parent_email')} />
                  </div>
                </div>
              </fieldset>

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

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{t('students.empty')}</CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-3">{t('common.name')}</th>
                <th className="px-3 py-3">{t('students.admission')}</th>
                <th className="px-3 py-3">{t('students.class')}</th>
                <th className="px-3 py-3">{t('students.parents')}</th>
                <th className="px-3 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="px-3 py-3 font-medium">{s.full_name}</td>
                  <td className="px-3 py-3">{s.admission_no}</td>
                  <td className="px-3 py-3">
                    {s.class_name} {s.stream ?? ''}
                  </td>
                  <td className="px-3 py-3">
                    {s.parents.length === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <ul className="space-y-1">
                        {s.parents.map((p) => (
                          <li key={p.id} className="flex flex-wrap items-center gap-1">
                            {p.full_name}
                            <span className="text-muted-foreground">({RELATIONSHIP_LABELS[p.relationship]}{p.phone ? `, ${p.phone}` : ''})</span>
                            <Badge variant={p.consent_given ? 'success' : 'warning'}>{p.consent_given ? 'Idhini' : 'Inasubiri idhini'}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)} aria-label={`${t('common.edit')} ${s.full_name}`}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(s)} disabled={busy} aria-label={`${t('common.delete')} ${s.full_name}`}>
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
