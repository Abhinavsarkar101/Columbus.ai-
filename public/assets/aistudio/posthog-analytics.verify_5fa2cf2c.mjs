#!/usr/bin/env node
/**
 * Offline verification for the Compass PostHog integration.
 *
 * Run it with: npm run verify:analytics
 *
 * It does three things, all read-only:
 *  1. checks the SDK importer's manifest and original lock file still pin
 *     posthog-js 1.438.13, and that no second manager/ SDK got added;
 *  2. checks the configuration names, empty token placeholder and git ignore
 *     rules are in place, and that no real project token is committed;
 *  3. runs the handler tests in tests/ through Node's own test runner with a
 *     minimal environment, a synthetic configuration and fetch disabled, so
 *     no event can reach the network.
 *
 * A missing runner, a missing test file or a run with zero assertions fails.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SDK_VERSION = '1.438.13';
const failures = [];
const checks = [];

function check(name, run) {
  try {
    const detail = run();
    checks.push(`  ok   ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    checks.push(`  FAIL ${name}`);
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const manifest = readJson('package.json');
const lock = readJson('package-lock.json');
const sourceFiles = walk('src').filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));

check('packageManager is npm with the original package-lock.json', () => {
  assert(existsSync(join(ROOT, 'package-lock.json')), 'package-lock.json is missing');
  for (const rival of ['yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock']) {
    assert(!existsSync(join(ROOT, rival)), `${rival} would make the project mixed-manager`);
  }
  assert(lock.lockfileVersion >= 2, 'package-lock.json is not an npm lockfile');
  return `npm ${lock.lockfileVersion}`;
});

check(`the SDK importer's manifest pins posthog-js ${SDK_VERSION}`, () => {
  const declared = manifest.dependencies?.['posthog-js'];
  assert(declared === SDK_VERSION, `package.json declares ${declared ?? 'nothing'}`);
  return `package.json → ${declared}`;
});

check(`package-lock.json resolves posthog-js ${SDK_VERSION}`, () => {
  const entry = lock.packages?.['node_modules/posthog-js'];
  assert(entry, 'node_modules/posthog-js is absent from package-lock.json');
  assert(entry.version === SDK_VERSION, `lock resolves ${entry.version}`);
  assert(
    typeof entry.resolved === 'string' && entry.resolved.includes(`posthog-js-${SDK_VERSION}.tgz`),
    `lock tarball is ${entry.resolved}`,
  );
  assert(
    lock.packages?.['']?.dependencies?.['posthog-js'] === SDK_VERSION,
    'the lock root does not pin the same version as package.json',
  );
  return `${entry.resolved.split('/').pop()} (integrity pinned)`;
});

check('one PostHog client import in application source', () => {
  const importers = sourceFiles.filter((file) =>
    /from\s+['"]posthog-js['"]|require\(\s*['"]posthog-js['"]\s*\)/.test(readFileSync(join(ROOT, file), 'utf8')),
  );
  assert(importers.length === 1, `expected one importer, found ${importers.length}: ${importers.join(', ')}`);
  return relative(ROOT, join(ROOT, importers[0]));
});

check('configuration names and empty placeholders live in .env.example', () => {
  const example = readFileSync(join(ROOT, '.env.example'), 'utf8');
  assert(/^VITE_POSTHOG_PROJECT_TOKEN=\s*$/m.test(example), 'VITE_POSTHOG_PROJECT_TOKEN is not an empty placeholder');
  assert(/^VITE_POSTHOG_HOST=\s*$/m.test(example), 'VITE_POSTHOG_HOST is not an empty placeholder');
  return 'VITE_POSTHOG_PROJECT_TOKEN / VITE_POSTHOG_HOST';
});

check('local env files are git-ignored', () => {
  const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');
  assert(/^\.env\*$/m.test(ignore), '.gitignore does not ignore .env*');
  assert(/^!\.env\.example$/m.test(ignore), '.env.example is not exempted');
  assert(!/^\.env\.local$/m.test(ignore), '.env.local is ignored through .env*');
  return '.env* ignored, .env.example kept';
});

check('no real PostHog project token is committed', () => {
  const tokenPattern = /\bph[cx]_[A-Za-z0-9]{20,}/;
  const scanned = [...sourceFiles, 'posthog-analytics.md', '.env.example'];
  const offenders = scanned.filter(
    (file) => existsSync(join(ROOT, file)) && tokenPattern.test(readFileSync(join(ROOT, file), 'utf8')),
  );
  assert(offenders.length === 0, `token-like literal in ${offenders.join(', ')}`);
  return `${scanned.length} files clean`;
});

const testDir = join(ROOT, 'tests');
const testFiles = existsSync(testDir)
  ? readdirSync(testDir)
      .filter((name) => /\.test\.(ts|mts|js|mjs)$/.test(name))
      .map((name) => join('tests', name))
  : [];

check('handler tests exist for the instrumented actions', () => {
  assert(testFiles.length > 0, 'no tests/*.test.ts files were found');
  return testFiles.join(', ');
});

if (testFiles.length > 0) {
  const nodeBinary = process.execPath;
  // Node 22+ removed --no-experimental-fetch, and passing it makes the child
  // exit with a usage error (status 9). Only ask for it when this runtime still
  // accepts the flag; the tests use an in-memory transport either way.
  const canDisableFetch =
    spawnSync(nodeBinary, ['--no-experimental-fetch', '-e', ''], {
      encoding: 'utf8',
      timeout: 10_000,
    }).status === 0;

  const env = {
    PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
    HOME: process.env.HOME ?? '/tmp',
    TMPDIR: process.env.TMPDIR ?? '/tmp',
    LANG: process.env.LANG ?? 'C.UTF-8',
    // Fixed synthetic configuration only; never a real token.
    VITE_POSTHOG_PROJECT_TOKEN: 'synthetic-verify-project-token',
    VITE_POSTHOG_HOST: 'https://us.i.posthog.com',
    ...(canDisableFetch
      ? // When supported, this makes a stray fetch fail loudly.
        { NODE_OPTIONS: '--no-experimental-fetch' }
      : {}),
  };

  const result = spawnSync(nodeBinary, ['--test', '--test-reporter=tap', ...testFiles], {
    cwd: ROOT,
    env,
    shell: false,
    encoding: 'utf8',
    timeout: 120_000,
  });

  if (result.error) {
    failures.push(`test runner failed to start: ${result.error.message}`);
    checks.push('  FAIL handler tests could not run');
  } else if (result.status !== 0) {
    failures.push(`handler tests exited ${result.status}`);
    checks.push('  FAIL handler tests');
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
  } else {
    const passed = Number((result.stdout.match(/^# pass (\d+)$/m) ?? [])[1] ?? 0);
    const failed = Number((result.stdout.match(/^# fail (\d+)$/m) ?? [])[1] ?? 0);
    if (passed === 0 || failed !== 0) {
      failures.push(`handler tests reported ${passed} passing and ${failed} failing assertions`);
      checks.push('  FAIL handler tests asserted nothing');
    } else {
      checks.push(`  ok   handler tests — ${passed} assertions, 0 failures (offline, synthetic config)`);
    }
  }
}

console.log('PostHog analytics verification\n');
for (const line of checks) console.log(line);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('\nAll checks passed. No event was sent anywhere.');
