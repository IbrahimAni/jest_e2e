# Jest E2E Testing Framework

A powerful Jest + Puppeteer E2E testing framework with built-in device automation, data builders, and CLI.

📖 **[Full documentation →](https://genfixs-limited.github.io/jest_e2e/)**

## 🚀 Features

- **Easy Setup**: Get started with E2E testing in minutes
- **Device Automation**: Built-in browser automation with simple API
- **Data Builders**: Flexible test data generation with inheritance
- **CLI Tool**: Comprehensive command-line interface
- **Step Logging**: Real-time test step tracking
- **Single Test Enforcement**: One test per file for better organization
- **ES6 Module Support**: Modern JavaScript syntax
- **Headless & Visible Modes**: Perfect for CI/CD and local development

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g jest-e2e@latest
```

### Project Installation
```bash
npm install jest-e2e@latest
npx jest-e2e --help
```

## 🏃‍♂️ Quick Start

### 1. Install and Initialize
```bash
mkdir my-e2e-tests
cd my-e2e-tests
npm init -y
npm install jest-e2e@latest

# Just run it - auto-initializes with examples on first run
npx jest-e2e
```

### 2. That's it! 🎉
The framework automatically:
- ✅ Detects it's your first run
- ✅ Updates your `package.json` with ES module support and Jest configuration
- ✅ Adds helpful npm scripts (`npm run jest-e2e`, `npm run jest-e2e:visible`, etc.)
- ✅ Creates `__tests__/`, `databuilders/`, and `config/` directories  
- ✅ Copies example tests and configuration files
- ✅ Sets up global access to Jest E2E functions
- ✅ Installs required dependencies automatically
- ✅ Runs the example tests to show you it works

### 3. Use the New npm Scripts
After initialization, you can use these convenient scripts:
```bash
# Run all E2E tests (headless)
npm run jest-e2e

# Run with visible browser for debugging  
npm run jest-e2e:visible

# Run in watch mode
npm run jest-e2e:watch

# Or use the CLI directly with more options
npx jest-e2e --repl
```

### 4. Customize for Your App
Edit the example tests in `__tests__/`:
```javascript
// __tests__/my-login-test-e2e.js
import { AgentTestDataBuilder } from '../databuilders/agent-test-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test('User can login successfully', async () => {
  const { device } = getDevices();
  const { userEmail, userPassword } = getTestData();

  await device.navigate('https://your-app.com/login');  // 👈 Change URL
  await device.type('#email', userEmail);               // 👈 Update selectors
  await device.type('#password', userPassword);
  await device.click('#login-button');

  await device.waitFor('.dashboard');
  await device.expect('.welcome').toContain('Welcome');
});
```

## 🎯 CLI Usage

```bash
jest-e2e [test_name] [options]
```

### Options
- `--useLocalBrowser [true]` - Run with visible browser
- `--repl` - Keep browser open after test completion
- `--debug` - Enable debug mode
- `--watch` - Watch mode for development
- `--verbose` - Detailed output
- `--timeout <ms>` - Per-test timeout and device auto-wait timeout
- `--slowmo <ms>` - Add delay between actions
- `--retries <n>` - Retry failed tests n times
- `--screenshot` / `--no-screenshot` - Screenshots on failure (default: on)
- `--silent` - No step logging
- `--help` - Show help

### Examples
```bash
# Run all tests in headless mode
jest-e2e

# Run specific test with visible browser
jest-e2e login-success --useLocalBrowser true

# Debug mode with step logging
jest-e2e payment-flow --debug --verbose

# Keep browser open for inspection
jest-e2e checkout-process --repl

# Slow motion for demonstrations
jest-e2e user-journey --slowmo 500 --useLocalBrowser true
```

## 🔧 API Reference

### E2ESetup()
Main setup function that configures test environment with data builders and devices:
```javascript
const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

// Use in your tests
const { device } = getDevices();
const { userEmail, userPassword } = getTestData();
```

### Device API
Built-in browser automation methods. Selectors are "smart": a plain string like
`'submit-btn'` targets `[data-testid="submit-btn"]`, while CSS selectors
(`#id`, `.class`, `[attr]`, combinators, element names) pass through as-is.
All interaction and assertion methods auto-wait for the element (default 5s,
configurable via `E2ESetup({ timeout })` or a per-call `{ waitTimeout }`).

```javascript
// Navigation
await device.navigate(url, options);        // page.goto
await device.goBack();
await device.goForward();
await device.refresh();

// Interactions (auto-wait until the element is visible and enabled)
await device.click(selector, options);
await device.type(selector, text, options); // keyboard typing (appends)
await device.fill(selector, value);         // set value directly + fire input/change
                                            // (best for date/time/number inputs)
await device.clear(selector);               // empty an input/textarea
await device.press(selector, 'Enter');      // press a keyboard key on an element
await device.select(selector, value);       // choose <select> option(s)
await device.hover(selector);

// Waiting
await device.waitFor(selector, options);        // wait for element
await device.waitForText(selector, text);       // wait until text appears
await device.waitForUrl('/dashboard');          // wait for URL to contain pattern
await device.waitForNavigation(options);
await device.wait(ms);                          // plain sleep (avoid when possible)

// Queries
const el = await device.get(selector);          // ElementHandle
const els = await device.getAll(selector);      // ElementHandle[]
const text = await device.getText(selector);
const value = await device.getValue(selector);
const exists = await device.exists(selector);   // no auto-wait
const visible = await device.isVisible(selector); // no auto-wait

// Page utilities
device.url();
await device.title();
await device.content();
await device.evaluate(fn);
await device.screenshot(options);

// Fluent assertions (auto-wait, with .not support)
await device.expect(selector).toContain('text');
await device.expect(selector).toHaveText('exact text');
await device.expect(selector).toBeVisible();
await device.expect(selector).toExist();
await device.expect(selector).toHaveValue('value');
await device.expect(selector).toHaveAttribute('name', 'value');
await device.expect(selector).toHaveClass('class-name');
await device.expect(selector).toHaveCount(3);
await device.expect(selector).not.toExist();    // waits for removal
await device.expect(selector).not.toBeVisible(); // waits until hidden/absent
```

### Data Builders
Generate test data with inheritance:
```javascript
// Import in your test files
import { AgentTestDataBuilder } from '../databuilders/agent-test-data-builder.js';

// Get test data (available globally in tests)
const { userEmail, userPassword } = getTestData();

// Custom data builder
export function myCustomDataBuilder() {
  return {
    ...baseDataBuilder(),
    customField: 'custom value',
    genImp() { return 'custom-implementation'; },
    getVersion() { return '1.0.0'; }
  };
}
```

### Step Logging
Track test progress (available globally):
```javascript
logStep('Navigating to login page');
logStep('Filling user credentials');
logStep('Submitting login form');
```

## 📁 Project Structure

After running `npx jest-e2e` for the first time, your project will have:

```
your-project/
├── __tests__/                     # Your E2E tests (auto-created with examples)
│   ├── tavola-navigation-e2e.js
│   ├── tavola-cart-e2e.js
│   ├── tavola-reserve-fill-e2e.js
│   └── tavola-login-e2e.js
├── databuilders/                  # Test data builders (auto-created)
│   ├── base-data-builder.js
│   ├── agent-test-data-builder.js
│   └── tavola-data-builder.js
├── config/                        # Configuration files (auto-created)
│   └── test-setup.js              # Global Jest E2E setup
├── jest-puppeteer.config.js       # Puppeteer configuration (auto-created)
└── package.json                   # Updated with ES modules & Jest config
```

**Auto-Generated Files:**
The framework automatically creates all necessary files:
- **Example Tests**: Four example tests (against the Tavola demo app) showing different patterns
- **Data Builders**: Base and example data builders for test data generation
- **Configuration**: Jest setup and Puppeteer configuration
- **Package Configuration**: Your package.json gets updated with proper ES module and Jest settings

## 🏗️ Custom Configuration

### Automatic Package.json Updates
When you run `npx jest-e2e` for the first time, the framework automatically updates your `package.json` with:

```json
{
  "type": "module",                    // Enables ES6 imports
  "scripts": {
    "test": "NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest",
    "jest-e2e": "jest-e2e",                // Convenient E2E scripts
    "jest-e2e:visible": "jest-e2e --useLocalBrowser true",
    "jest-e2e:watch": "jest-e2e --watch"
  },
  "jest": {                            // Jest configuration for E2E
    "preset": "jest-puppeteer",
    "testMatch": ["**/*-e2e.js"],
    "testTimeout": 30000,
    "setupFilesAfterEnv": ["./config/test-setup.js"]
  },
  "devDependencies": {                 // Required testing dependencies
    "jest": "^29.7.0",
    "puppeteer": "^24.9.0",
    "jest-puppeteer": "^11.0.0"
  }
}
```

This automatic configuration eliminates the need for manual setup and ensures everything works out of the box!

### Custom Puppeteer Configuration
Create `jest-puppeteer.config.js`:
```javascript
export default {
  launch: {
    headless: process.env.CI === 'true',
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  server: {
    command: 'npm start',
    port: 3000,
    launchTimeout: 10000
  }
};
```

## 🎯 Writing Tests

### Basic Test Structure
Since Jest E2E functions are globally available, you can write tests without imports:
```javascript
/* eslint-disable no-undef */
"use strict";

// Import your specific data builders
import { AgentTestDataBuilder } from '../databuilders/agent-test-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("User can complete checkout", async () => {
  const { device } = getDevices();
  const { userEmail, userPassword } = getTestData();
  
  logStep('Navigate to login page');
  await device.navigate("https://your-app.com/login");
  
  logStep('Fill login credentials');
  await device.type("#email", userEmail);
  await device.type("#password", userPassword);
  
  logStep('Submit login form');
  await device.click("#login-button");
  
  // Verify success
  await device.expect("body").toContain("Dashboard");
});
```

### Single Test Rule
Each test file must contain exactly one test function:
```javascript
// ✅ Good - one test per file
test('User can complete checkout', async () => {
  // test implementation
});

// ❌ Bad - multiple tests in one file
test('Test 1', async () => {});
test('Test 2', async () => {}); // This will throw an error
```

### Test File Naming
Use `-e2e.js` suffix for test files:
- `login-success-e2e.js`
- `user-registration-e2e.js`
- `payment-flow-e2e.js`

### Data Builder Pattern
```javascript
// databuilders/user-data-builder.js
export function userDataBuilder() {
  return {
    ...baseDataBuilder(), // Available globally
    userEmail: 'test@example.com',
    userPassword: 'password123',
    userFullName: 'Test User',
    
    genImp() {
      return 'user-builder-v1';
    },
    
    getVersion() {
      return '1.0.0';
    }
  };
}
```

## 🎯 Best Practices

### 1. Use Descriptive Test Names
```javascript
test('User can login with valid credentials and access dashboard', async () => {
  // test implementation
});
```

### 2. Implement Page Object Pattern
```javascript
class LoginPage {
  constructor(device) {
    this.device = device;
  }
  
  async login(email, password) {
    await this.device.type('#email', email);
    await this.device.type('#password', password);
    await this.device.click('#login-button');
  }
}
```

### 3. Use Step Logging
```javascript
test('Complete user journey', async () => {
  const { device } = await E2ESetup();
  
  logStep('Navigate to homepage');
  await device.navigate('https://example.com');
  
  logStep('Click sign up button');
  await device.click('#signup');
  
  logStep('Fill registration form');
  // form filling...
});
```

## 🐛 Debugging

### Visual Debugging
```bash
# Run with visible browser
jest-e2e my-test --useLocalBrowser true

# Keep browser open for inspection
jest-e2e my-test --repl

# Slow motion for better visibility
jest-e2e my-test --slowmo 1000 --useLocalBrowser true
```

### Debug Mode
```bash
# Enable debug output
jest-e2e my-test --debug --verbose
```

### Screenshots
```bash
# Take screenshots on failure
jest-e2e my-test --screenshot
```

## 📊 CI/CD Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx jest-e2e --silent
```

### GitLab CI
```yaml
e2e_tests:
  image: node:18
  script:
    - npm install
    - npx jest-e2e --silent
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- [GitHub Issues](https://github.com/genfixs-limited/jest_e2e/issues)
- [Documentation](https://github.com/yourusername/jest-e2e#readme)
- [CLI Reference](./CLI_README.md)
- [Example Tests Guide](./EXAMPLES.md)

---

Made with ❤️ for the testing community 