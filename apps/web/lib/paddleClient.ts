import { Paddle, Environment } from '@paddle/paddle-node-sdk';

let cached: Paddle | null = null;

export function paddleClient(): Paddle {
  if (cached) return cached;
  const key = process.env.PADDLE_API_KEY;
  if (!key) {
    throw new Error('PADDLE_API_KEY not configured');
  }
  // Defaults to sandbox — PADDLE_ENVIRONMENT must be explicitly set to
  // "production" to hit live Paddle, so a missing/misconfigured env var
  // can't accidentally take real payments.
  cached = new Paddle(key, {
    environment: process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
  });
  return cached;
}
