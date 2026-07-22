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

describe('device navigation utilities', () => {
  afterEach(() => {
    delete global.__JEST_E2E_AUTH__;
  });

  test('navigate calls page.goto with url and options', async () => {
    await device.navigate('https://example.com', { waitUntil: 'networkidle0' });
    expect(global.page.goto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'networkidle0' });
  });

  test('navigate applies auth config and strips it from goto options', async () => {
    await device.navigate('https://example.com/dashboard', {
      waitUntil: 'networkidle0',
      auth: {
        headers: { 'x-automation-key': 'abc123' },
      },
    });

    expect(global.page.setExtraHTTPHeaders).toHaveBeenCalledWith({
      'x-automation-key': 'abc123',
    });
    expect(global.page.goto).toHaveBeenCalledWith(
      'https://example.com/dashboard',
      { waitUntil: 'networkidle0' }
    );
  });

  test('goBack calls page.goBack', async () => {
    await device.goBack({ waitUntil: 'networkidle0' });
    expect(global.page.goBack).toHaveBeenCalledWith({ waitUntil: 'networkidle0' });
  });

  test('goForward calls page.goForward', async () => {
    await device.goForward();
    expect(global.page.goForward).toHaveBeenCalledWith({});
  });

  test('refresh calls page.reload', async () => {
    await device.refresh();
    expect(global.page.reload).toHaveBeenCalledWith({});
  });
});
