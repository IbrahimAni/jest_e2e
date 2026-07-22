import { execFileSync } from 'child_process';
import { readFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../../bin/jest-e2e.js');

describe('jest-e2e CLI initialization output', () => {
  let projectDir;

  beforeEach(() => {
    projectDir = mkdtempSync(path.join(tmpdir(), 'jest-e2e-init-output-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  test('keeps automatic initialization output concise', () => {
    const output = execFileSync('node', [cliPath], {
      cwd: projectDir,
      encoding: 'utf8',
    });

    expect(output).toContain('██╗███████╗███████╗████████╗');
    expect(output).toContain('Welcome to Jest E2E');
    expect(output).toContain('Next steps');
    expect(output).toContain('npm run jest-e2e');
    expect(output).not.toContain('Created directory:');
    expect(output).not.toContain('Copied:');
    // Piped output (non-TTY) must stay plain — no ANSI escape codes.
    expect(output).not.toContain('\x1b[');
  });

  test('scaffolds config with optional dotenv support and ignores .env', () => {
    execFileSync('node', [cliPath, 'init'], {
      cwd: projectDir,
      encoding: 'utf8',
    });

    const config = readFileSync(path.join(projectDir, 'jest-e2e.config.js'), 'utf8');
    const gitignore = readFileSync(path.join(projectDir, '.gitignore'), 'utf8');

    expect(config).toContain('// import \'dotenv/config\';');
    expect(config).toContain('npm install --save-dev dotenv');
    expect(config).toContain('process.env.VERCEL_AUTOMATION_BYPASS_SECRET');
    expect(gitignore).toContain('__screenshots__/');
    expect(gitignore).toContain('.env');
  });
});
