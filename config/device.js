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

// Visible cursor overlay for smooth mode: an orange dot that follows the real
// mouse (via mousemove events) and pulses a ripple on every mousedown. Uses
// element.animate() so the disable-animations stylesheet can't zero it out.
const ensureCursorOverlay = async () => {
  if (!isSmoothModeEnabled()) return;
  try {
    await page.evaluate(() => {
      const id = '__jest_e2e_cursor__';
      if (document.getElementById(id)) return;

      const cursor = document.createElement('div');
      cursor.id = id;
      cursor.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'width: 18px',
        'height: 18px',
        'border-radius: 50%',
        'background: rgba(255, 107, 0, 0.45)',
        'border: 2.5px solid #ff6b00',
        'box-shadow: 0 0 6px rgba(255, 107, 0, 0.7)',
        'pointer-events: none',
        'z-index: 2147483647',
        'opacity: 0',
        'transform: translate(-50%, -50%)',
        'will-change: left, top',
      ].join(';');
      document.documentElement.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.opacity = '1';
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }, { capture: true, passive: true });

      window.addEventListener('mousedown', (e) => {
        const ripple = document.createElement('div');
        ripple.style.cssText = [
          'position: fixed',
          `left: ${e.clientX}px`,
          `top: ${e.clientY}px`,
          'width: 14px',
          'height: 14px',
          'border-radius: 50%',
          'border: 3px solid #ff6b00',
          'pointer-events: none',
          'z-index: 2147483646',
          'transform: translate(-50%, -50%)',
        ].join(';');
        document.documentElement.appendChild(ripple);
        ripple.animate(
          [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(3.2)', opacity: 0 },
          ],
          { duration: 420, easing: 'ease-out' }
        ).onfinish = () => ripple.remove();
      }, { capture: true, passive: true });
    });
  } catch (_) {
    // Overlay is cosmetic — never fail an action over it
  }
};

// Briefly flash an orange outline around the action target so the viewer's
// eye lands on the right element before the interaction happens.
const highlightTarget = async (resolvedSelector) => {
  if (!isSmoothModeEnabled()) return;
  try {
    await page.$eval(resolvedSelector, (el) => {
      el.animate(
        [
          { boxShadow: '0 0 0 4px rgba(255, 107, 0, 0.85)' },
          { boxShadow: '0 0 0 4px rgba(255, 107, 0, 0)' },
        ],
        { duration: 550, easing: 'ease-out' }
      );
    });
  } catch (_) {
    // Cosmetic only
  }
};

// Glide the mouse to the element's center with real mousemove events (the
// cursor overlay follows them) and return the target point. Falls back to
// null if the element has no box (e.g. detached mid-animation).
const smoothPointerTo = async (resolvedSelector) => {
  const handle = await page.$(resolvedSelector);
  if (!handle) return null;
  const box = await handle.boundingBox();
  if (!box) return null;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 22 });
  return { x, y };
};

const smoothPause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureActionable = async (resolvedSelector, timeout) => {
  await page.waitForSelector(resolvedSelector, { timeout, visible: true });
  const smooth = isSmoothModeEnabled();
  await page.$eval(resolvedSelector, (el, behavior) => {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior });
  }, smooth ? 'smooth' : 'auto');
  if (smooth) {
    // Let the smooth scroll settle before measuring the element's position
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const key = `${Math.round(rect.x)},${Math.round(rect.y)}`;
        if (el.__jestE2eLastPos === key) return true;
        el.__jestE2eLastPos = key;
        return false;
      },
      { timeout: 2000, polling: 120 },
      resolvedSelector
    ).catch(() => {});
  }
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
    await ensureCursorOverlay();
    return result;
  },
  
  goBack: async (options = {}) => {
    stepLogger.step('Going back');
    const result = await page.goBack(options);
    await disableAnimationsIfNeeded();
    return result;
  },

  goForward: async (options = {}) => {
    stepLogger.step('Going forward');
    const result = await page.goForward(options);
    await disableAnimationsIfNeeded();
    return result;
  },

  refresh: async (options = {}) => {
    stepLogger.step('Refreshing page');
    const result = await page.reload(options);
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
      if (isSmoothModeEnabled()) {
        // Visible flow: highlight the target, glide the cursor to it, then
        // click through the mouse so the overlay ripple fires.
        await ensureCursorOverlay();
        await highlightTarget(resolved);
        const point = await smoothPointerTo(resolved);
        if (point) {
          await smoothPause(120);
          await page.mouse.click(point.x, point.y, {
            delay: typeof clickOptions.delay === 'number' ? clickOptions.delay : 40,
            button: clickOptions.button,
            clickCount: clickOptions.count,
          });
          await smoothPause(80);
          return;
        }
        // Element had no box (mid-transition) — fall through to normal click
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
      if (isSmoothModeEnabled()) {
        // Glide to the field and click it first so the viewer sees where the
        // text is about to go, then type with the per-keystroke delay.
        await ensureCursorOverlay();
        await highlightTarget(resolved);
        const point = await smoothPointerTo(resolved);
        if (point) {
          await page.mouse.click(point.x, point.y, { delay: 30 });
          await smoothPause(100);
        }
      }
      const result = await page.type(resolved, text, typeOptions);
      return result;
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Type');
    }
  },

  // Set a field's value directly (fires input/change events). Unlike type(),
  // this replaces the current value and works with date/time/number inputs
  // where keyboard typing is locale-dependent and flaky.
  fill: async (selector, value, options = {}) => {
    const resolved = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    const displayValue = String(value).length > 20 ? String(value).substring(0, 20) + '...' : String(value);
    stepLogger.step('Filling', `"${displaySelector}" with "${displayValue}"`);
    try {
      await disableAnimationsIfNeeded();
      await ensureActionable(resolved, waitTimeout);
      if (isSmoothModeEnabled()) {
        await ensureCursorOverlay();
        await highlightTarget(resolved);
        const point = await smoothPointerTo(resolved);
        if (point) await smoothPause(120);
      }
      await page.$eval(resolved, (el, val) => {
        el.focus();
        if (el.isContentEditable) {
          el.textContent = val;
        } else {
          const proto = el.tagName === 'SELECT'
            ? window.HTMLSelectElement.prototype
            : el.tagName === 'TEXTAREA'
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, String(value));
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Fill');
    }
  },

  // Clear an input/textarea value
  clear: async (selector, options = {}) => {
    const resolved = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Clearing', `"${displaySelector}"`);
    try {
      await disableAnimationsIfNeeded();
      await ensureActionable(resolved, waitTimeout);
      await page.$eval(resolved, (el) => {
        el.focus();
        if (el.isContentEditable) {
          el.textContent = '';
        } else {
          const proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, '');
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Clear');
    }
  },

  // Press a keyboard key on an element (e.g. 'Enter', 'Escape', 'Tab')
  press: async (selector, key, options = {}) => {
    const resolved = smartSelector(selector);
    const waitTimeout = resolveWaitTimeout(options);
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Pressing', `"${key}" on "${displaySelector}"`);
    try {
      await disableAnimationsIfNeeded();
      await ensureActionable(resolved, waitTimeout);
      const handle = await page.$(resolved);
      await handle.press(key);
    } catch (error) {
      await enhanceError(error, selector, resolved, 'Press');
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
      if (isSmoothModeEnabled()) {
        await ensureCursorOverlay();
        const point = await smoothPointerTo(resolved);
        if (point) {
          await smoothPause(80);
          return;
        }
      }
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
    
    const createAssertions = (negate = false) => {
      // Poll an in-page condition until it holds or the timeout elapses.
      // Content assertions retry instead of reading the DOM once, so an
      // assertion made right after an action tolerates async re-renders.
      const waitForAssertion = (conditionFn, ...args) =>
        page.waitForFunction(conditionFn, { timeout: waitTimeout }, resolvedSelector, negate, ...args);

      const readActual = (extractFn, ...args) =>
        page.$eval(resolvedSelector, extractFn, ...args).catch(() => undefined);

      return {
      // Text content assertions
      toContain: async (expectedText) => {
        stepLogger.step('Verifying text', `"${selector}" ${negate ? 'does not contain' : 'contains'} "${expectedText}"`);
        let text;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          try {
            await waitForAssertion(
              (sel, neg, txt) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const contains = (el.textContent || '').includes(txt);
                return neg ? !contains : contains;
              },
              expectedText
            );
          } catch (_) {
            text = await readActual((el) => el.textContent);
            throw new Error(negate
              ? `Expected text to NOT contain "${expectedText}" but it was found`
              : `Expected text to contain "${expectedText}" but it was not found`);
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
          try {
            await waitForAssertion(
              (sel, neg, txt) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const matches = (el.textContent || '').trim() === txt;
                return neg ? !matches : matches;
              },
              expectedText
            );
          } catch (_) {
            text = await readActual((el) => el.textContent.trim());
            throw new Error(negate
              ? `Expected text to NOT equal "${expectedText}" but it did`
              : `Expected text to equal "${expectedText}" but got different text`);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to equal "${expectedText}"`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveText', expected, text, callerStack);
        }
      },
      
      // Visibility assertions
      toBeVisible: async () => {
        stepLogger.step('Verifying', `"${selector}" ${negate ? 'is not visible' : 'is visible'}`);
        let actual;
        try {
          if (negate) {
            // Passes once the element is absent from the DOM or hidden
            // (display:none / visibility:hidden). Auto-waits like the positive case.
            await page.waitForSelector(resolvedSelector, { hidden: true, timeout: waitTimeout });
          } else {
            await page.waitForSelector(resolvedSelector, { visible: true, timeout: waitTimeout });
          }
        } catch (error) {
          actual = negate ? 'visible' : 'not visible (or missing)';
          const expected = negate ? 'to be not visible' : 'to be visible';
          await enhanceAssertionError(error, selector, resolvedSelector, 'toBeVisible', expected, actual, callerStack);
        }
      },

      // Existence assertions
      toExist: async () => {
        stepLogger.step('Verifying', `"${selector}" ${negate ? 'does not exist' : 'exists'}`);
        let actual;
        try {
          if (negate) {
            // Passes once the element is no longer in the DOM. Auto-waits so
            // assertions right after an action (e.g. remove item) are stable.
            await page.waitForFunction(
              (sel) => !document.querySelector(sel),
              { timeout: waitTimeout },
              resolvedSelector
            );
          } else {
            await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          }
        } catch (error) {
          actual = negate ? 'element still exists' : 'element not found';
          const expected = negate ? 'to not exist' : 'to exist';
          await enhanceAssertionError(error, selector, resolvedSelector, 'toExist', expected, actual, callerStack);
        }
      },
      
      // Value assertions (for inputs)
      toHaveValue: async (expectedValue) => {
        stepLogger.step('Verifying value', `"${selector}" ${negate ? 'does not equal' : 'equals'} "${expectedValue}"`);
        let value;
        try {
          await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
          try {
            await waitForAssertion(
              (sel, neg, expected) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const matches = el.value === expected;
                return neg ? !matches : matches;
              },
              expectedValue
            );
          } catch (_) {
            value = await readActual((el) => el.value);
            throw new Error(negate
              ? `Expected value to NOT equal "${expectedValue}" but it did`
              : `Expected value to equal "${expectedValue}" but got "${value}"`);
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
          try {
            await waitForAssertion(
              (sel, neg, attr, expected) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const matches = el.getAttribute(attr) === expected;
                return neg ? !matches : matches;
              },
              attributeName,
              expectedValue
            );
          } catch (_) {
            value = await readActual((el, attr) => el.getAttribute(attr), attributeName);
            throw new Error(negate
              ? `Expected attribute "${attributeName}" to NOT equal "${expectedValue}" but it did`
              : `Expected attribute "${attributeName}" to equal "${expectedValue}" but got "${value}"`);
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
          try {
            await waitForAssertion(
              (sel, neg, cls) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const has = (el.className || '').includes(cls);
                return neg ? !has : has;
              },
              className
            );
          } catch (_) {
            classes = await readActual((el) => el.className);
            throw new Error(negate
              ? `Expected class list to NOT contain "${className}" but it did`
              : `Expected class list to contain "${className}" but got "${classes}"`);
          }
        } catch (error) {
          const expected = `${negate ? 'not ' : ''}to contain class "${className}"`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveClass', expected, classes, callerStack);
        }
      },

      // Count assertions — polls the count directly so expecting 0 works
      toHaveCount: async (expectedCount) => {
        stepLogger.step('Verifying count', `"${selector}" has ${expectedCount} elements`);
        let actualCount;
        try {
          await waitForAssertion(
            (sel, neg, expected) => {
              const matches = document.querySelectorAll(sel).length === expected;
              return neg ? !matches : matches;
            },
            expectedCount
          );
        } catch (error) {
          try {
            actualCount = (await page.$$(resolvedSelector)).length;
          } catch (_) {
            // Page may not be available
          }
          const expected = `${negate ? 'not ' : ''}to have count ${expectedCount}`;
          await enhanceAssertionError(error, selector, resolvedSelector, 'toHaveCount', expected, actualCount, callerStack);
        }
      }
      };
    };

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
