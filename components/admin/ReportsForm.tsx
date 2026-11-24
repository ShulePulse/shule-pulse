'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DownloadReportButton } from '@/components/shared/DownloadReportButton';
import { useT } from '@/components/admin/LangProvider';

type Student = { id: string; full_name: string; class_name: string; stream: string | null; admission_no: string };
type Term = { id: string; name: string; year: number };

export function ReportsForm({ students, terms }: { students: Student[]; terms: Term[] }) {
  const { t } = useT();
  const [filter, setFilter] = useState('');
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [termId, setTermId] = useState(terms[0]?.id ?? '');
  const [comment, setComment] = useState('');

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = q ? students.filter((s) => `${s.full_name} ${s.admission_no}`.toLowerCase().includes(q)) : students;
    return list.slice(0, 300);
  }, [students, filter]);

  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div>
          <Label htmlFor="r-filter">{t('common.search')}</Label>
          <Input id="r-filter" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="r-student">{t('reports.student')}</Label>
          <Select id="r-student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {visible.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.class_name} {s.stream ?? ''}) - {s.admission_no}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="r-term">{t('reports.term')}</Label>
          <Select id="r-term" value={termId} onChange={(e) => setTermId(e.target.value)}>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} {term.year}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="r-comment">{t('reports.comment')}</Label>
          <Textarea id="r-comment" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <DownloadReportButton studentId={studentId} termId={termId} comment={comment} label="Zalisha PDF" />
      </CardContent>
    </Card>
  );
}
