import { NextRequest, NextResponse } from 'next/server';

// ── Route definitions ─────────────────────────────────────────────────────────

// These routes are accessible without a token
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forbidden', '/forgot-password', '/reset-password', '/payment'];

// These routes require super_admin role
const SUPER_ADMIN_ROUTES = ['/super-admin'];

// These routes require admin or super_admin role (staff cannot access)
const ADMIN_ONLY_ROUTES = ['/users', '/settings'];

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token    = request.cookies.get('auth_token')?.value;
  const userRaw  = request.cookies.get('auth_user')?.value;

  const user = userRaw ? parseUser(userRaw) : null;
  const isLoggedIn = !!token;

  // 1. Already logged in + trying to visit /login → send to dashboard
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Public route → always allow through
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // 3. Not logged in + protected route → send to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Super-admin-only routes
  if (SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 5. Admin-only routes (staff cannot access)
  if (ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user?.role === 'staff') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseUser(raw: string): { role: string } | null {
  try {
    return JSON.parse(decodeURIComponent(raw)) as { role: string };
  } catch {
    return null;
  }
}

// Tell Next.js which paths this middleware should run on.
// Excludes _next internals, static files, and image routes.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
