import { NextRequest, NextResponse } from 'next/server';
import { EventName } from '@paddle/paddle-node-sdk';
import { paddleClient } from '@/lib/paddleClient';
import { getBillingStore, type PlanId } from '@/lib/billingStore';

const TRIAL_DAYS = 14;

// SubscriptionCreated/Updated/CanceledNotification are separate SDK classes
// (not a shared base type) but structurally identical for the fields used
// here, so one local shape covers all three.
interface SubscriptionEventData {
  id: string;
  customerId: string;
  status: string;
  currentBillingPeriod: { endsAt: string } | null;
  customData: Record<string, unknown> | null;
}

const SUBSCRIPTION_EVENTS = new Set<string>([
  EventName.SubscriptionCreated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionCanceled,
]);

function planFromCustomData(sub: SubscriptionEventData): PlanId | null {
  const plan = sub.customData?.plan;
  return plan === 'pro' || plan === 'team' ? plan : null;
}

function currentPeriodEnd(sub: SubscriptionEventData): number | null {
  const endsAt = sub.currentBillingPeriod?.endsAt;
  return endsAt ? Date.parse(endsAt) : null;
}

async function syncSubscription(installationId: number, sub: SubscriptionEventData) {
  const store = await getBillingStore();
  const existing = await store.get(installationId);
  await store.put(installationId, {
    installationId,
    paddleCustomerId: sub.customerId,
    paddleSubscriptionId: sub.id,
    plan: planFromCustomData(sub),
    status: sub.status,
    trialEndsAt: existing?.trialEndsAt ?? Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
    currentPeriodEnd: currentPeriodEnd(sub),
    updatedAt: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const signature = req.headers.get('paddle-signature');
  const rawBody = await req.text();

  if (!secret || !signature) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 401 });
  }

  const paddle = paddleClient();
  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (err) {
    return NextResponse.json({ error: `invalid signature: ${(err as Error).message}` }, { status: 401 });
  }

  if (SUBSCRIPTION_EVENTS.has(event.eventType)) {
    const sub = event.data as unknown as SubscriptionEventData;
    const installationId = Number(sub.customData?.installationId);
    if (installationId) {
      await syncSubscription(installationId, sub);
    }
  }

  return NextResponse.json({ received: true });
}
