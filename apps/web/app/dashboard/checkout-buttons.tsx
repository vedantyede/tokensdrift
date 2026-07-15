'use client';

import { useEffect, useState } from 'react';
import type { PlanId } from '@/lib/billingStore';

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: { open: (opts: { transactionId: string }) => void };
    };
  }
}

let paddleLoad: Promise<void> | null = null;

// Paddle.js has no npm package for the client-side overlay — it's a CDN
// script that attaches window.Paddle. Loaded lazily and cached per page so
// multiple CheckoutButtons instances (one per installation) don't each
// inject their own <script> tag.
function loadPaddleJs(): Promise<void> {
  if (paddleLoad) return paddleLoad;
  paddleLoad = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      if (!token) {
        reject(new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set'));
        return;
      }
      window.Paddle?.Environment.set(
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      );
      window.Paddle?.Initialize({ token });
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.body.appendChild(script);
  });
  return paddleLoad;
}

const PLAN_LABELS: Record<PlanId, string> = {
  pro: 'Upgrade to Pro — $29/mo',
  team: 'Upgrade to Team — $79/mo',
};

export function CheckoutButtons({
  installationId,
  availablePlans,
}: {
  installationId: number;
  availablePlans: PlanId[];
}) {
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPaddleJs().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load Paddle.js'));
  }, []);

  if (availablePlans.length === 0) return null;

  async function startCheckout(plan: PlanId) {
    setError('');
    setPending(plan);
    try {
      await loadPaddleJs();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ installationId, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${res.status})`);
      window.Paddle?.Checkout.open({ transactionId: data.transactionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {availablePlans.map((plan) => (
          <button
            key={plan}
            onClick={() => startCheckout(plan)}
            disabled={pending !== null}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 3,
              border: 'none',
              background: 'var(--token)',
              color: 'var(--paper-raised)',
              cursor: 'pointer',
            }}
          >
            {pending === plan ? 'Opening checkout…' : PLAN_LABELS[plan]}
          </button>
        ))}
      </div>
      {error && <p style={{ color: 'var(--drift)', fontSize: 13 }}>{error}</p>}
    </div>
  );
}
