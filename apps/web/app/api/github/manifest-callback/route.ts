import { NextRequest } from 'next/server';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// One-time flow: GitHub redirects here with a short-lived `code` right after
// the app manifest is confirmed on GitHub's side. Exchanging it is the only
// chance to see the private key, client secret, and webhook secret — GitHub
// doesn't show them again after this. Nothing here is stored automatically;
// the values are only displayed once, for you to copy into Vercel env vars
// yourself (consistent with how every other secret this session has been
// handled — never auto-persisted without a human in the loop).
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  const res = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
    method: 'POST',
    headers: { accept: 'application/vnd.github+json' },
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(`Conversion failed (${res.status}): ${text}`, { status: 502 });
  }

  const data = (await res.json()) as {
    id: number;
    slug: string;
    name: string;
    client_id: string;
    client_secret: string;
    webhook_secret: string;
    pem: string;
  };

  const html = `<!doctype html>
<html><body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 24px; line-height: 1.6;">
<h1>GitHub App created: ${escapeHtml(data.name)}</h1>
<p>Save these now as Vercel env vars — some of them won't be shown by GitHub again.</p>
<pre style="white-space: pre-wrap; background: #f4f4f4; padding: 16px; border-radius: 8px;">GITHUB_APP_ID=${data.id}
GITHUB_APP_SLUG=${escapeHtml(data.slug)}
GITHUB_APP_CLIENT_ID=${escapeHtml(data.client_id)}
GITHUB_APP_CLIENT_SECRET=${escapeHtml(data.client_secret)}
GITHUB_APP_WEBHOOK_SECRET=${escapeHtml(data.webhook_secret)}</pre>
<p>Private key (save as <code>GITHUB_APP_PRIVATE_KEY</code>, the whole block as one value):</p>
<pre style="white-space: pre-wrap; background: #f4f4f4; padding: 16px; border-radius: 8px; font-size: 12px;">${escapeHtml(data.pem)}</pre>
<p>Once those are set, install the app at:
<a href="https://github.com/apps/${escapeHtml(data.slug)}/installations/new">https://github.com/apps/${escapeHtml(data.slug)}/installations/new</a></p>
</body></html>`;

  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
