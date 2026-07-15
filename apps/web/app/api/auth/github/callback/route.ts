import { NextRequest, NextResponse } from 'next/server';
import { exchangeOAuthCode, fetchGithubUser, fetchUserInstallationIds } from '@/lib/githubOAuth';
import { signSession, SESSION_COOKIE } from '@/lib/session';

const STATE_COOKIE = 'tokensdrift_oauth_state';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return new Response('Invalid or expired login attempt — please try signing in again.', {
      status: 400,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const redirectUri = new URL('/api/auth/github/callback', req.url).toString();
  const userToken = await exchangeOAuthCode(code, redirectUri);
  const [user, installationIds] = await Promise.all([
    fetchGithubUser(userToken),
    fetchUserInstallationIds(userToken),
  ]);

  const session = signSession({
    githubUserId: user.id,
    githubLogin: user.login,
    installationIds,
  });

  const res = NextResponse.redirect(new URL('/dashboard', req.url));
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
