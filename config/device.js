// Device wrapper for clean data-testid interactions and CSS selectors
import { stepLogger } from './step-logger.js';

const smartSelector = (selector) => {
  // Common HTML element names that should be treated as CSS selectors
  const htmlElements = ['html', 'body', 'head', 'div', 'span', 'p', 'a', 'img', 'ul', 'li', 'ol', 
                       'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'textarea', 'select', 
                       'option', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'header', 
                       'footer', 'section', 'article', 'main', 'aside'];
  
  // If it starts with common CSS selector patterns, use as-is
  if (selector.startsWith('.') ||     // Class selector (.class)
      selector.startsWith('#') ||     // ID selector (#id)
      selector.startsWith('[') ||     // Attribute selector ([attr="value"])
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

const device = {
  // Navigation
  navigate: async (url, options = {}) => {
    stepLogger.step('Navigating', `to ${url}`);
    const result = await page.goto(url, options);
    return result;
  },
  
  // Interactions - supports both data-testid values and CSS selectors
  click: async (selector, options = {}) => {
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Clicking', `"${displaySelector}"`);
    const result = await page.click(smartSelector(selector), options);
    return result;
  },

  type: async (selector, text, options = {}) => {
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    const displayText = text.length > 20 ? text.substring(0, 20) + '...' : text;
    stepLogger.step('Typing', `"${displayText}" into "${displaySelector}"`);
    const result = await page.type(smartSelector(selector), text, options);
    return result;
  },

  select: async (selector, value, options = {}) => {
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Selecting', `"${value}" from "${displaySelector}"`);
    const result = await page.select(smartSelector(selector), value, options);
    return result;
  },
  
  // Waiting
  waitFor: async (selector, options = {}) => {
    const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    stepLogger.step('Waiting for', `"${displaySelector}"`);
    const result = await page.waitForSelector(smartSelector(selector), options);
    return result;
  },
  
  // Element queries
  get: (selector) => {
    stepLogger.step('Getting element', `"${selector}"`);
    return page.$(smartSelector(selector));
  },
  getAll: (selector) => {
    stepLogger.step('Getting all elements', `"${selector}"`);
    return page.$$(smartSelector(selector));
  },
  getText: async (selector) => {
    stepLogger.step('Getting text from', `"${selector}"`);
    return page.$eval(smartSelector(selector), el => el.textContent);
  },
  getValue: async (selector) => {
    stepLogger.step('Getting value from', `"${selector}"`);
    return page.$eval(smartSelector(selector), el => el.value);
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
  expect: (selector) => {
    const resolvedSelector = smartSelector(selector);
    
    const createAssertions = (negate = false) => ({
      // Text content assertions
      toContain: async (expectedText) => {
        stepLogger.step('Verifying text', `"${selector}" ${negate ? 'does not contain' : 'contains'} "${expectedText}"`);
        const text = await page.$eval(resolvedSelector, el => el.textContent);
        if (negate) {
          expect(text).not.toContain(expectedText);
        } else {
          expect(text).toContain(expectedText);
        }
      },
      
      toHaveText: async (expectedText) => {
        stepLogger.step('Verifying exact text', `"${selector}" ${negate ? 'does not equal' : 'equals'} "${expectedText}"`);
        const text = await page.$eval(resolvedSelector, el => el.textContent.trim());
        if (negate) {
          expect(text).not.toBe(expectedText);
        } else {
          expect(text).toBe(expectedText);
        }
      },
      
      // Visibility assertions
      toBeVisible: async () => {
        stepLogger.step('Verifying', `"${selector}" ${negate ? 'is not visible' : 'is visible'}`);
        const element = await page.$(resolvedSelector);
        if (negate) {
          if (element) {
            const isVisible = await element.isIntersectingViewport();
            expect(isVisible).toBe(false);
          } else {
            expect(element).toBe(null); // Element doesn't exist, so not visible
          }
        } else {
          expect(element).toBeTruthy();
          const isVisible = await element.isIntersectingViewport();
          expect(isVisible).toBe(true);
        }
      },
      
      // Existence assertions
      toExist: async () => {
        stepLogger.step('Verifying', `"${selector}" ${negate ? 'does not exist' : 'exists'}`);
        const element = await page.$(resolvedSelector);
        if (negate) {
          expect(element).toBe(null);
        } else {
          expect(element).toBeTruthy();
        }
      },
      
      // Value assertions (for inputs)
      toHaveValue: async (expectedValue) => {
        stepLogger.step('Verifying value', `"${selector}" ${negate ? 'does not equal' : 'equals'} "${expectedValue}"`);
        const value = await page.$eval(resolvedSelector, el => el.value);
        if (negate) {
          expect(value).not.toBe(expectedValue);
        } else {
          expect(value).toBe(expectedValue);
        }
      },
      
      // Attribute assertions
      toHaveAttribute: async (attributeName, expectedValue) => {
        stepLogger.step('Verifying attribute', `"${selector}" ${attributeName}=${expectedValue}`);
        const value = await page.$eval(resolvedSelector, (el, attr) => el.getAttribute(attr), attributeName);
        if (negate) {
          expect(value).not.toBe(expectedValue);
        } else {
          expect(value).toBe(expectedValue);
        }
      },
      
      // Class assertions
      toHaveClass: async (className) => {
        stepLogger.step('Verifying class', `"${selector}" has class "${className}"`);
        const classes = await page.$eval(resolvedSelector, el => el.className);
        if (negate) {
          expect(classes).not.toContain(className);
        } else {
          expect(classes).toContain(className);
        }
      },
      
      // Count assertions
      toHaveCount: async (expectedCount) => {
        stepLogger.step('Verifying count', `"${selector}" has ${expectedCount} elements`);
        const elements = await page.$$(resolvedSelector);
        if (negate) {
          expect(elements.length).not.toBe(expectedCount);
        } else {
          expect(elements.length).toBe(expectedCount);
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
  }
};

export { device }; 