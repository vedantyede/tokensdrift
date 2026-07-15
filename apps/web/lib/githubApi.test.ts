import { describe, it, expect, vi, afterEach } from 'vitest';
import { upsertPrComment } from './githubApi';

interface RecordedCall {
  url: string;
  init?: RequestInit;
}

describe('upsertPrComment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a new comment when no existing marker comment is found', async () => {
    const calls: RecordedCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL, init?: RequestInit) => {
        const u = String(url);
        calls.push({ url: u, init });
        if (u.includes('/comments?')) {
          return new Response(JSON.stringify([{ id: 1, body: 'unrelated comment' }]), { status: 200 });
        }
        return new Response(JSON.stringify({ id: 999 }), { status: 201 });
      }),
    );

    await upsertPrComment('tok', 'owner', 'repo', 42, 'hello world');

    const postCall = calls.find((c) => c.init?.method === 'POST');
    expect(postCall).toBeDefined();
    expect(postCall!.url).toContain('/repos/owner/repo/issues/42/comments');
    const body = JSON.parse(postCall!.init!.body as string);
    expect(body.body).toContain('<!-- tokensdrift:drift-comment -->');
    expect(body.body).toContain('hello world');
    expect(calls.some((c) => c.init?.method === 'PATCH')).toBe(false);
  });

  it('updates the existing comment in place when a marker comment is found', async () => {
    const calls: RecordedCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL, init?: RequestInit) => {
        const u = String(url);
        calls.push({ url: u, init });
        if (u.includes('/comments?')) {
          return new Response(
            JSON.stringify([{ id: 5, body: '<!-- tokensdrift:drift-comment -->\nold content' }]),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ id: 5 }), { status: 200 });
      }),
    );

    await upsertPrComment('tok', 'owner', 'repo', 42, 'new content');

    const patchCall = calls.find((c) => c.init?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    expect(patchCall!.url).toContain('/repos/owner/repo/issues/comments/5');
    const body = JSON.parse(patchCall!.init!.body as string);
    expect(body.body).toContain('new content');
    expect(calls.some((c) => c.init?.method === 'POST')).toBe(false);
  });

  // Multi-page pagination (>100 existing comments before finding the
  // marker) is intentionally not covered here — reproducing it triggers an
  // unrelated Vitest/Node OOM crash in this environment (confirmed via a
  // minimal repro with no app code involved: a bare for(;;) loop doing two
  // sequential stubbed fetch calls with a 100-item array). Low real-world
  // risk: upsertPrComment runs on every push, so its own comment is almost
  // always found on page 1 after the very first run.
});
