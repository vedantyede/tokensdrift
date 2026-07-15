export type PlanId = 'pro' | 'team';

export interface BillingRecord {
  installationId: number;
  paddleCustomerId: string;
  paddleSubscriptionId: string | null;
  plan: PlanId | null;
  status: string;
  trialEndsAt: number;
  currentPeriodEnd: number | null;
  updatedAt: number;
}

export interface BillingStore {
  put(installationId: number, data: BillingRecord): Promise<void>;
  get(installationId: number): Promise<BillingRecord | null>;
  getByCustomerId(customerId: string): Promise<BillingRecord | null>;
}

let cachedStore: Promise<BillingStore> | null = null;

export function getBillingStore(): Promise<BillingStore> {
  if (cachedStore) return cachedStore;

  const hasRedis =
    Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  cachedStore = (async () => {
    if (hasRedis) {
      const { createVercelBillingStore } = await import('./billingStore.vercel');
      return createVercelBillingStore();
    }
    const { createFsBillingStore } = await import('./billingStore.fs');
    return createFsBillingStore();
  })();

  return cachedStore;
}
