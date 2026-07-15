import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { BillingStore, BillingRecord } from './billingStore.js';

const DATA_DIR = path.join(process.cwd(), '.data', 'billing');

function filePath(installationId: number): string {
  return path.join(DATA_DIR, `${installationId}.json`);
}

export function createFsBillingStore(): BillingStore {
  return {
    async put(installationId, data) {
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(filePath(installationId), JSON.stringify(data), 'utf8');
    },

    async get(installationId) {
      try {
        return JSON.parse(await readFile(filePath(installationId), 'utf8')) as BillingRecord;
      } catch {
        return null;
      }
    },

    async getByCustomerId(customerId) {
      let files: string[];
      try {
        files = await readdir(DATA_DIR);
      } catch {
        return null;
      }
      for (const file of files) {
        try {
          const record = JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf8')) as BillingRecord;
          if (record.paddleCustomerId === customerId) return record;
        } catch {
          // skip unreadable file
        }
      }
      return null;
    },
  };
}
