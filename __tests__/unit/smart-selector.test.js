import { resolveWaitTimeout, smartSelector } from '../../config/device.js';

describe('smartSelector', () => {
  test('converts plain string to data-testid selector', () => {
    expect(smartSelector('submit-button')).toBe('[data-testid="submit-button"]');
  });

  test('converts camelCase string to data-testid', () => {
    expect(smartSelector('loginForm')).toBe('[data-testid="loginForm"]');
  });

  test('passes through class selectors (.class)', () => {
    expect(smartSelector('.my-class')).toBe('.my-class');
  });

  test('passes through ID selectors (#id)', () => {
    expect(smartSelector('#my-id')).toBe('#my-id');
  });

  test('passes through attribute selectors ([attr])', () => {
    expect(smartSelector('[role="button"]')).toBe('[role="button"]');
  });

  test('passes through child combinators (>)', () => {
    expect(smartSelector('div > span')).toBe('div > span');
  });

  test('passes through descendant combinators (space)', () => {
    expect(smartSelector('div span')).toBe('div span');
  });

  test('passes through pseudo selectors (:)', () => {
    expect(smartSelector('input:focus')).toBe('input:focus');
  });

  test('passes through universal selector (*)', () => {
    expect(smartSelector('*')).toBe('*');
  });

  test('passes through common HTML element names', () => {
    const elements = ['body', 'div', 'span', 'button', 'input', 'form', 'h1', 'nav', 'main'];
    elements.forEach((el) => {
      expect(smartSelector(el)).toBe(el);
    });
  });

  test('is case-insensitive for HTML elements', () => {
    expect(smartSelector('DIV')).toBe('DIV');
    expect(smartSelector('Body')).toBe('Body');
  });
});

describe('resolveWaitTimeout', () => {
  afterEach(() => {
    delete global.__JEST_E2E_TIMEOUT__;
  });

  test('returns DEFAULT_WAIT_TIMEOUT (5000) when no options provided', () => {
    expect(resolveWaitTimeout()).toBe(5000);
    expect(resolveWaitTimeout({})).toBe(5000);
  });

  test('prefers waitTimeout over timeout', () => {
    expect(resolveWaitTimeout({ waitTimeout: 3000, timeout: 10000 })).toBe(3000);
  });

  test('falls back to timeout option', () => {
    expect(resolveWaitTimeout({ timeout: 8000 })).toBe(8000);
  });
});

describe('resolveWaitTimeout with global override', () => {
  afterEach(() => {
    delete global.__JEST_E2E_TIMEOUT__;
  });

  test('uses global timeout when set', () => {
    global.__JEST_E2E_TIMEOUT__ = 15000;
    expect(resolveWaitTimeout({})).toBe(15000);
  });

  test('options.waitTimeout still overrides global', () => {
    global.__JEST_E2E_TIMEOUT__ = 15000;
    expect(resolveWaitTimeout({ waitTimeout: 3000 })).toBe(3000);
  });
});
