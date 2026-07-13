export interface Installation {
  installationId: number;
  accountLogin: string;
  accountType: string;
  repositorySelection: 'all' | 'selected';
  repositories: string[];
  createdAt: number;
}

export interface GithubInstallStore {
  put(installationId: number, data: Installation): Promise<void>;
  get(installationId: number): Promise<Installation | null>;
  remove(installationId: number): Promise<void>;
}

let cachedStore: Promise<GithubInstallStore> | null = null;

export function getGithubInstallStore(): Promise<GithubInstallStore> {
  if (cachedStore) return cachedStore;

  const hasRedis =
    Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  cachedStore = (async () => {
    if (hasRedis) {
      const { createVercelGithubInstallStore } = await import('./githubInstallStore.vercel');
      return createVercelGithubInstallStore();
    }
    const { createFsGithubInstallStore } = await import('./githubInstallStore.fs');
    return createFsGithubInstallStore();
  })();

  return cachedStore;
}
