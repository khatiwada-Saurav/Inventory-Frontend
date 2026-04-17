export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff';
  tenant_id: number | null;
  tenant_name: string | null;
  tenant_slug: string | null;
  created_at?: string;
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
// Token is stored in a cookie (7-day expiry).
// User object is stored in a separate cookie as JSON.
// Cookies work across tabs and survive page refreshes, just like localStorage,
// but they can later be upgraded to HttpOnly server-side for better security.

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';
const EXPIRES_DAYS = 7;

function setCookie(name: string, value: string, days: number): void {
  if (globalThis.window === undefined) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  globalThis.document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (globalThis.window === undefined) return null;
  const match = globalThis.document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function deleteCookie(name: string): void {
  if (globalThis.window === undefined) return;
  globalThis.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return getCookie(TOKEN_KEY);
}

export function getUser(): User | null {
  const raw = getCookie(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  setCookie(TOKEN_KEY, token, EXPIRES_DAYS);
  setCookie(USER_KEY, JSON.stringify(user), EXPIRES_DAYS);
}

export function clearAuth(): void {
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isSuperAdmin(): boolean {
  return getUser()?.role === 'super_admin';
}

export function isAdmin(): boolean {
  const role = getUser()?.role;
  return role === 'admin' || role === 'super_admin';
}

export function isStaff(): boolean {
  return getUser()?.role === 'staff';
}
