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

describe('expect().toExist()', () => {
  test('passes when the element appears', async () => {
    await expect(device.expect('cart-badge').toExist()).resolves.toBeUndefined();
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="cart-badge"]',
      expect.objectContaining({ timeout: 5000 })
    );
  });

  test('fails with enhanced error when the element never appears', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.expect('missing').toExist()).rejects.toThrow(/toExist.*failed for "missing"/);
  });
});

describe('expect().not.toExist()', () => {
  test('passes when the element is absent (waits for absence)', async () => {
    // waitForFunction resolves => element gone
    await expect(device.expect('cart-badge').not.toExist()).resolves.toBeUndefined();
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 5000 }),
      '[data-testid="cart-badge"]'
    );
    // Crucially, it must NOT wait for the element to appear first
    expect(global.page.waitForSelector).not.toHaveBeenCalled();
  });

  test('fails with enhanced error when the element still exists', async () => {
    global.page.waitForFunction.mockRejectedValue(new Error('Timeout'));
    await expect(device.expect('cart-badge').not.toExist()).rejects.toThrow(
      /Assertion "toExist" failed for "cart-badge"/
    );
    await expect(device.expect('cart-badge').not.toExist()).rejects.toThrow(/to not exist/);
  });
});

describe('expect().toBeVisible()', () => {
  test('waits for the element to be visible', async () => {
    await expect(device.expect('modal').toBeVisible()).resolves.toBeUndefined();
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="modal"]',
      expect.objectContaining({ visible: true, timeout: 5000 })
    );
  });

  test('fails with enhanced error when the element never becomes visible', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.expect('modal').toBeVisible()).rejects.toThrow(/toBeVisible.*failed for "modal"/);
  });
});

describe('expect().not.toBeVisible()', () => {
  test('passes when the element is hidden or absent', async () => {
    await expect(device.expect('spinner').not.toBeVisible()).resolves.toBeUndefined();
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="spinner"]',
      expect.objectContaining({ hidden: true, timeout: 5000 })
    );
  });

  test('fails with enhanced error when the element stays visible', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.expect('spinner').not.toBeVisible()).rejects.toThrow(/to be not visible/);
  });
});
