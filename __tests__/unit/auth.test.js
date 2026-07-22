import { createMockPage } from './helpers/mock-page.js';
import {
  AUTH_GLOBAL,
  applyQueryParams,
  authRuleMatchesUrl,
  prepareAuthenticatedNavigation,
  resolveAuthConfig,
  setGlobalAuthConfig,
} from '../../config/auth.js';

describe('auth configuration', () => {
  afterEach(() => {
    delete global[AUTH_GLOBAL];
  });

  test('builds Vercel bypass headers from the Vercel automation secret', () => {
    const rules = resolveAuthConfig(undefined, {
      VERCEL_AUTOMATION_BYPASS_SECRET: 'vercel-secret',
    });

    expect(rules).toEqual([
      expect.objectContaining({
        provider: 'vercel',
        headers: {
          'x-vercel-protection-bypass': 'vercel-secret',
          'x-vercel-set-bypass-cookie': 'true',
        },
        urlPatterns: ['*.vercel.app', '*.vercel.sh'],
      }),
    ]);
  });

  test('builds generic auth from explicit headers, query params, and cookies', () => {
    const rules = resolveAuthConfig({
      headers: { 'x-api-key': 'automation-key' },
      queryParams: { preview: '1' },
      cookies: { name: 'session', value: 'abc' },
      urlPatterns: ['*.example.com'],
    }, {});

    expect(rules).toEqual([
      expect.objectContaining({
        provider: 'generic',
        headers: { 'x-api-key': 'automation-key' },
        queryParams: { preview: '1' },
        cookies: [{ name: 'session', value: 'abc' }],
        urlPatterns: ['*.example.com'],
      }),
    ]);
  });

  test('builds a generic auth header from environment key settings', () => {
    const rules = resolveAuthConfig(undefined, {
      JEST_E2E_AUTH_HEADER_NAME: 'x-automation-key',
      JEST_E2E_AUTOMATION_KEY: 'generic-secret',
    });

    expect(rules[0].headers).toEqual({
      'x-automation-key': 'generic-secret',
    });
  });

  test('supports Vercel query-param transport', () => {
    const rules = resolveAuthConfig({
      provider: 'vercel',
      token: 'query-secret',
      transport: 'query',
    }, {});

    expect(rules[0].headers).toEqual({});
    expect(rules[0].queryParams).toEqual({
      'x-vercel-protection-bypass': 'query-secret',
      'x-vercel-set-bypass-cookie': 'true',
    });
  });

  test('matches wildcard host patterns', () => {
    const rule = { urlPatterns: ['*.vercel.app'] };
    expect(authRuleMatchesUrl(rule, 'https://genfixs-page.vercel.app/dashboard')).toBe(true);
    expect(authRuleMatchesUrl(rule, 'https://example.com/dashboard')).toBe(false);
  });

  test('applies query parameters without dropping existing params', () => {
    const url = applyQueryParams('https://example.com/path?existing=1', {
      token: 'abc',
      existing: '2',
    });

    expect(url).toBe('https://example.com/path?existing=2&token=abc');
  });
});

describe('prepareAuthenticatedNavigation', () => {
  afterEach(() => {
    delete global[AUTH_GLOBAL];
  });

  test('applies configured headers, cookies, and query params to matching navigations', async () => {
    const page = createMockPage();
    setGlobalAuthConfig({
      headers: { 'x-api-key': 'automation-key' },
      queryParams: { preview: '1' },
      cookies: { name: 'session', value: 'abc' },
      urlPatterns: ['example.com'],
    }, {});

    const result = await prepareAuthenticatedNavigation(page, 'https://example.com/dashboard');

    expect(page.setExtraHTTPHeaders).toHaveBeenCalledWith({
      'x-api-key': 'automation-key',
    });
    expect(page.setCookie).toHaveBeenCalledWith({
      name: 'session',
      value: 'abc',
      url: 'https://example.com',
    });
    expect(result.url).toBe('https://example.com/dashboard?preview=1');
  });

  test('skips auth when navigation auth is disabled', async () => {
    const page = createMockPage();
    setGlobalAuthConfig({
      headers: { 'x-api-key': 'automation-key' },
    }, {});

    const result = await prepareAuthenticatedNavigation(page, 'https://example.com/dashboard', false);

    expect(page.setExtraHTTPHeaders).not.toHaveBeenCalled();
    expect(result.url).toBe('https://example.com/dashboard');
  });

  test('clears auth-managed headers when configured auth does not match the target URL', async () => {
    const page = createMockPage();
    setGlobalAuthConfig({
      headers: { 'x-api-key': 'automation-key' },
      urlPatterns: ['secure.example.com'],
    }, {});

    const result = await prepareAuthenticatedNavigation(page, 'https://public.example.com/dashboard');

    expect(page.setExtraHTTPHeaders).toHaveBeenCalledWith({});
    expect(result.url).toBe('https://public.example.com/dashboard');
  });
});
