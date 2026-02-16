const teardown = require('jest-environment-puppeteer/teardown');

module.exports = async function replAwareGlobalTeardown(jestConfig) {
  if (process.env.PUPPETEER_REPL === 'true') {
    return;
  }
  return teardown(jestConfig);
};
