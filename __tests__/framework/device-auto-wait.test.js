import { createMockPage } from './helpers/mock-page.js';

let device;

beforeAll(async () => {
  process.env.JEST_SILENT = 'true';
  const mod = await import('../../config/device.js');
  device = mod.device;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('device auto-wait behavior', () => {
  test('click waits for selector before clicking', async () => {
    await device.click('submit-btn', { waitTimeout: 1234 });

    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="submit-btn"]',
      expect.objectContaining({ timeout: 1234 })
    );
    expect(global.page.click).toHaveBeenCalledWith('[data-testid="submit-btn"]', {});
  });

  test('type waits for selector before typing', async () => {
    await device.type('email', 'user@example.com');

    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="email"]',
      expect.objectContaining({ timeout: 5000 })
    );
    expect(global.page.type).toHaveBeenCalledWith('[data-testid="email"]', 'user@example.com', {});
  });

  test('hover waits for selector before hovering', async () => {
    await device.hover('menu-item');

    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="menu-item"]',
      expect.objectContaining({ timeout: 5000 })
    );
    expect(global.page.hover).toHaveBeenCalledWith('[data-testid="menu-item"]');
  });

  test('query methods wait for selector', async () => {
    await device.get('field');
    await device.getAll('field');
    await device.getText('field');
    await device.getValue('field');

    expect(global.page.waitForSelector).toHaveBeenCalledTimes(4);
  });

  test('expect assertions wait for selector', async () => {
    await device.expect('status').toContain('mock');
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="status"]',
      { timeout: 5000 }
    );
  });

  test('exists and isVisible do not auto-wait', async () => {
    await device.exists('status');
    await device.isVisible('status');

    expect(global.page.waitForSelector).not.toHaveBeenCalled();
  });
});
