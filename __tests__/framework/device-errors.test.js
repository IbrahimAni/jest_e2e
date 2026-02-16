import { jest } from '@jest/globals';
import { createMockPage } from './helpers/mock-page.js';

let device;
let enhanceError;

beforeAll(async () => {
  process.env.JEST_SILENT = 'true';
  global.page = createMockPage();
  const mod = await import('../../config/device.js');
  device = mod.device;
  enhanceError = mod.enhanceError;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('enhanced error messages', () => {
  test('exports enhanceError helper', () => {
    expect(typeof enhanceError).toBe('function');
  });

  test('click shows selector, resolved selector, and page URL on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    global.page.url.mockReturnValue('https://example.com/login');
    global.page.$$eval.mockResolvedValue(['email-input', 'password-input']);

    await expect(device.click('submit-btn')).rejects.toThrow(/Click failed for "submit-btn"/);
    await expect(device.click('submit-btn')).rejects.toThrow(/resolved to "\[data-testid="submit-btn"\]"/);
    await expect(device.click('submit-btn')).rejects.toThrow(/Page URL: https:\/\/example\.com\/login/);
  });

  test('type shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.type('email', 'test@test.com')).rejects.toThrow(/Type failed/);
  });

  test('select shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.select('dropdown', 'option1')).rejects.toThrow(/Select failed/);
  });

  test('hover shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.hover('menu-item')).rejects.toThrow(/Hover failed/);
  });

  test('getText shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.getText('heading')).rejects.toThrow(/GetText failed/);
  });

  test('assertion failure includes expected and actual values', async () => {
    global.page.$eval.mockResolvedValue('Login page - Please enter your credentials');
    await expect(device.expect('body').toContain('Dashboard')).rejects.toThrow(
      /Assertion "toContain" failed/
    );
    await expect(device.expect('body').toContain('Dashboard')).rejects.toThrow(
      /Expected: to contain "Dashboard"/
    );
    await expect(device.expect('body').toContain('Dashboard')).rejects.toThrow(
      /Actual: Login page - Please enter your credentials/
    );
  });

  test('error includes available data-testid values', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    global.page.$$eval.mockResolvedValue(['login-btn', 'signup-btn']);
    await expect(device.click('submit-btn')).rejects.toThrow(/Available data-testid values/);
  });

  test('error still works when page is unavailable', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    global.page.url.mockImplementation(() => {
      throw new Error('detached');
    });
    await expect(device.click('btn')).rejects.toThrow(/Click failed/);
  });
});

describe('device methods succeed with valid page', () => {
  test('click resolves successfully', async () => {
    await expect(device.click('submit-btn')).resolves.toBeNull();
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="submit-btn"]',
      expect.objectContaining({ timeout: expect.any(Number) })
    );
    expect(global.page.click).toHaveBeenCalledWith('[data-testid="submit-btn"]', {});
  });

  test('type resolves successfully', async () => {
    await expect(device.type('email', 'test@test.com')).resolves.toBeNull();
  });

  test('exists returns true when element found', async () => {
    const result = await device.exists('my-element');
    expect(result).toBe(true);
  });

  test('exists returns false when element not found', async () => {
    global.page.$.mockResolvedValue(null);
    const result = await device.exists('missing');
    expect(result).toBe(false);
  });
});
