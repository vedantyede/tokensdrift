import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = 'tokensdrift_session';

export interface SessionPayload {
  githubUserId: number;
  githubLogin: string;
  installationIds: number[];
}

interface SignedPayload extends SessionPayload {
  iat: number;
  exp: number;
}

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

// Hand-rolled HMAC-signed cookie rather than a session store — no separate
// account system exists (see CLAUDE.md), so the session just carries what
// GitHub already told us at login time (user identity + accessible
// installation ids). Same node:crypto-only convention as the App's own JWT
// signing in githubAuth.ts, just symmetric (HMAC) instead of RS256 since
// this is signed and verified by us alone.
export function signSession(payload: SessionPayload): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not configured');

  const now = Date.now();
  const signed: SignedPayload = { ...payload, iat: now, exp: now + SESSION_TTL_MS };
  const body = base64url(JSON.stringify(signed));
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifySession(token: string): SessionPayload | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: SignedPayload;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (Date.now() > parsed.exp) return null;
  const { githubUserId, githubLogin, installationIds } = parsed;
  return { githubUserId, githubLogin, installationIds };
}
