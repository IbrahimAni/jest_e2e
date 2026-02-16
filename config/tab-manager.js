// Manage browser tabs so automation runs in the initial browser tab/window.
async function normalizeAutomationTab() {
  if (!global.browser || typeof global.browser.pages !== 'function') {
    return;
  }

  const defaultPages = await global.browser.pages();
  if (!Array.isArray(defaultPages) || defaultPages.length === 0) {
    return;
  }

  const primaryPage = defaultPages[0];
  const currentPage = global.page;

  // If Jest-Puppeteer created a second page, close it and use the first tab.
  if (currentPage && currentPage !== primaryPage && typeof currentPage.close === 'function') {
    try {
      await currentPage.close();
    } catch (_) {
      // Page may already be closed
    }
  }

  // Close any additional default-context tabs.
  for (let i = 1; i < defaultPages.length; i++) {
    const p = defaultPages[i];
    if (p && typeof p.close === 'function') {
      try {
        await p.close();
      } catch (_) {
        // Page may already be closed
      }
    }
  }

  global.page = primaryPage;
  if (typeof global.browser.defaultBrowserContext === 'function') {
    global.context = global.browser.defaultBrowserContext();
  }
}

export { normalizeAutomationTab };
