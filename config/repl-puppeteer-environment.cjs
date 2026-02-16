const PuppeteerEnvironment = require('jest-environment-puppeteer').default;

class ReplPuppeteerEnvironment extends PuppeteerEnvironment {
  async teardown() {
    if (process.env.PUPPETEER_REPL === 'true') {
      return;
    }
    return super.teardown();
  }
}

module.exports = ReplPuppeteerEnvironment;
