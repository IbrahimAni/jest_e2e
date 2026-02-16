import { createMockPage } from './helpers/mock-page.js';

let device;

beforeAll(async () => {
  process.env.JEST_SILENT = 'true';
  global.page = createMockPage();
  const mod = await import('../../config/device.js');
  device = mod.device;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('device.type()', () => {
  test('waits for selector before typing', async () => {
    await device.type('email-input', 'sample input');
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="email-input"]',
      expect.objectContaining({ timeout: expect.any(Number) })
    );
  });

  test('types input into resolved selector', async () => {
    await device.type('email-input', 'sample input');
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="email-input"]',
      'sample input',
      {}
    );
  });

  test('passes through typing options except waitTimeout', async () => {
    await device.type('email-input', 'abc', { delay: 25, waitTimeout: 9999 });
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="email-input"]',
      'abc',
      { delay: 25 }
    );
  });

  test('uses smart selector for data-testid', async () => {
    await device.type('my-input', 'text');
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="my-input"]',
      'text',
      expect.any(Object)
    );
  });

  test('passes through CSS selectors', async () => {
    await device.type('#my-input', 'text');
    expect(global.page.type).toHaveBeenCalledWith(
      '#my-input',
      'text',
      expect.any(Object)
    );
  });

  test('throws enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.type('missing', 'text')).rejects.toThrow(/Type failed/);
  });
});
