import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

describe('jest-e2e CLI retries option', () => {
  test('help output documents --retries option', () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const cliPath = path.resolve(__dirname, '../../bin/jest-e2e.js');

    const output = execFileSync('node', [cliPath, '--help'], {
      encoding: 'utf8',
      env: { ...process.env },
    });

    expect(output).toContain('--retries <n>');
    expect(output).toContain('Retry failed tests n times');
  });
});
