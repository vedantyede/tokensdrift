import { NextResponse } from 'next/server';

export async function GET() {
  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) {
    return new Response('GitHub App not set up yet — see /setup/github-app first.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  return NextResponse.redirect(`https://github.com/apps/${slug}/installations/new`);
}
