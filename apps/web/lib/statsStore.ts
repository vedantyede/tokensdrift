export interface Stats {
  reportsCreated: number;
  totalViews: number;
}

export interface StatsStore {
  /** Called once per successful --share upload. */
  incrementReportsCreated(): Promise<void>;
  /** Called once per hosted report page view (only when the report exists). */
  incrementView(reportId: string): Promise<void>;
  getStats(): Promise<Stats>;
}

let cachedStore: Promise<StatsStore> | null = null;

export function getStatsStore(): Promise<StatsStore> {
  if (cachedStore) return cachedStore;

  const hasRedis =
    Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  cachedStore = (async () => {
    if (hasRedis) {
      const { createVercelStatsStore } = await import('./statsStore.vercel');
      return createVercelStatsStore();
    }
    const { createFsStatsStore } = await import('./statsStore.fs');
    return createFsStatsStore();
  })();

  return cachedStore;
}
