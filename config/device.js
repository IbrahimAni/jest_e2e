// Device wrapper for clean data-testid interactions and CSS selectors
import { stepLogger } from './step-logger.js';
const DEFAULT_WAIT_TIMEOUT = 5000;

const smartSelector = (selector) => {
  // Common HTML element names that should be treated as CSS selectors
  const htmlElements = ['html', 'body', 'head', 'div', 'span', 'p', 'a', 'img', 'ul', 'li', 'ol', 
                       'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'textarea', 'select', 
                       'option', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'header', 
                       'footer', 'section', 'article', 'main', 'aside'];
  
  // If it starts with common CSS selector patterns, use as-is
  if (selector.startsWith('.') ||     // Class selector (.class)
      selector.startsWith('#') ||     // ID selector (#id)
      selector.includes('[') ||       // Attribute selector ([attr="value"] or a[href="..."])
      selector.includes('>') ||       // Child combinator (div > span)
      selector.includes(' ') ||       // Descendant combinator (div span)
      selector.includes(':') ||       // Pseudo selectors (input:focus)
      selector.includes('*') ||       // Universal selector
      htmlElements.includes(selector.toLowerCase())) {  // HTML element names
    return selector;
  }
  // Otherwise, treat as data-testid value
  return `[data-testid="${selector}"]`;
};

const getDefaultTimeout = () => global.__JEST_E2E_TIMEOUT__ || DEFAULT_WAIT_TIMEOUT;
const resolveWaitTimeout = (options = {}) => options.waitTimeout || options.timeout || getDefaultTimeout();
const isSmoothModeEnabled = () => global.__JEST_E2E_SMOOTH__ === true || process.env.JEST_E2E_SMOOTH === 'true';
const shouldDisableAnimations = () => global.__JEST_E2E_DISABLE_ANIMATIONS__ === true || isSmoothModeEnabled();
const getActionDelay = (options = {}) => {
  if (typeof options.actionDelay === 'number') return options.actionDelay;
  if (typeof options.delay === 'number') return options.delay;
  if (typeof global.__JEST_E2E_ACTION_DELAY__ === 'number') return global.__JEST_E2E_ACTION_DELAY__;
  return isSmoothModeEnabled() ? 30 : 0;
};

const disableAnimationsIfNeeded = async () => {
  if (!shouldDisableAnimations()) return;
  await page.evaluate(() => {
    const id = '__jest_e2e_disable_animations__';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  });
};

const ensureActionable = async (resolvedSelector, timeout) => {
  await page.waitForSelector(resolvedSelector, { timeout, visible: true });
  await page.$eval(resolvedSelector, (el) => {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
  });
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
      return (
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        rect.width > 0 &&
        rect.height > 0 &&
        !disabled
      );
    },
    { timeout },
    resolvedSelector
  );
};

const enhanceError = async (error, selector, resolvedSelector, action) => {
  let currentUrl = 'unknown';
  let availableTestIds = [];

  try {
    currentUrl = page.url();
    availableTestIds = await page.$$eval('[data-testid]', (elements) =>
      elements.map((el) => el.getAttribute('data-testid'))
    );
  } catch (_) {
    // Page may not be available
  }

  const enhanced = new Error(
    `${action} failed for "${selector}" (resolved to "${resolvedSelector}")\n` +
      `  Page URL: ${currentUrl}\n` +
      `  Available data-testid values: [${availableTestIds.map((id) => `"${id}"`).join(', ')}]\n` +
      `  Original error: ${error.message}`
  );
  enhanced.stack = error.stack;
  throw enhanced;
};

const truncate = (text, maxLength = 200) => {
  if (typeof text !== 'string') return String(text);
  // Collapse whitespace (newlines, tabs, multiple spaces) into single spaces
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + `... (${cleaned.length} chars total)`;
};

const cleanUserStack = (stack) => {
  if (!stack || typeof stack !== 'string') return '';
  const lines = stack
    .split('\n')
    .slice(1)
    .filter((line) =>
      !line.includes('config/device.js') &&
      !line.includes('config/globals.js')
    );
  return lines.join('\n');
};

const formatActualForError = (selector, actual) => {
  if (typeof actual === 'undefined') return '';
  if (selector === 'body' || selector === 'html') {
    // Keep body/html output informative but bounded.
    return truncate(actual, 300);
  }
  return truncate(actual);
};

const enhanceAssertionError = async (error, selector, resolvedSelector, assertion, expected, actual, callerStack) => {
  let currentUrl = 'unknown';
  try {
    currentUrl = page.url();
  } catch (_) {
    // Page may not be available
  }

  const expectedLine = typeof expected === 'undefined' ? '' : `\n  Expected: ${expected}`;
  const actualLine = typeof actual === 'undefined' ? '' : `\n  Actual: ${formatActualForError(selector, actual)}`;
  const enhanced = new Error(
    `Assertion "${assertion}" failed for "${selector}" (resolved to "${resolvedSelector}")` +
      expectedLine +
      actualLine +
      `\n  Page URL: ${currentUrl}\n` +
      `  Original error: ${error.message}`
  );
  const userStack = cleanUserStack(callerStack);
  if (userStack) {
    enhanced.stack = `${enhanced.name}: ${enhanced.message}\n${userStack}`;
  } else {
    enhanced.stack = error.stack;
  }
  throw enhanced;
};

const device = {
  // Navigation
  navigate: async (url, options = {}) => {
    stepLogger.step('Navigating', `to ${url}`);
    const result = await page.goto(url, options);
    await disableAnimationsIfNeeded();
    return result;
  },
  
  // Interactions - supports both data-testid values and CSS selectors
  click: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const actionDelay = getActionDelay(options);
    const { waitTimeout: _waitTimeout, actionDelay: _actionDelay, ...clickOptions } = options;
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Clicking', `"${displaySelector}"`);
    try {
      await disableAnimationsIfNeeded();
      await ensureActionable(resolved, waitTimeout);
      if (actionDelay > 0 && typeof clickOptions.delay !== 'number') {
        clickOptions.delay = actionDelay;
      }
      const result = await page.click(resolved, clickOptions);
      return result;
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Click');
    }
  },

  type: async (selector, text, options = {}) => {
    const resolved = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const actionDelay = getActionDelay(options);
    const { waitTimeout: _waitTimeout, actionDelay: _actionDelay, ...typeOptions } = options;
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    const displayText = text.length > 20 ? text.substring(0, 20) + '...' : text;
    stepLogger.step('Typing', `"${displayText}" into "${displaySelector}"`);
    try {
      await disableAnimationsIfNeeded();
      await ensureActionable(resolved, waitTimeout);
      if (actionDelay > 0 && typeof typeOptions.delay !== 'number') {
        typeOptions.delay = actionDelay;
      }
      const result = await page.type(resolved, text, typeOptions);
      return result;
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Type');
    }
  },

  select: async (selector, value, options = {}) => {
    const resolved = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Selecting', `"${value}" from "${displaySelector}"`);
    try {
      await disableAnimationsIfNeeded();
      await ensureActionable(resolved, waitTimeout);
      const values = Array.isArray(value) ? value : [value];
      const result = await page.select(resolved, ...values);
      return result;
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Select');
    }
  },

  hover: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Hovering', `"${displaySelector}"`);
    try {
      await disableAnimationsIfNeeded();
      await ensureActionable(resolved, waitTimeout);
      const result = await page.hover(resolved);
      return result;
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Hover');
    }
  },
  
  // Waiting
  waitFor: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const { waitTimeout: _waitTimeout, ...waitOptions } = options;
    const timeout = resolveWaitTimeout(options);
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Waiting for', `"${displaySelector}"`);
    try {
      const result = await page.waitForSelector(resolved, { ...waitOptions, timeout });
      return result;
    } catch (error) {
      await enhanceError(error, selector, resolved, 'WaitFor');
    }
  },
  
  // Element queries
  get: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const timeout = resolveWaitTimeout(options);
    stepLogger.step('Getting element', `"${selector}"`);
    try {
      await page.waitForSelector(resolved, { timeout });
      return await page.$(resolved);
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Get');
    }
  },
  getAll: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const timeout = resolveWaitTimeout(options);
    stepLogger.step('Getting all elements', `"${selector}"`);
    try {
      await page.waitForSelector(resolved, { timeout });
      return await page.$$(resolved);
    } catch (error) {
      await enhanceError(error, selector, resolved, 'GetAll');
    }
  },
  getText: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const timeout = resolveWaitTimeout(options);
    stepLogger.step('Getting text from', `"${selector}"`);
    try {
      await page.waitForSelector(resolved, { timeout });
      return await page.$eval(resolved, (el) => el.textContent);
    } catch (error) {
      await enhanceError(error, selector, resolved, 'GetText');
    }
  },
  getValue: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const timeout = resolveWaitTimeout(options);
    stepLogger.step('Getting value from', `"${selector}"`);
    try {
      await page.waitForSelector(resolved, { timeout });
      return await page.$eval(resolved, (el) => el.value);
    } catch (error) {
      await enhanceError(error, selector, resolved, 'GetValue');
    }
  },
  
  // Element state checks
  exists: async (selector) => {
    stepLogger.step('Checking if exists', `"${selector}"`);
    const element = await page.$(smartSelector(selector));
    return element !== null;
  },
  
  isVisible: async (selector) => {
    stepLogger.step('Checking if visible', `"${selector}"`);
    const element = await page.$(smartSelector(selector));
    return element ? await element.isIntersectingViewport() : false;
  },
  
  // Fluent expectation API with .not support
  expect: (selector, options = {}) => {
    const resolvedSelector = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const callerStack = new Error().stack;
    
    const createAssertions = (negate = false) => ({
      // Text content assertions
      toContain: async (expectedText) => {
        stepLogger.step('Verifying text', `"${selector}" ${negate ? 'does not contain' : 'contains'} "${expectedText}"`);
        let text;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          text = await page.$eval(resolvedSelector, (el) => el.textContent);
          const contains = text.includes(expectedText);
          if (negate && contains) {
            throw new Error(`Expected text to NOT contain "${expectedText}" but it was found`);
          } else if (!negate && !contains) {
            throw new Error(`Expected text to contain "${expectedText}" but it was not found`);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to contain "${expectedText}"`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toContain', expected, text, callerStack);
        }
      },
      
      toHaveText: async (expectedText) => {
        stepLogger.step('Verifying exact text', `"${selector}" ${negate ? 'does not equal' : 'equals'} "${expectedText}"`);
        let text;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          text = await page.$eval(resolvedSelector, (el) => el.textContent.trim());
          if (negate && text === expectedText) {
            throw new Error(`Expected text to NOT equal "${expectedText}" but it did`);
          } else if (!negate && text !== expectedText) {
            throw new Error(`Expected text to equal "${expectedText}" but got different text`);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to equal "${expectedText}"`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveText', expected, text, callerStack);
        }
      },
      
      // Visibility assertions
      toBeVisible: async () => {
        stepLogger.step('Verifying', `"${selector}" ${negate ? 'is not visible' : 'is visible'}`);
        let isVisible;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          const element = await page.$(resolvedSelector);
          if (negate) {
            if (element) {
              isVisible = await element.isIntersectingViewport();
              expect(isVisible).toBe(false);
            } else {
              expect(element).toBe(null); // Element doesn't exist, so not visible
            }
          } else {
            expect(element).toBeTruthy();
            isVisible = await element.isIntersectingViewport();
            expect(isVisible).toBe(true);
          }
        } catch (error) {
          const expected = negate ? 'to be not visible' : 'to be visible';
          await enhanceAssertionError(error, selector, resolvedSelector, 'toBeVisible', expected, isVisible, callerStack);
        }
      },
      
      // Existence assertions
      toExist: async () => {
        stepLogger.step('Verifying', `"${selector}" ${negate ? 'does not exist' : 'exists'}`);
        let exists;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          const element = await page.$(resolvedSelector);
          exists = element !== null;
          if (negate) {
            expect(element).toBe(null);
          } else {
            expect(element).toBeTruthy();
          }
        } catch (error) {
          const expected = negate ? 'to not exist' : 'to exist';
          await enhanceAssertionError(error, selector, resolvedSelector, 'toExist', expected, exists, callerStack);
        }
      },
      
      // Value assertions (for inputs)
      toHaveValue: async (expectedValue) => {
        stepLogger.step('Verifying value', `"${selector}" ${negate ? 'does not equal' : 'equals'} "${expectedValue}"`);
        let value;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          value = await page.$eval(resolvedSelector, (el) => el.value);
          if (negate) {
            expect(value).not.toBe(expectedValue);
          } else {
            expect(value).toBe(expectedValue);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to equal "${expectedValue}"`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveValue', expected, value, callerStack);
        }
      },
      
      // Attribute assertions
      toHaveAttribute: async (attributeName, expectedValue) => {
        stepLogger.step('Verifying attribute', `"${selector}" ${attributeName}=${expectedValue}`);
        let value;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          value = await page.$eval(resolvedSelector, (el, attr) => el.getAttribute(attr), attributeName);
          if (negate) {
            expect(value).not.toBe(expectedValue);
          } else {
            expect(value).toBe(expectedValue);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to have attribute "${attributeName}"="${expectedValue}"`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveAttribute', expected, value, callerStack);
        }
      },
      
      // Class assertions
      toHaveClass: async (className) => {
        stepLogger.step('Verifying class', `"${selector}" has class "${className}"`);
        let classes;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          classes = await page.$eval(resolvedSelector, (el) => el.className);
          if (negate) {
            expect(classes).not.toContain(className);
          } else {
            expect(classes).toContain(className);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to contain class "${className}"`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveClass', expected, classes, callerStack);
        }
      },
      
      // Count assertions
      toHaveCount: async (expectedCount) => {
        stepLogger.step('Verifying count', `"${selector}" has ${expectedCount} elements`);
        let actualCount;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          const elements = await page.$$(resolvedSelector);
          actualCount = elements.length;
          if (negate) {
            expect(elements.length).not.toBe(expectedCount);
          } else {
            expect(elements.length).toBe(expectedCount);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to have count ${expectedCount}`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveCount', expected, actualCount, callerStack);
        }
      }
    });

    const assertions = createAssertions(false);
    
    // Add the .not modifier
    assertions.not = createAssertions(true);
    
    return assertions;
  },
  
  // Raw CSS selector methods (for explicit CSS usage)
  css: {
    click: (selector, options = {}) => {
      stepLogger.step('CSS Click', `"${selector}"`);
      return page.click(selector, options);
    },
    type: (selector, text, options = {}) => {
      stepLogger.step('CSS Type', `"${text}" into "${selector}"`);
      return page.type(selector, text, options);
    },
    waitFor: (selector, options = {}) => {
      stepLogger.step('CSS Wait for', `"${selector}"`);
      return page.waitForSelector(selector, options);
    },
    get: (selector) => {
      stepLogger.step('CSS Get', `"${selector}"`);
      return page.$(selector);
    },
    getAll: (selector) => {
      stepLogger.step('CSS Get All', `"${selector}"`);
      return page.$$(selector);
    },
    getText: (selector) => {
      stepLogger.step('CSS Get Text from', `"${selector}"`);
      return page.$eval(selector, el => el.textContent);
    },
    exists: async (selector) => {
      stepLogger.step('CSS Check exists', `"${selector}"`);
      const element = await page.$(selector);
      return element !== null;
    }
  },
  
  // Page utilities
  url: () => {
    stepLogger.step('Getting URL');
    return page.url();
  },
  title: () => {
    stepLogger.step('Getting title');
    return page.title();
  },
  content: () => {
    stepLogger.step('Getting page content');
    return page.content();
  },
  evaluate: (fn) => {
    stepLogger.step('Evaluating JavaScript');
    return page.evaluate(fn);
  },
  screenshot: (options = {}) => {
    stepLogger.step('Taking screenshot');
    return page.screenshot(options);
  },
  
  // Wait utilities
  wait: async (ms) => {
    stepLogger.step('Waiting', `${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  waitForNavigation: (options = {}) => {
    stepLogger.step('Waiting for navigation');
    return page.waitForNavigation(options);
  },
  waitForText: async (selector, text, options = {}) => {
    const resolved = smartSelector(selector);
    const timeout = resolveWaitTimeout(options);
    stepLogger.step('Waiting for text', `"${text}" in "${selector}"`);
    try {
      await page.waitForFunction(
        (sel, txt) => {
          const el = document.querySelector(sel);
          return el && el.textContent.includes(txt);
        },
        { timeout },
        resolved,
        text
      );
    } catch (error) {
      await enhanceError(error, selector, resolved, 'WaitForText');
    }
  },
  waitForUrl: async (urlPattern, options = {}) => {
    const timeout = resolveWaitTimeout(options);
    stepLogger.step('Waiting for URL', `"${urlPattern}"`);
    try {
      await page.waitForFunction(
        (pattern) => window.location.href.includes(pattern),
        { timeout },
        urlPattern
      );
    } catch (error) {
      let currentUrl = 'unknown';
      try {
        currentUrl = page.url();
      } catch (_) {
        // Page may not be available
      }
      const enhanced = new Error(
        `WaitForUrl failed: URL did not match "${urlPattern}" within ${timeout}ms\n` +
          `  Current URL: ${currentUrl}\n` +
          `  Original error: ${error.message}`
      );
      enhanced.stack = error.stack;
      throw enhanced;
    }
  }
};

export { device, smartSelector, resolveWaitTimeout, enhanceError }; 
