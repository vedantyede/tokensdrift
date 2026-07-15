// User-to-server GitHub OAuth (Sign in with GitHub via the App's own OAuth
// flow) — distinct from githubAuth.ts's app-to-server JWT flow, which
// authenticates as the App to act on a specific installation. This
// authenticates as a human, to find out which installations they're
// allowed to see in the dashboard.

interface GithubUser {
  id: number;
  login: string;
}

interface GithubInstallationRef {
  id: number;
}

export async function exchangeOAuthCode(code: string, redirectUri: string): Promise<string> {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GITHUB_APP_CLIENT_ID / GITHUB_APP_CLIENT_SECRET not configured');
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`OAuth code exchange failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(`OAuth code exchange failed: ${data.error ?? 'unknown'} ${data.error_description ?? ''}`);
  }
  return data.access_token;
}

async function userFetch(userToken: string, url: string): Promise<Response> {
  return fetch(url, {
    headers: { authorization: `Bearer ${userToken}`, accept: 'application/vnd.github+json' },
  });
}

export async function fetchGithubUser(userToken: string): Promise<GithubUser> {
  const res = await userFetch(userToken, 'https://api.github.com/user');
  if (!res.ok) throw new Error(`fetchGithubUser failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<GithubUser>;
}

/** Installation ids this user can see — GitHub scopes this to orgs/repos they actually have access to. */
export async function fetchUserInstallationIds(userToken: string): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  for (;;) {
    const res = await userFetch(userToken, `https://api.github.com/user/installations?per_page=100&page=${page}`);
    if (!res.ok) throw new Error(`fetchUserInstallationIds failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { installations: GithubInstallationRef[] };
    ids.push(...data.installations.map((i) => i.id));
    if (data.installations.length < 100) break;
    page++;
  }
  return ids;
}
