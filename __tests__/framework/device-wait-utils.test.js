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

describe('device.waitForText()', () => {
  test('calls waitForFunction with correct selector and text', async () => {
    await device.waitForText('heading', 'Welcome');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 5000 }),
      '[data-testid="heading"]',
      'Welcome'
    );
  });

  test('uses smart selector pass-through for CSS selectors', async () => {
    await device.waitForText('.title', 'Hello');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Object),
      '.title',
      'Hello'
    );
  });

  test('respects custom timeout', async () => {
    await device.waitForText('heading', 'text', { timeout: 10000 });
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 10000 }),
      expect.any(String),
      expect.any(String)
    );
  });

  test('throws enhanced error on timeout', async () => {
    global.page.waitForFunction.mockRejectedValue(new Error('Timeout'));
    await expect(device.waitForText('heading', 'Missing')).rejects.toThrow(/WaitForText failed/);
  });
});

describe('device.waitForUrl()', () => {
  test('calls waitForFunction with url pattern', async () => {
    await device.waitForUrl('/dashboard');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 5000 }),
      '/dashboard'
    );
  });

  test('respects custom timeout', async () => {
    await device.waitForUrl('/home', { timeout: 15000 });
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 15000 }),
      '/home'
    );
  });

  test('throws descriptive error on timeout', async () => {
    global.page.waitForFunction.mockRejectedValue(new Error('Timeout'));
    global.page.url.mockReturnValue('https://example.com/login');
    await expect(device.waitForUrl('/dashboard')).rejects.toThrow(/WaitForUrl failed/);
    await expect(device.waitForUrl('/dashboard')).rejects.toThrow(/Current URL: https:\/\/example\.com\/login/);
  });
});
