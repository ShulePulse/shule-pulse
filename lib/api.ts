import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/types';

/**
 * Authenticate + authorize a Route Handler call.
 * Usage:
 *   const ctx = await getApiContext(['teacher']);
 *   if ('error' in ctx) return ctx.error;
 */
export async function getApiContext(allowed: Role[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Hujaingia. Tafadhali ingia tena.' }, { status: 401 }) } as const;
  }
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (!profile || !allowed.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Huna ruhusa ya kufanya hili.' }, { status: 403 }) } as const;
  }
  return { supabase, user, profile } as const;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
