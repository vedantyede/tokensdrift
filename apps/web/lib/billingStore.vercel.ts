import { Redis } from '@upstash/redis';
import type { BillingStore, BillingRecord } from './billingStore.js';

function key(installationId: number): string {
  return `billing:${installationId}`;
}

function customerIndexKey(customerId: string): string {
  return `billing-customer:${customerId}`;
}

function redisClient(): Redis {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Redis env vars not configured (KV_REST_API_* or UPSTASH_REDIS_REST_*)');
  }
  return new Redis({ url, token });
}

export function createVercelBillingStore(): BillingStore {
  const redis = redisClient();

  async function get(installationId: number): Promise<BillingRecord | null> {
    const raw = await redis.get<string>(key(installationId));
    if (!raw) return null;
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as BillingRecord;
  }

  return {
    get,

    async put(installationId, data) {
      await redis.set(key(installationId), JSON.stringify(data));
      await redis.set(customerIndexKey(data.paddleCustomerId), String(installationId));
    },

    async getByCustomerId(customerId) {
      const raw = await redis.get<string>(customerIndexKey(customerId));
      if (!raw) return null;
      const installationId = Number(typeof raw === 'string' ? raw : raw);
      return get(installationId);
    },
  };
}
