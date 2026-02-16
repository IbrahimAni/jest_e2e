import { jest } from '@jest/globals';
import { E2ESetup } from '../../config/e2e-setup.js';

describe('screenshot on failure', () => {
  let registeredAfterEach = [];
  const originalBeforeEach = global.beforeEach;
  const originalAfterEach = global.afterEach;
  const originalBeforeAll = global.beforeAll;
  const originalAfterAll = global.afterAll;
  const originalPage = global.page;
  const originalJasmine = global.jasmine;
  let consoleSpy;

  beforeEach(() => {
    registeredAfterEach = [];
    global.beforeEach = jest.fn();
    global.afterEach = jest.fn((fn) => {
      registeredAfterEach.push(fn);
    });
    global.beforeAll = jest.fn();
    global.afterAll = jest.fn();
    global.page = {
      screenshot: jest.fn().mockResolvedValue(Buffer.from('')),
    };
    global.jasmine = {
      currentTest: { failedExpectations: [] },
    };
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    global.beforeEach = originalBeforeEach;
    global.afterEach = originalAfterEach;
    global.beforeAll = originalBeforeAll;
    global.afterAll = originalAfterAll;
    global.page = originalPage;
    global.jasmine = originalJasmine;
    consoleSpy.mockRestore();
  });

  test('registers screenshot hook by default', () => {
    E2ESetup({});
    expect(registeredAfterEach.length).toBe(2);
  });

  test('does not register screenshot hook when screenshotOnFailure is false', () => {
    E2ESetup({ screenshotOnFailure: false });
    expect(registeredAfterEach.length).toBe(1);
  });

  test('takes screenshot when jasmine reports failure', async () => {
    global.jasmine.currentTest.failedExpectations = [{ message: 'some failure' }];
    E2ESetup({});

    for (const fn of registeredAfterEach) {
      await fn();
    }

    expect(global.page.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        fullPage: true,
        path: expect.stringContaining('__screenshots__'),
      })
    );
  });

  test('does not take screenshot when test passes', async () => {
    global.jasmine.currentTest.failedExpectations = [];
    E2ESetup({});

    for (const fn of registeredAfterEach) {
      await fn();
    }

    expect(global.page.screenshot).not.toHaveBeenCalled();
  });

  test('does not crash when page screenshot fails', async () => {
    global.jasmine.currentTest.failedExpectations = [{ message: 'fail' }];
    global.page.screenshot.mockRejectedValue(new Error('detached'));
    E2ESetup({});

    await expect((async () => {
      for (const fn of registeredAfterEach) {
        await fn();
      }
    })()).resolves.toBeUndefined();
  });
});
