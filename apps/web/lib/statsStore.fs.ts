import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Stats, StatsStore } from './statsStore.js';

const FILE = path.join(process.cwd(), '.data', 'stats.json');

interface FileShape extends Stats {
  perReportViews: Record<string, number>;
}

async function read(): Promise<FileShape> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as FileShape;
  } catch {
    return { reportsCreated: 0, totalViews: 0, perReportViews: {} };
  }
}

async function write(data: FileShape): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data), 'utf8');
}

export function createFsStatsStore(): StatsStore {
  return {
    async incrementReportsCreated() {
      const data = await read();
      data.reportsCreated += 1;
      await write(data);
    },

    async incrementView(reportId) {
      const data = await read();
      data.totalViews += 1;
      data.perReportViews[reportId] = (data.perReportViews[reportId] ?? 0) + 1;
      await write(data);
    },

    async getStats() {
      const { reportsCreated, totalViews } = await read();
      return { reportsCreated, totalViews };
    },
  };
}
