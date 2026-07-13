import { Redis } from '@upstash/redis';
import type { GithubInstallStore, Installation } from './githubInstallStore.js';

const INSTALLATIONS_SET = 'github-installations';

function key(id: number): string {
  return `github-install:${id}`;
}

function redisClient(): Redis {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Redis env vars not configured (KV_REST_API_* or UPSTASH_REDIS_REST_*)');
  }
  return new Redis({ url, token });
}

export function createVercelGithubInstallStore(): GithubInstallStore {
  const redis = redisClient();

  return {
    async put(installationId, data) {
      await redis.set(key(installationId), JSON.stringify(data));
      await redis.sadd(INSTALLATIONS_SET, String(installationId));
    },

    async get(installationId) {
      const raw = await redis.get<string>(key(installationId));
      if (!raw) return null;
      return (typeof raw === 'string' ? JSON.parse(raw) : raw) as Installation;
    },

    async remove(installationId) {
      await redis.del(key(installationId));
      await redis.srem(INSTALLATIONS_SET, String(installationId));
    },
  };
}
