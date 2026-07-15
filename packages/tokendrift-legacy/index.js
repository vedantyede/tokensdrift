#!/usr/bin/env node
// tokendrift was renamed to tokensdrift. Rather than leaving this package
// frozen or removed, it forwards every invocation to the real tool (always
// the latest published version, not a pinned dependency) so anyone with
// `npx tokendrift` baked into a script or CI config doesn't just break.
import { spawnSync } from 'node:child_process';

process.stderr.write(
  '\n⚠ tokendrift has been renamed to tokensdrift.\n' +
    'Running tokensdrift now on your behalf — update to `npx tokensdrift`\n' +
    'directly when convenient to skip this notice.\n\n',
);

const result = spawnSync('npx', ['--yes', 'tokensdrift', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
});

if (result.error) {
  process.stderr.write(`tokendrift: failed to launch tokensdrift: ${result.error.message}\n`);
  process.exit(2);
}

process.exit(result.status ?? 1);
