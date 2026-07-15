import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

const STATE_COOKIE = 'tokensdrift_oauth_state';

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  if (!clientId) {
    return new Response('GitHub sign-in is not configured yet.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const state = randomBytes(16).toString('hex');
  const redirectUri = new URL('/api/auth/github/callback', req.url).toString();
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
