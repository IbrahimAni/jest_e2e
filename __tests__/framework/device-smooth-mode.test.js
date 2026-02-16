import { createMockPage } from './helpers/mock-page.js';

let device;

beforeAll(async () => {
  process.env.JEST_SILENT = 'true';
  const mod = await import('../../config/device.js');
  device = mod.device;
});

beforeEach(() => {
  global.page = createMockPage();
  delete global.__JEST_E2E_SMOOTH__;
  delete global.__JEST_E2E_ACTION_DELAY__;
  delete global.__JEST_E2E_DISABLE_ANIMATIONS__;
});

describe('device smooth mode', () => {
  test('click uses actionability checks before clicking', async () => {
    await device.click('submit-btn');
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="submit-btn"]',
      expect.objectContaining({ timeout: expect.any(Number), visible: true })
    );
    expect(global.page.waitForFunction).toHaveBeenCalled();
    expect(global.page.$eval).toHaveBeenCalledWith(
      '[data-testid="submit-btn"]',
      expect.any(Function)
    );
  });

  test('smooth mode applies default action delay to click/type', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    global.__JEST_E2E_ACTION_DELAY__ = 40;

    await device.click('submit-btn');
    await device.type('email', 'abc');

    expect(global.page.click).toHaveBeenCalledWith(
      '[data-testid="submit-btn"]',
      expect.objectContaining({ delay: 40 })
    );
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="email"]',
      'abc',
      expect.objectContaining({ delay: 40 })
    );
  });

  test('explicit delay in options overrides smooth default', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    global.__JEST_E2E_ACTION_DELAY__ = 40;

    await device.type('email', 'abc', { delay: 5 });
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="email"]',
      'abc',
      expect.objectContaining({ delay: 5 })
    );
  });

  test('disables animations when smooth mode is enabled', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    await device.click('submit-btn');
    expect(global.page.evaluate).toHaveBeenCalledWith(expect.any(Function));
  });
});
