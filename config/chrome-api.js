// Chrome E2E API - Wraps the base device with Chrome-specific functionality
import { device as baseDevice } from './device.js';

class ChromeE2EApi {
  constructor(options = {}) {
    this.options = {
      headless: false,
      devtools: false,
      slowMo: 0,
      viewport: { width: 1280, height: 720 },
      userAgent: null,
      ...options
    };
    
    // Inherit all base device methods
    Object.keys(baseDevice).forEach(method => {
      if (typeof baseDevice[method] === 'function') {
        this[method] = baseDevice[method].bind(baseDevice);
      } else {
        this[method] = baseDevice[method];
      }
    });
  }

  // Chrome-specific navigation with additional options
  async navigate(url, options = {}) {
    const chromeOptions = {
      waitUntil: 'networkidle0',
      timeout: 30000,
      ...options
    };
    return baseDevice.navigate(url, chromeOptions);
  }

  // Enhanced typing with Chrome-specific features
  async type(selector, text, options = {}) {
    const chromeOptions = {
      delay: this.options.slowMo || 0,
      ...options
    };
    return baseDevice.type(selector, text, chromeOptions);
  }

  // Chrome-specific screenshot with enhanced options
  async screenshot(options = {}) {
    const chromeOptions = {
      type: 'png',
      fullPage: false,
      clip: null,
      quality: 90,
      ...options
    };
    return baseDevice.screenshot(chromeOptions);
  }

  // Chrome DevTools specific methods
  async enableDevTools() {
    if (global.page) {
      await global.page.evaluate(() => {
        console.log('Chrome DevTools enabled for E2E testing');
      });
    }
  }

  async getPerformanceMetrics() {
    if (global.page) {
      const metrics = await global.page.metrics();
      return {
        JSHeapUsedSize: metrics.JSHeapUsedSize,
        JSHeapTotalSize: metrics.JSHeapTotalSize,
        firstPaint: metrics.firstPaint,
        firstContentfulPaint: metrics.firstContentfulPaint,
        ...metrics
      };
    }
    return null;
  }

  async interceptNetwork(patterns = []) {
    if (global.page) {
      await global.page.setRequestInterception(true);
      global.page.on('request', (request) => {
        const url = request.url();
        const shouldBlock = patterns.some(pattern => url.includes(pattern));
        
        if (shouldBlock) {
          request.abort();
        } else {
          request.continue();
        }
      });
    }
  }

  async emulateDevice(device) {
    if (global.page && device) {
      await global.page.emulate(device);
    }
  }

  async addCookie(cookie) {
    if (global.page) {
      await global.page.setCookie(cookie);
    }
  }

  async getCookies() {
    if (global.page) {
      return await global.page.cookies();
    }
    return [];
  }

  async clearCookies() {
    if (global.page) {
      const cookies = await global.page.cookies();
      await global.page.deleteCookie(...cookies);
    }
  }

  // Chrome-specific wait methods
  async waitForResponse(urlPattern, timeout = 30000) {
    if (global.page) {
      return global.page.waitForResponse(
        response => response.url().includes(urlPattern),
        { timeout }
      );
    }
  }

  async waitForRequest(urlPattern, timeout = 30000) {
    if (global.page) {
      return global.page.waitForRequest(
        request => request.url().includes(urlPattern),
        { timeout }
      );
    }
  }

  // Enhanced debugging
  async debug(message) {
    if (global.page) {
      await global.page.evaluate((msg) => {
        console.log(`🐛 E2E Debug: ${msg}`);
      }, message);
    }
  }

  async log(level = 'info', message) {
    if (global.page) {
      await global.page.evaluate((lvl, msg) => {
        console[lvl](`📝 E2E Log [${lvl.toUpperCase()}]: ${msg}`);
      }, level, message);
    }
  }

  // Mobile-specific helpers
  async setMobileViewport(width = 375, height = 667) {
    if (global.page) {
      await global.page.setViewport({ width, height, isMobile: true });
    }
  }

  async simulateTouch() {
    if (global.page) {
      await global.page.evaluate(() => {
        // Add touch simulation logic
        const touchSupport = 'ontouchstart' in window;
        if (!touchSupport) {
          // Simulate touch events
          window.TouchEvent = window.TouchEvent || class TouchEvent extends Event {};
        }
      });
    }
  }
}

function createChromeE2EApi(options = {}) {
  return new ChromeE2EApi(options);
}

export { createChromeE2EApi, ChromeE2EApi }; 