import { Redis } from '@upstash/redis';
import type { EmailCaptureEntry, EmailCaptureStore } from './emailCapture.js';

// Simple append-only log for the founder to review — not per-report, one
// global list that feeds the future paid-launch outreach (PRD F11).
const LIST_KEY = 'email-captures';

function redisClient(): Redis {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Redis env vars not configured (KV_REST_API_* or UPSTASH_REDIS_REST_*)');
  }
  return new Redis({ url, token });
}

export function createVercelEmailCaptureStore(): EmailCaptureStore {
  const redis = redisClient();

  return {
    async add(entry) {
      await redis.rpush(LIST_KEY, JSON.stringify(entry));
    },
  };
}
