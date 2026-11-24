import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROLE_HOME } from '@/lib/constants';
import { safeNext } from '@/lib/utils';

/** Supabase auth callback: exchanges the emailed `code` for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) return NextResponse.redirect(`${origin}${next}`);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (profile) return NextResponse.redirect(`${origin}${ROLE_HOME[profile.role]}`);
      }
      return NextResponse.redirect(`${origin}/login`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
