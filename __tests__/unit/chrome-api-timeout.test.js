import { jest } from '@jest/globals';
import { createChromeE2EApi } from '../../config/chrome-api.js';

describe('ChromeE2EApi timeout defaults', () => {
  beforeEach(() => {
    global.page = {
      waitForResponse: jest.fn().mockResolvedValue(null),
      waitForRequest: jest.fn().mockResolvedValue(null),
    };
  });

  afterEach(() => {
    delete global.__JEST_E2E_TIMEOUT__;
  });

  test('waitForResponse uses global timeout when available', async () => {
    global.__JEST_E2E_TIMEOUT__ = 12000;
    const chrome = createChromeE2EApi();

    await chrome.waitForResponse('/api/users');
    expect(global.page.waitForResponse).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 12000 }
    );
  });

  test('waitForRequest uses global timeout when available', async () => {
    global.__JEST_E2E_TIMEOUT__ = 9000;
    const chrome = createChromeE2EApi();

    await chrome.waitForRequest('/api/orders');
    expect(global.page.waitForRequest).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 9000 }
    );
  });

  test('falls back to 30000 when global timeout is not set', async () => {
    delete global.__JEST_E2E_TIMEOUT__;
    const chrome = createChromeE2EApi();

    await chrome.waitForResponse('/api/default');
    expect(global.page.waitForResponse).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 30000 }
    );
  });
});
