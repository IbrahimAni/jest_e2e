import { jest } from '@jest/globals';
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

describe('ChromeE2EApi', () => {
  test('createChromeE2EApi returns an instance with device methods', () => {
    const api = createChromeE2EApi();
    expect(typeof api.click).toBe('function');
    expect(typeof api.type).toBe('function');
    expect(typeof api.navigate).toBe('function');
    expect(typeof api.screenshot).toBe('function');
  });

  test('has Chrome-specific methods', () => {
    const api = createChromeE2EApi();
    expect(typeof api.interceptNetwork).toBe('function');
    expect(typeof api.waitForResponse).toBe('function');
    expect(typeof api.waitForRequest).toBe('function');
    expect(typeof api.addCookie).toBe('function');
    expect(typeof api.clearCookies).toBe('function');
  });
});

describe('interceptNetwork', () => {
  test('enables request interception and registers a request handler', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([]);

    expect(global.page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(global.page.on).toHaveBeenCalledWith('request', expect.any(Function));
  });

  test('backward compatibility: string array blocks matching requests', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork(['analytics.google.com']);

    const handler = global.page.on.mock.calls.find((call) => call[0] === 'request')[1];
    const request = {
      url: () => 'https://analytics.google.com/collect',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };

    handler(request);
    expect(request.abort).toHaveBeenCalled();
    expect(request.continue).not.toHaveBeenCalled();
    expect(request.respond).not.toHaveBeenCalled();
  });

  test('block rule aborts matching requests', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([{ pattern: 'analytics.com', action: 'block' }]);

    const handler = global.page.on.mock.calls.find((call) => call[0] === 'request')[1];
    const request = {
      url: () => 'https://analytics.com/track',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };

    handler(request);
    expect(request.abort).toHaveBeenCalled();
    expect(request.continue).not.toHaveBeenCalled();
  });

  test('mock rule responds with structured JSON by default', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([
      {
        pattern: '/api/users',
        action: 'mock',
        response: { body: { users: [] }, status: 200 },
      },
    ]);

    const handler = global.page.on.mock.calls.find((call) => call[0] === 'request')[1];
    const request = {
      url: () => 'https://example.com/api/users',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };

    handler(request);
    expect(request.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [] }),
        headers: {},
      })
    );
    expect(request.continue).not.toHaveBeenCalled();
  });

  test('mock rule uses string body and custom contentType', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([
      {
        pattern: '/api/health',
        action: 'mock',
        response: { body: 'OK', status: 200, contentType: 'text/plain' },
      },
    ]);

    const handler = global.page.on.mock.calls.find((call) => call[0] === 'request')[1];
    const request = {
      url: () => 'https://example.com/api/health',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };

    handler(request);
    expect(request.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        contentType: 'text/plain',
        body: 'OK',
      })
    );
  });

  test('non-matching requests continue', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([{ pattern: 'analytics.com', action: 'block' }]);

    const handler = global.page.on.mock.calls.find((call) => call[0] === 'request')[1];
    const request = {
      url: () => 'https://example.com/page',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };

    handler(request);
    expect(request.continue).toHaveBeenCalled();
    expect(request.abort).not.toHaveBeenCalled();
    expect(request.respond).not.toHaveBeenCalled();
  });

  test('no-op when page is unavailable', async () => {
    global.page = null;
    const api = createChromeE2EApi();
    await expect(api.interceptNetwork([{ pattern: 'x', action: 'block' }])).resolves.toBeUndefined();
  });
});

describe('simulateTouch', () => {
  test('enables touch emulation via CDP', async () => {
    const api = createChromeE2EApi();
    const cdpSession = await global.page.target().createCDPSession();
    const sendSpy = jest.spyOn(cdpSession, 'send');

    await api.simulateTouch();

    expect(sendSpy).toHaveBeenCalledWith('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5,
    });
  });

  test('does nothing when page is null', async () => {
    global.page = null;
    const api = createChromeE2EApi();
    await expect(api.simulateTouch()).resolves.toBeUndefined();
  });
});

describe('tap', () => {
  test('calls page.tap with selector', async () => {
    const api = createChromeE2EApi();
    await api.tap('#my-button');
    expect(global.page.tap).toHaveBeenCalledWith('#my-button');
  });

  test('does nothing when page is null', async () => {
    global.page = null;
    const api = createChromeE2EApi();
    await expect(api.tap('#x')).resolves.toBeUndefined();
  });
});
