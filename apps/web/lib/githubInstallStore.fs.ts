import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { GithubInstallStore, Installation } from './githubInstallStore.js';

const DATA_DIR = path.join(process.cwd(), '.data', 'github-installs');

function filePath(id: number): string {
  return path.join(DATA_DIR, `${id}.json`);
}

export function createFsGithubInstallStore(): GithubInstallStore {
  return {
    async put(installationId, data) {
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(filePath(installationId), JSON.stringify(data), 'utf8');
    },

    async get(installationId) {
      try {
        return JSON.parse(await readFile(filePath(installationId), 'utf8')) as Installation;
      } catch {
        return null;
      }
    },

    async remove(installationId) {
      await unlink(filePath(installationId)).catch(() => {});
    },
  };
}
