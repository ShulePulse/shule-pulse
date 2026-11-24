'use client';

import Dexie, { type Table } from 'dexie';
import type { StudentLite } from '@/types';

/**
 * Offline queue (Dexie / IndexedDB).
 * Writes that cannot reach the server are stored here and replayed when the network returns.
 * Attendance is an idempotent upsert, so replays are safe.
 */

export type QueueKind = 'attendance' | 'behavior';

export interface QueueItem {
  id?: number;
  kind: QueueKind;
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

export interface CachedClass {
  classId: string;
  students: StudentLite[];
  cachedAt: number;
}

class ShulePulseDB extends Dexie {
  // `declare` avoids class-field initialisation overwriting Dexie's table getters.
  declare queue: Table<QueueItem, number>;
  declare classes: Table<CachedClass, string>;

  constructor() {
    super('shulepulse');
    this.version(1).stores({
      queue: '++id, kind, createdAt',
      classes: 'classId',
    });
  }
}

let dbInstance: ShulePulseDB | null = null;
/** Lazily created so nothing touches IndexedDB during server rendering. */
function getDb(): ShulePulseDB {
  if (!dbInstance) dbInstance = new ShulePulseDB();
  return dbInstance;
}

const ENDPOINTS: Record<QueueKind, string> = {
  attendance: '/api/attendance/submit',
  behavior: '/api/behavior/submit',
};

export const QUEUE_EVENT = 'shulepulse:queue-changed';

type PostOutcome = { ok: boolean; retryable: boolean; message?: string };

async function post(kind: QueueKind, payload: unknown): Promise<PostOutcome> {
  try {
    const res = await fetch(ENDPOINTS[kind], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true, retryable: false };
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    // 401 (session expired) is kept in the queue so nothing is lost; the teacher just logs in again.
    const retryable = res.status >= 500 || res.status === 408 || res.status === 429 || res.status === 401;
    return { ok: false, retryable, message: body?.error };
  } catch {
    return { ok: false, retryable: true, message: 'Hakuna mtandao' };
  }
}

export type SubmitOutcome = { status: 'sent' | 'queued' | 'error'; message?: string };

async function enqueue(kind: QueueKind, payload: unknown, lastError?: string): Promise<void> {
  await getDb().queue.add({ kind, payload, createdAt: Date.now(), attempts: 0, lastError });
  window.dispatchEvent(new Event(QUEUE_EVENT));
}

/** Try to send now; if offline or the server is unreachable, store it for later. */
export async function submitOrQueue(kind: QueueKind, payload: unknown): Promise<SubmitOutcome> {
  if (!navigator.onLine) {
    await enqueue(kind, payload);
    return { status: 'queued' };
  }
  const result = await post(kind, payload);
  if (result.ok) return { status: 'sent' };
  if (result.retryable) {
    await enqueue(kind, payload, result.message);
    return { status: 'queued', message: result.message };
  }
  return { status: 'error', message: result.message ?? 'Imeshindwa kuwasilisha.' };
}

export async function getPendingCount(): Promise<number> {
  return getDb().queue.count();
}

let flushing = false;

/** Replays queued items oldest-first. Stops at the first retryable failure. */
export async function flushQueue(): Promise<{ sent: number; dropped: number; remaining: number }> {
  if (flushing || !navigator.onLine) return { sent: 0, dropped: 0, remaining: await getPendingCount() };
  flushing = true;
  let sent = 0;
  let dropped = 0;
  try {
    const db = getDb();
    const items = await db.queue.orderBy('createdAt').toArray();
    for (const item of items) {
      if (item.id === undefined) continue;
      const result = await post(item.kind, item.payload);
      if (result.ok) {
        await db.queue.delete(item.id);
        sent += 1;
      } else if (result.retryable) {
        await db.queue.update(item.id, { attempts: item.attempts + 1, lastError: result.message });
        break;
      } else {
        // Permanent rejection (validation / permission): drop so it never blocks the queue.
        await db.queue.delete(item.id);
        dropped += 1;
      }
    }
  } finally {
    flushing = false;
    window.dispatchEvent(new Event(QUEUE_EVENT));
  }
  return { sent, dropped, remaining: await getPendingCount() };
}

/** Cache the class list so the register can be re-opened offline. */
export async function cacheClass(classId: string, students: StudentLite[]): Promise<void> {
  try {
    await getDb().classes.put({ classId, students, cachedAt: Date.now() });
  } catch {
    // IndexedDB unavailable (private mode): offline cache is best-effort.
  }
}

export async function getCachedClass(classId: string): Promise<CachedClass | undefined> {
  try {
    return await getDb().classes.get(classId);
  } catch {
    return undefined;
  }
}
