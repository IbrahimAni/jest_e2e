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

describe('content assertions poll instead of reading once', () => {
  test('toContain polls via waitForFunction with selector, negate flag, and text', async () => {
    await device.expect('status').toContain('Ready');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 5000 }),
      '[data-testid="status"]',
      false,
      'Ready'
    );
  });

  test('not.toContain passes the negate flag', async () => {
    await device.expect('status').not.toContain('Error');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Object),
      '[data-testid="status"]',
      true,
      'Error'
    );
  });

  test('toHaveText polls until the text matches', async () => {
    await device.expect('cart-qty').toHaveText('2');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Object),
      '[data-testid="cart-qty"]',
      false,
      '2'
    );
  });

  test('toHaveValue polls until the value matches', async () => {
    await device.expect('email').toHaveValue('a@b.c');
    expect(global.page.waitForFunction).toHaveBeenCalled();
  });

  test('failure surfaces the actual value read after the timeout', async () => {
    global.page.waitForFunction.mockRejectedValue(new Error('Timeout'));
    global.page.$eval.mockResolvedValue('actual-value');
    await expect(device.expect('email').toHaveValue('expected-value')).rejects.toThrow(
      /Actual: actual-value/
    );
  });

  test('in-page condition logic works for toContain', async () => {
    await device.expect('status').toContain('Ready');
    const conditionFn = global.page.waitForFunction.mock.calls[0][0];

    global.document = {
      querySelector: () => ({ textContent: 'Status: Ready to go' }),
    };
    expect(conditionFn('sel', false, 'Ready')).toBe(true);
    expect(conditionFn('sel', true, 'Ready')).toBe(false);
    expect(conditionFn('sel', false, 'Missing')).toBe(false);
    expect(conditionFn('sel', true, 'Missing')).toBe(true);
    delete global.document;
  });
});

describe('toHaveCount', () => {
  test('polls the count without requiring the element to exist first', async () => {
    await device.expect('cart-line').toHaveCount(0);
    expect(global.page.waitForSelector).not.toHaveBeenCalled();
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 5000 }),
      '[data-testid="cart-line"]',
      false,
      0
    );
  });

  test('in-page condition compares querySelectorAll length', async () => {
    await device.expect('item').toHaveCount(3);
    const conditionFn = global.page.waitForFunction.mock.calls[0][0];

    global.document = { querySelectorAll: () => [1, 2, 3] };
    expect(conditionFn('sel', false, 3)).toBe(true);
    expect(conditionFn('sel', false, 2)).toBe(false);
    expect(conditionFn('sel', true, 2)).toBe(true);
    delete global.document;
  });

  test('failure includes the actual count', async () => {
    global.page.waitForFunction.mockRejectedValue(new Error('Timeout'));
    global.page.$$.mockResolvedValue([{}, {}]);
    await expect(device.expect('item').toHaveCount(5)).rejects.toThrow(/Actual: 2/);
  });
});
