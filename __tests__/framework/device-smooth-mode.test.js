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
      expect.any(Function),
      'auto'
    );
  });

  test('non-smooth mode clicks via page.click and never moves the mouse', async () => {
    await device.click('submit-btn');
    expect(global.page.click).toHaveBeenCalledWith('[data-testid="submit-btn"]', {});
    expect(global.page.mouse.move).not.toHaveBeenCalled();
    expect(global.page.mouse.click).not.toHaveBeenCalled();
  });

  test('smooth mode glides the mouse to the element and clicks through it', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    global.__JEST_E2E_ACTION_DELAY__ = 40;

    await device.click('submit-btn');

    // Element box is x:100 y:200 w:80 h:40 → center (140, 220)
    expect(global.page.mouse.move.mock.calls.length).toBeGreaterThan(2);
    expect(global.page.mouse.move).toHaveBeenLastCalledWith(140, 220);
    expect(global.page.mouse.click).toHaveBeenCalledWith(140, 220,
      expect.objectContaining({ delay: 40 })
    );
    expect(global.page.click).not.toHaveBeenCalled();
  });

  test('smooth mode falls back to page.click when the element has no box', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    const element = await global.page.$();
    element.boundingBox.mockResolvedValue(null);

    await device.click('submit-btn');
    expect(global.page.click).toHaveBeenCalled();
  });

  test('smooth mode clicks the field before typing, then types with delay', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    global.__JEST_E2E_ACTION_DELAY__ = 40;

    await device.type('email', 'abc');

    expect(global.page.mouse.move).toHaveBeenCalled();
    expect(global.page.mouse.click).toHaveBeenCalled();
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="email"]',
      'abc',
      expect.objectContaining({ delay: 40 })
    );
  });

  test('smooth mode scrolls with smooth behavior', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    await device.click('submit-btn');
    expect(global.page.$eval).toHaveBeenCalledWith(
      '[data-testid="submit-btn"]',
      expect.any(Function),
      'smooth'
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

  test('hover glides the mouse in smooth mode', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    await device.hover('menu-item');
    expect(global.page.mouse.move.mock.calls.length).toBeGreaterThan(2);
    expect(global.page.mouse.move).toHaveBeenLastCalledWith(140, 220);
    expect(global.page.hover).not.toHaveBeenCalled();
  });

  test('navigate injects the cursor overlay in smooth mode', async () => {
    global.__JEST_E2E_SMOOTH__ = true;
    await device.navigate('https://example.com');
    // Two evaluate calls: disable-animations style + cursor overlay
    expect(global.page.evaluate.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
