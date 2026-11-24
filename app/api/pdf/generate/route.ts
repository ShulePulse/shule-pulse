import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { z } from 'zod';
import { getApiContext, jsonError } from '@/lib/api';
import { getReportData } from '@/lib/pdf/data';
import { ReportCard } from '@/lib/pdf/ReportCard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const bodySchema = z.object({
  studentId: z.string().uuid(),
  termId: z.string().uuid(),
  comment: z.string().trim().max(1000).optional().default(''),
});

/**
 * Generates a report-card PDF. Admins (their school) and parents (linked + consented children)
 * may call it; RLS on the caller's session decides which student they can read.
 */
export async function POST(request: Request) {
  const ctx = await getApiContext(['admin', 'parent']);
  if ('error' in ctx) return ctx.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Chagua mwanafunzi na muhula.', 400);
  const { studentId, termId, comment } = parsed.data;

  const data = await getReportData(ctx.supabase, studentId, termId, comment);
  if (!data) return jsonError('Mwanafunzi au muhula haupatikani.', 404);

  const buffer = await renderToBuffer(ReportCard(data));
  const safeName = data.student.full_name.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40) || 'mwanafunzi';

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ripoti_${safeName}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
