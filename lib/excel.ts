import * as XLSX from 'xlsx';

export type SheetData = { headers: string[]; rows: Record<string, unknown>[] };

/** Read the first sheet of an .xlsx / .xls / .csv file in the browser. */
export async function readSheet(file: File): Promise<SheetData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstName = workbook.SheetNames[0];
  const sheet = firstName ? workbook.Sheets[firstName] : undefined;
  if (!sheet) return { headers: [], rows: [] };
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true });
  const first = rows[0];
  return { headers: first ? Object.keys(first) : [], rows };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Guess which header matches each field using a synonym list. */
export function autoMap(headers: string[], synonyms: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [field, names] of Object.entries(synonyms)) {
    const wanted = [normalize(field), ...names.map(normalize)];
    const match = headers.find((h) => wanted.includes(normalize(h)));
    result[field] = match ?? '';
  }
  return result;
}

export function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}
