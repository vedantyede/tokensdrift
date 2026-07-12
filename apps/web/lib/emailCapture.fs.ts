import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import type { EmailCaptureEntry, EmailCaptureStore } from './emailCapture.js';

const FILE = path.join(process.cwd(), '.data', 'email-captures.jsonl');

export function createFsEmailCaptureStore(): EmailCaptureStore {
  return {
    async add(entry) {
      await mkdir(path.dirname(FILE), { recursive: true });
      await appendFile(FILE, `${JSON.stringify(entry)}\n`, 'utf8');
    },
  };
}
