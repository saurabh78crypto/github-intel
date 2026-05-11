import api from './api';

export interface AuthUser {
  userId: string;
  email: string;
}

let _user: AuthUser | null = null;

export function getCachedUser(): AuthUser | null {
  return _user;
}

export function isLoggedIn(): boolean {
  return _user !== null;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await api.get('/analysis/me');
    _user = { userId: res.data.userId, email: res.data.email };
    return _user;
  } catch {
    _user = null;
    return null;
  }
}

export function clearToken(): void {
  _user = null;
  api.post('/auth/logout').catch(() => {});
}

export function friendlyError(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  const lower = raw.toLowerCase();
  if (lower.includes('not found'))
    return "We couldn't find that GitHub username. Please double-check it and try again.";
  if (lower.includes('rate limit'))
    return 'GitHub is temporarily limiting requests. Please wait a minute and try again.';
  if (lower.includes('no public repositories') || lower.includes('no public repos'))
    return 'This profile has no public repositories to analyse. Try a different username.';
  if (lower.includes('ai service') || lower.includes('connection failed'))
    return 'Our analysis engine is temporarily unavailable. Please try again in a moment.';
  if (lower.includes('username is required'))
    return 'Please enter a GitHub username before analysing.';
  if (lower.includes('failed to score') || lower.includes('failed to generate'))
    return 'The AI analysis encountered an issue. Please try again.';
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'The request took too long. GitHub may be slow — please retry.';
  return 'Something went wrong during the analysis. Please try again.';
}