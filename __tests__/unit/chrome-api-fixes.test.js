import { createMockPage } from './helpers/mock-page.js';

let createChromeE2EApi;

beforeAll(async () => {
  process.env.JEST_SILENT = 'true';
  global.page = createMockPage();
  const mod = await import('../../config/chrome-api.js');
  createChromeE2EApi = mod.createChromeE2EApi;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('screenshot options sanitization', () => {
  test('png screenshots do not include quality or null clip', async () => {
    const api = createChromeE2EApi();
    await api.screenshot();
    const opts = global.page.screenshot.mock.calls[0][0];
    expect(opts.type).toBe('png');
    expect(opts).not.toHaveProperty('quality');
    expect(opts).not.toHaveProperty('clip');
  });

  test('jpeg screenshots default quality to 90', async () => {
    const api = createChromeE2EApi();
    await api.screenshot({ type: 'jpeg' });
    const opts = global.page.screenshot.mock.calls[0][0];
    expect(opts.quality).toBe(90);
  });

  test('explicit quality is preserved for jpeg', async () => {
    const api = createChromeE2EApi();
    await api.screenshot({ type: 'jpeg', quality: 55 });
    const opts = global.page.screenshot.mock.calls[0][0];
    expect(opts.quality).toBe(55);
  });

  test('explicit clip is preserved', async () => {
    const api = createChromeE2EApi();
    const clip = { x: 0, y: 0, width: 10, height: 10 };
    await api.screenshot({ clip });
    const opts = global.page.screenshot.mock.calls[0][0];
    expect(opts.clip).toEqual(clip);
  });
});

describe('type slowMo behavior', () => {
  test('no delay is forced when slowMo is not configured', async () => {
    const api = createChromeE2EApi();
    await api.type('email', 'abc');
    const opts = global.page.type.mock.calls[0][2];
    expect(opts).not.toHaveProperty('delay');
  });

  test('slowMo applies as typing delay when configured', async () => {
    const api = createChromeE2EApi({ slowMo: 50 });
    await api.type('email', 'abc');
    const opts = global.page.type.mock.calls[0][2];
    expect(opts.delay).toBe(50);
  });

  test('explicit delay overrides slowMo', async () => {
    const api = createChromeE2EApi({ slowMo: 50 });
    await api.type('email', 'abc', { delay: 10 });
    const opts = global.page.type.mock.calls[0][2];
    expect(opts.delay).toBe(10);
  });
});

describe('interceptNetwork re-registration', () => {
  test('second call removes the previous request handler', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([{ pattern: 'a.com', action: 'block' }]);
    const firstHandler = global.page.on.mock.calls.find((c) => c[0] === 'request')[1];

    await api.interceptNetwork([{ pattern: 'b.com', action: 'block' }]);
    expect(global.page.off).toHaveBeenCalledWith('request', firstHandler);
    // Two registrations total, but the first was removed
    const registrations = global.page.on.mock.calls.filter((c) => c[0] === 'request');
    expect(registrations).toHaveLength(2);
  });
});
