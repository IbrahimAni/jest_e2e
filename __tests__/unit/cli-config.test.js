import { execFileSync } from 'child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../../bin/jest-e2e.js');

describe('jest-e2e CLI config file', () => {
  let projectDir;
  let fakeBinDir;
  let capturePath;

  beforeEach(() => {
    projectDir = mkdtempSync(path.join(tmpdir(), 'jest-e2e-config-'));
    fakeBinDir = path.join(projectDir, 'bin');
    capturePath = path.join(projectDir, 'capture.json');

    mkdirSync(path.join(projectDir, '__tests__'));
    mkdirSync(fakeBinDir);

    const fakeNpx = path.join(fakeBinDir, 'npx');
    writeFileSync(fakeNpx, `#!/usr/bin/env node
const fs = require('fs');
fs.writeFileSync(process.env.CAPTURE_FILE, JSON.stringify({
  args: process.argv.slice(2),
  authConfig: process.env.JEST_E2E_AUTH_CONFIG,
}, null, 2));
process.exit(0);
`);
    chmodSync(fakeNpx, 0o755);
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  const runCli = (extraEnv = {}) => {
    const env = {
      ...process.env,
      ...extraEnv,
      PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH}`,
      CAPTURE_FILE: capturePath,
    };

    execFileSync('node', [cliPath], {
      cwd: projectDir,
      env,
      encoding: 'utf8',
    });

    return JSON.parse(readFileSync(capturePath, 'utf8'));
  };

  test('passes auth from jest-e2e.config.cjs to the Jest process', () => {
    writeFileSync(path.join(projectDir, 'jest-e2e.config.cjs'), `
module.exports = {
  auth: {
    provider: 'vercel',
    token: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    urlPatterns: ['*.vercel.app'],
  },
};
`);

    const capture = runCli({
      VERCEL_AUTOMATION_BYPASS_SECRET: 'secret-from-config-env',
    });

    expect(capture.args).toEqual(expect.arrayContaining(['jest', '--silent']));
    expect(JSON.parse(capture.authConfig)).toEqual({
      provider: 'vercel',
      token: 'secret-from-config-env',
      urlPatterns: ['*.vercel.app'],
    });
  });

  test('does not overwrite an explicit JEST_E2E_AUTH_CONFIG env var', () => {
    writeFileSync(path.join(projectDir, 'jest-e2e.config.cjs'), `
module.exports = {
  auth: {
    headers: { 'x-config-key': 'from-config' },
  },
};
`);

    const explicitAuth = JSON.stringify({
      headers: { 'x-env-key': 'from-env' },
    });
    const capture = runCli({ JEST_E2E_AUTH_CONFIG: explicitAuth });

    expect(capture.authConfig).toBe(explicitAuth);
  });
});
