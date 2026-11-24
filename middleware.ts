import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { ROLE_HOME, ROUTE_ROLES } from '@/lib/constants';
import type { Role } from '@/types';

const AUTH_PAGES = ['/login', '/register-school', '/forgot-password'];

function isRole(value: string | undefined): value is Role {
  return value !== undefined && value in ROLE_HOME;
}

export async function middleware(request: NextRequest) {
  const { supabase, user, getResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const redirect = (to: string, search?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = search ?? '';
    const res = NextResponse.redirect(url);
    // Keep refreshed auth cookies on the redirect response.
    getResponse().cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const rule = ROUTE_ROLES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // 1) Not signed in -> protected pages go to /login
  if (!user) {
    if (rule) return redirect('/login', `?next=${encodeURIComponent(pathname)}`);
    return getResponse();
  }

  // 2) Signed in: only look up the profile when we need the role
  if (!rule && !isAuthPage) return getResponse();

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = profile?.role;

  if (!isRole(role)) {
    // Signed in but no valid profile: let them see /login, block protected areas.
    if (rule) return redirect('/login', '?error=profile');
    return getResponse();
  }

  // 3) Already signed in -> skip the auth pages
  if (isAuthPage) return redirect(ROLE_HOME[role]);

  // 4) Role-based route protection
  if (rule && !rule.roles.includes(role)) {
    return redirect(ROLE_HOME[role], '?error=forbidden');
  }

  // 5) PDPA: parents must consent before they can use the parent area
  if (role === 'parent' && pathname.startsWith('/parent')) {
    const { count } = await supabase
      .from('parent_student_links')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', user.id)
      .eq('consent_given', false);
    if ((count ?? 0) > 0) return redirect('/consent');
  }

  return getResponse();
}

export const config = {
  matcher: [
    // Run on everything except static assets and PWA files.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/|templates/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|csv)$).*)',
  ],
};
