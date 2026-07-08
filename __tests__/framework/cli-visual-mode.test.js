import { execFileSync } from 'child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../../bin/jest-e2e.js');

describe('jest-e2e CLI visual mode', () => {
  let projectDir;
  let fakeBinDir;
  let capturePath;

  beforeEach(() => {
    projectDir = mkdtempSync(path.join(tmpdir(), 'jest-e2e-visual-'));
    fakeBinDir = path.join(projectDir, 'bin');
    capturePath = path.join(projectDir, 'capture.json');

    mkdirSync(path.join(projectDir, '__tests__'));
    mkdirSync(fakeBinDir);

    const fakeNpx = path.join(fakeBinDir, 'npx');
    writeFileSync(fakeNpx, `#!/usr/bin/env node
const fs = require('fs');
const keys = [
  'CI',
  'JEST_E2E_SMOOTH',
  'JEST_E2E_DISABLE_ANIMATIONS',
  'JEST_E2E_ACTION_DELAY',
  'JEST_E2E_TIMEOUT',
  'JEST_FORCE_STEPS',
  'PUPPETEER_SLOWMO',
  'NODE_OPTIONS',
];
fs.writeFileSync(process.env.CAPTURE_FILE, JSON.stringify({
  args: process.argv.slice(2),
  env: Object.fromEntries(keys.map((key) => [key, process.env[key]])),
}, null, 2));
process.exit(0);
`);
    chmodSync(fakeNpx, 0o755);
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  const runCli = (args) => {
    const env = {
      ...process.env,
      PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH}`,
      CAPTURE_FILE: capturePath,
    };
    delete env.JEST_E2E_ACTION_DELAY;
    delete env.JEST_E2E_TIMEOUT;
    delete env.JEST_E2E_SMOOTH;
    delete env.JEST_E2E_DISABLE_ANIMATIONS;
    delete env.PUPPETEER_SLOWMO;

    execFileSync('node', [cliPath, ...args], {
      cwd: projectDir,
      env,
      encoding: 'utf8',
    });

    return JSON.parse(readFileSync(capturePath, 'utf8'));
  };

  test('slowmo uses framework action delay and a visual-mode Jest timeout', () => {
    const capture = runCli(['tavola-cart', '--useLocalBrowser', '--slowmo', '100']);

    expect(capture.args).toEqual(expect.arrayContaining([
      'jest',
      'tavola-cart',
      '--testTimeout=120000',
      '--runInBand',
      '--silent',
    ]));
    expect(capture.env.CI).toBe('false');
    expect(capture.env.JEST_E2E_SMOOTH).toBe('true');
    expect(capture.env.JEST_E2E_DISABLE_ANIMATIONS).toBe('true');
    expect(capture.env.JEST_E2E_ACTION_DELAY).toBe('100');
    expect(capture.env.JEST_FORCE_STEPS).toBe('true');
    expect(capture.env.PUPPETEER_SLOWMO).toBeUndefined();
    expect(capture.env.JEST_E2E_TIMEOUT).toBeUndefined();
  });

  test('explicit timeout still controls both Jest and device auto-wait', () => {
    const capture = runCli(['tavola-cart', '--useLocalBrowser', '--slowmo', '100', '--timeout', '45000']);

    expect(capture.args).toEqual(expect.arrayContaining([
      'jest',
      'tavola-cart',
      '--testTimeout=45000',
      '--runInBand',
    ]));
    expect(capture.env.JEST_E2E_TIMEOUT).toBe('45000');
  });
});
