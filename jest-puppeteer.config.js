export default {
  launch: {
    // Headless mode controlled by CLI
    headless: process.env.CI === 'true',
    
    // Slowmo controlled by CLI
    slowMo: process.env.PUPPETEER_SLOWMO ? parseInt(process.env.PUPPETEER_SLOWMO) : (process.env.NODE_ENV === 'development' ? 50 : 0),
    
    devtools: process.env.DEBUG === 'true',
    
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  },
  browserContext: 'default',
  
  // Global viewport settings for all tests
  viewport: {
    width: 1280,
    height: 720
  },
  
  // Exit strategy for REPL mode
  exitOnPageError: process.env.PUPPETEER_REPL !== 'true'
}; 