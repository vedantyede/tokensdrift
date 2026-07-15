import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./githubAuth', () => ({
  getInstallationToken: vi.fn(async () => 'test-token'),
}));

const getEntitlementMock = vi.fn();
vi.mock('./entitlement', () => ({
  getEntitlement: getEntitlementMock,
}));

const listPrFilesMock = vi.fn();
const fetchFileContentMock = vi.fn();
const createCheckRunMock = vi.fn();
const upsertPrCommentMock = vi.fn();
vi.mock('./githubApi', () => ({
  listPrFiles: listPrFilesMock,
  fetchFileContent: fetchFileContentMock,
  createCheckRun: createCheckRunMock,
  upsertPrComment: upsertPrCommentMock,
}));

const { runPrCheck } = await import('./prCheck');

const BASE_PAYLOAD = {
  installation: { id: 1 },
  repository: { name: 'repo', owner: { login: 'owner' } },
  pull_request: { number: 7, head: { sha: 'head-sha' }, base: { sha: 'base-sha' } },
};

describe('runPrCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEntitlementMock.mockResolvedValue({ entitled: true, reason: 'trial', trialEndsAt: Date.now() + 1000 });
  });

  it('posts a neutral check run and skips scanning entirely when not entitled', async () => {
    getEntitlementMock.mockResolvedValue({ entitled: false, reason: 'trial_expired', trialEndsAt: 0 });

    await runPrCheck(BASE_PAYLOAD);

    expect(listPrFilesMock).not.toHaveBeenCalled();
    expect(upsertPrCommentMock).not.toHaveBeenCalled();
    expect(createCheckRunMock).toHaveBeenCalledTimes(1);
    expect(createCheckRunMock.mock.calls[0][3]).toMatchObject({ conclusion: 'neutral' });
  });

  it('reports success and a clean comment when no new violations are introduced', async () => {
    listPrFilesMock.mockResolvedValue([{ filename: 'a.css', status: 'modified' }]);
    fetchFileContentMock.mockImplementation(async (_t: string, _o: string, _r: string, _path: string, ref: string) =>
      ref === 'head-sha' ? '.a { color: #111111; }' : '.a { color: #111111; }',
    );

    await runPrCheck(BASE_PAYLOAD);

    expect(createCheckRunMock.mock.calls[0][3]).toMatchObject({ conclusion: 'success' });
    expect(upsertPrCommentMock).toHaveBeenCalledTimes(1);
    const commentBody = upsertPrCommentMock.mock.calls[0][4];
    expect(commentBody).toContain('No new drift introduced');
  });

  it('reports failure and lists only the newly introduced violation, not existing debt', async () => {
    listPrFilesMock.mockResolvedValue([{ filename: 'a.css', status: 'modified' }]);
    fetchFileContentMock.mockImplementation(async (_t: string, _o: string, _r: string, _path: string, ref: string) =>
      ref === 'head-sha' ? '.a { color: #111111; } .b { color: #222222; }' : '.a { color: #111111; }',
    );

    await runPrCheck(BASE_PAYLOAD);

    expect(createCheckRunMock.mock.calls[0][3]).toMatchObject({ conclusion: 'failure' });
    const commentBody = upsertPrCommentMock.mock.calls[0][4];
    expect(commentBody).toContain('1 new drift violation');
    expect(commentBody).toContain('#222222');
    expect(commentBody).not.toContain('#111111');
  });

  it('updates the same PR comment on every run rather than only once', async () => {
    listPrFilesMock.mockResolvedValue([{ filename: 'a.css', status: 'modified' }]);
    fetchFileContentMock.mockResolvedValue('.a { color: #111111; }');

    await runPrCheck(BASE_PAYLOAD);
    await runPrCheck(BASE_PAYLOAD);

    expect(upsertPrCommentMock).toHaveBeenCalledTimes(2);
    expect(upsertPrCommentMock.mock.calls[0].slice(0, 4)).toEqual(upsertPrCommentMock.mock.calls[1].slice(0, 4));
  });
});
