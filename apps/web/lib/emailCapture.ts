export interface EmailCaptureEntry {
  email: string;
  reportId: string;
  repoSlug?: string;
  capturedAt: number;
}

export interface EmailCaptureStore {
  add(entry: EmailCaptureEntry): Promise<void>;
}

let cachedStore: Promise<EmailCaptureStore> | null = null;

export function getEmailCaptureStore(): Promise<EmailCaptureStore> {
  if (cachedStore) return cachedStore;

  const hasRedis =
    Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  cachedStore = (async () => {
    if (hasRedis) {
      const { createVercelEmailCaptureStore } = await import('./emailCapture.vercel');
      return createVercelEmailCaptureStore();
    }
    const { createFsEmailCaptureStore } = await import('./emailCapture.fs');
    return createFsEmailCaptureStore();
  })();

  return cachedStore;
}
