import { NextRequest, NextResponse } from 'next/server';
import { paddleClient } from '@/lib/paddleClient';
import { getBillingStore } from '@/lib/billingStore';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const installationId = Number(body?.installationId);
  if (!installationId) {
    return NextResponse.json({ error: 'installationId is required' }, { status: 400 });
  }

  const billingStore = await getBillingStore();
  const record = await billingStore.get(installationId);
  if (!record) {
    return NextResponse.json({ error: 'no billing record for this installation' }, { status: 404 });
  }

  const paddle = paddleClient();
  const subscriptionIds = record.paddleSubscriptionId ? [record.paddleSubscriptionId] : [];
  try {
    const session = await paddle.customerPortalSessions.create(record.paddleCustomerId, subscriptionIds);
    return NextResponse.json({ url: session.urls.general.overview });
  } catch (err) {
    return NextResponse.json({ error: `Paddle portal session failed: ${(err as Error).message}` }, { status: 502 });
  }
}
