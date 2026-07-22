import { jest } from '@jest/globals';
import { normalizeAutomationTab } from '../../config/tab-manager.js';

describe('normalizeAutomationTab', () => {
  const originalBrowser = global.browser;
  const originalPage = global.page;

  afterEach(() => {
    global.browser = originalBrowser;
    global.page = originalPage;
  });

  test('reuses first page and closes extra pages', async () => {
    const activePage = { close: jest.fn().mockResolvedValue(undefined) };
    const defaultTab1 = { close: jest.fn().mockResolvedValue(undefined) };
    const defaultTab2 = { close: jest.fn().mockResolvedValue(undefined) };
    global.page = activePage;
    const defaultContext = { kind: 'default' };

    global.browser = {
      pages: jest.fn().mockResolvedValue([defaultTab1, defaultTab2]),
      defaultBrowserContext: jest.fn().mockReturnValue(defaultContext),
    };

    await normalizeAutomationTab();

    expect(activePage.close).toHaveBeenCalledTimes(1);
    expect(defaultTab1.close).not.toHaveBeenCalled();
    expect(defaultTab2.close).toHaveBeenCalledTimes(1);
    expect(global.page).toBe(defaultTab1);
    expect(global.context).toBe(defaultContext);
  });

  test('does not close the active page when it appears in default pages', async () => {
    const activePage = { close: jest.fn().mockResolvedValue(undefined) };
    const extraPage = { close: jest.fn().mockResolvedValue(undefined) };
    global.page = activePage;
    global.browser = {
      pages: jest.fn().mockResolvedValue([activePage, extraPage]),
    };

    await normalizeAutomationTab();

    expect(activePage.close).not.toHaveBeenCalled();
    expect(extraPage.close).toHaveBeenCalledTimes(1);
  });

  test('does nothing when browser is unavailable', async () => {
    global.browser = undefined;
    await expect(normalizeAutomationTab()).resolves.toBeUndefined();
  });

  test('does nothing when no pages are returned', async () => {
    global.browser = {
      pages: jest.fn().mockResolvedValue([]),
    };

    await expect(normalizeAutomationTab()).resolves.toBeUndefined();
  });

  test('does nothing when current page already is the primary page', async () => {
    const primary = { close: jest.fn().mockResolvedValue(undefined) };
    const extra = { close: jest.fn().mockResolvedValue(undefined) };
    global.page = primary;
    global.browser = {
      pages: jest.fn().mockResolvedValue([primary, extra]),
      defaultBrowserContext: jest.fn().mockReturnValue({}),
    };

    await normalizeAutomationTab();

    expect(primary.close).not.toHaveBeenCalled();
    expect(extra.close).toHaveBeenCalledTimes(1);
    expect(global.page).toBe(primary);
  });
});
