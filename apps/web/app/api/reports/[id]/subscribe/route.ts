import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getEmailCaptureStore } from '@/lib/emailCapture';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const email = (body as { email?: unknown } | null)?.email;
  if (
    typeof email !== 'string' ||
    email.length === 0 ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_RE.test(email)
  ) {
    return NextResponse.json({ error: 'a valid email is required' }, { status: 400 });
  }

  const store = await getStore();
  const report = await store.get(id);
  if (!report) {
    return NextResponse.json({ error: 'report not found or expired' }, { status: 404 });
  }

  const captureStore = await getEmailCaptureStore();
  await captureStore.add({
    email,
    reportId: id,
    repoSlug: report.meta.repoSlug,
    capturedAt: Date.now(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
