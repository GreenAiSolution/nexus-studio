// Lightweight client-only "session" for the self-contained studio.
// No backend, no cookies — just remembers who walked in so the studio can
// greet them by name. Swap for real auth later without touching the UI.

const KEY = 'nexus_studio_user';

export interface StudioUser {
  email: string;
  firstName: string;
}

export function signIn(email: string): StudioUser {
  const handle = email.split('@')[0] || 'operator';
  const firstName =
    handle
      .split(/[.\-_+]/)[0]
      .replace(/[^a-zA-Z]/g, '') || 'operator';
  const user: StudioUser = {
    email,
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, JSON.stringify(user));
  }
  return user;
}

export function getUser(): StudioUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudioUser) : null;
  } catch {
    return null;
  }
}

export function signOut() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}
