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

describe('device.fill()', () => {
  test('waits for the element before filling', async () => {
    await device.fill('reserve-date', '2026-07-10');
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="reserve-date"]',
      expect.objectContaining({ timeout: 5000, visible: true })
    );
  });

  test('sets the value via $eval with the resolved selector', async () => {
    await device.fill('reserve-date', '2026-07-10');
    const fillCall = global.page.$eval.mock.calls.at(-1);
    expect(fillCall[0]).toBe('[data-testid="reserve-date"]');
    expect(typeof fillCall[1]).toBe('function');
    expect(fillCall[2]).toBe('2026-07-10');
  });

  test('stringifies non-string values', async () => {
    await device.fill('reserve-party', 4);
    const fillCall = global.page.$eval.mock.calls.at(-1);
    expect(fillCall[2]).toBe('4');
  });

  test('passes through CSS selectors', async () => {
    await device.fill('#date-input', '2026-01-01');
    const fillCall = global.page.$eval.mock.calls.at(-1);
    expect(fillCall[0]).toBe('#date-input');
  });

  test('respects custom waitTimeout', async () => {
    await device.fill('field', 'x', { waitTimeout: 1234 });
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="field"]',
      expect.objectContaining({ timeout: 1234 })
    );
  });

  test('throws enhanced error when element never appears', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.fill('missing', 'v')).rejects.toThrow(/Fill failed for "missing"/);
  });

  test('fill event dispatch works against a DOM-like element', async () => {
    // Execute the in-page function with a fake element to verify events fire
    await device.fill('field', 'hello');
    const fillCall = global.page.$eval.mock.calls.at(-1);
    const inPageFn = fillCall[1];

    const events = [];
    let setValue;
    const fakeSetter = function (v) { setValue = v; };
    global.window = {
      HTMLInputElement: { prototype: {} },
      HTMLTextAreaElement: { prototype: {} },
      HTMLSelectElement: { prototype: {} },
    };
    Object.defineProperty(global.window.HTMLInputElement.prototype, 'value', {
      set: fakeSetter,
      configurable: true,
    });
    global.Event = class {
      constructor(type, opts) { this.type = type; this.bubbles = opts?.bubbles; }
    };
    const el = {
      tagName: 'INPUT',
      isContentEditable: false,
      focus: () => {},
      dispatchEvent: (e) => events.push(e.type),
    };
    inPageFn(el, 'hello');
    expect(setValue).toBe('hello');
    expect(events).toEqual(['input', 'change']);
    delete global.window;
    delete global.Event;
  });
});

describe('device.clear()', () => {
  test('waits for the element and clears via $eval', async () => {
    await device.clear('email-input');
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="email-input"]',
      expect.objectContaining({ visible: true })
    );
    const clearCall = global.page.$eval.mock.calls.at(-1);
    expect(clearCall[0]).toBe('[data-testid="email-input"]');
    expect(typeof clearCall[1]).toBe('function');
  });

  test('throws enhanced error when element never appears', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.clear('missing')).rejects.toThrow(/Clear failed for "missing"/);
  });
});

describe('device.press()', () => {
  test('waits for element and presses the key on its handle', async () => {
    await device.press('menu-search', 'Enter');
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="menu-search"]',
      expect.objectContaining({ visible: true })
    );
    expect(global.page.$).toHaveBeenCalledWith('[data-testid="menu-search"]');
    const element = await global.page.$.mock.results[0].value;
    expect(element.press).toHaveBeenCalledWith('Enter');
  });

  test('throws enhanced error when element never appears', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.press('missing', 'Enter')).rejects.toThrow(/Press failed for "missing"/);
  });
});
