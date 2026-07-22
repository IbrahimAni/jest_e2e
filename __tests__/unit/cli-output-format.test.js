import { execFileSync } from 'child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../../bin/jest-e2e.js');

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

describe('jest-e2e CLI output formatting', () => {
  let projectDir;
  let fakeBinDir;

  beforeEach(() => {
    projectDir = mkdtempSync(path.join(tmpdir(), 'jest-e2e-output-'));
    fakeBinDir = path.join(projectDir, 'bin');

    mkdirSync(path.join(projectDir, '__tests__'));
    mkdirSync(fakeBinDir);
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  const runCliWithFakeJestOutput = (fakeOutput) => {
    const fakeNpx = path.join(fakeBinDir, 'npx');
    writeFileSync(fakeNpx, `#!/usr/bin/env node
${fakeOutput}
process.exit(0);
`);
    chmodSync(fakeNpx, 0o755);

    return execFileSync('node', [cliPath], {
      cwd: projectDir,
      env: {
        ...process.env,
        PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH}`,
      },
      encoding: 'utf8',
    });
  };

  test('shows compact status lines with color only on the status word', () => {
    const output = runCliWithFakeJestOutput(`
console.log('PASS __tests__/tavola-reserve-fill-e2e.js (10.764 s)');
console.log('FAIL /tmp/project/__tests__/tavola-checkout-journey-e2e.js (17.965 s)');
console.log('SKIP __tests__/tavola-cart-e2e.js');
console.log('Test Suites: 2 passed, 2 total');
`);

    expect(output).toContain(`${ANSI.green}Pass${ANSI.reset}: tavola-reserve-fill-e2e.js (10.764 s)`);
    expect(output).toContain(`${ANSI.red}Fail${ANSI.reset}: tavola-checkout-journey-e2e.js (17.965 s)`);
    expect(output).toContain(`${ANSI.yellow}Skip${ANSI.reset}: tavola-cart-e2e.js`);
    expect(output).not.toContain('__tests__/');
    expect(output).not.toContain('Test Suites:');
    expect(output).not.toContain('Jest E2E Test Runner');
    expect(output).not.toContain('Running test:');
    expect(output).not.toContain('Browser mode:');
  });
});
