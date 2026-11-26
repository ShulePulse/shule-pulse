import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ROLE_HOME } from '@/lib/constants';
import type { UserRow } from '@/types/database';
import type { Role } from '@/types';

/**
 * Use at the top of Server Components / layouts. Redirects to /login when signed out
 * and to the user's own home when the role is not allowed (defence in depth with middleware).
 */
export async function requireProfile(allowed: Role[]): Promise<{
  supabase: ReturnType<typeof createClient>;
  user: User;
  profile: UserRow;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
  // Explicit cast: the hand-written Database type can infer `never` for this query.
  const profile = data as UserRow | null;
  if (!profile) redirect('/login?error=profile');

  if (!allowed.includes(profile.role)) redirect(ROLE_HOME[profile.role]);
  return { supabase, user, profile };
}