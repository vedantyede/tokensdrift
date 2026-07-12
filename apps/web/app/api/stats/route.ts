import { NextResponse } from 'next/server';
import { getStatsStore } from '@/lib/statsStore';

// Aggregate counts only (no per-user data) — deliberately left
// unauthenticated. This is the honest proxy for the PRD's "shares-per-scan"
// guardrail: local scans are never reported to the server by design, so
// there's no way to count true total scans. "Views per shared report" is
// what's actually measurable without breaking that privacy promise.
export async function GET() {
  const store = await getStatsStore();
  const stats = await store.getStats();
  const viewsPerReport = stats.reportsCreated > 0 ? stats.totalViews / stats.reportsCreated : 0;

  return NextResponse.json({
    reportsCreated: stats.reportsCreated,
    totalViews: stats.totalViews,
    viewsPerReport: Math.round(viewsPerReport * 100) / 100,
  });
}
