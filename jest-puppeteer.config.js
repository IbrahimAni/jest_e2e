const isHeadless = process.env.CI === 'true';

export default {
  launch: {
    // Headless mode controlled by CLI
    headless: isHeadless,
    
    // Slowmo controlled by CLI
    slowMo: process.env.PUPPETEER_SLOWMO ? parseInt(process.env.PUPPETEER_SLOWMO) : (process.env.NODE_ENV === 'development' ? 50 : 0),
    
    devtools: process.env.DEBUG === 'true',

    // Keep native window sizing in visible mode; fixed viewport in headless mode.
    defaultViewport: isHeadless ? { width: 1280, height: 720 } : null,
    
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      ...(isHeadless ? [] : ['--start-maximized'])
    ]
  },
  // Use default context so automation runs in the first opened browser tab/window.
  browserContext: 'default',
  
  // Avoid post-launch viewport resizing in visible mode.
  viewport: isHeadless ? { width: 1280, height: 720 } : null,
  
  // Exit strategy for REPL mode
  exitOnPageError: process.env.PUPPETEER_REPL !== 'true'
}; 
