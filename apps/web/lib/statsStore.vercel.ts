import { Redis } from '@upstash/redis';
import type { Stats, StatsStore } from './statsStore.js';

const REPORTS_CREATED_KEY = 'stats:reports-created';
const TOTAL_VIEWS_KEY = 'stats:total-views';

function viewKey(reportId: string): string {
  return `stats:views:${reportId}`;
}

function redisClient(): Redis {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Redis env vars not configured (KV_REST_API_* or UPSTASH_REDIS_REST_*)');
  }
  return new Redis({ url, token });
}

export function createVercelStatsStore(): StatsStore {
  const redis = redisClient();

  return {
    async incrementReportsCreated() {
      await redis.incr(REPORTS_CREATED_KEY);
    },

    async incrementView(reportId) {
      // Per-report count kept alongside the global tally — not surfaced by
      // getStats() yet, but there for "which teardown got traction" later.
      await Promise.all([redis.incr(TOTAL_VIEWS_KEY), redis.incr(viewKey(reportId))]);
    },

    async getStats(): Promise<Stats> {
      const [reportsCreated, totalViews] = await Promise.all([
        redis.get<number>(REPORTS_CREATED_KEY),
        redis.get<number>(TOTAL_VIEWS_KEY),
      ]);
      return { reportsCreated: reportsCreated ?? 0, totalViews: totalViews ?? 0 };
    },
  };
}
