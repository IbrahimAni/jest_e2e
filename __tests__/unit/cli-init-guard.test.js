import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../../bin/jest-e2e.js');

describe('CLI auto-init guard', () => {
  let emptyDir;

  beforeEach(() => {
    emptyDir = mkdtempSync(path.join(tmpdir(), 'jest-e2e-guard-'));
  });

  afterEach(() => {
    rmSync(emptyDir, { recursive: true, force: true });
  });

  test('refuses to auto-init when a test name is given in a non-project directory', () => {
    let error;
    try {
      execFileSync('node', [cliPath, 'tavola-cart'], {
        cwd: emptyDir,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.status).toBe(1);
    expect(String(error.stderr)).toContain('No Jest E2E project found');
    // Nothing was scaffolded
    expect(existsSync(path.join(emptyDir, '__tests__'))).toBe(false);
    expect(existsSync(path.join(emptyDir, 'package.json'))).toBe(false);
  });
});
