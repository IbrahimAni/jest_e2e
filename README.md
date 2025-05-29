# Jest E2E Testing Framework

A powerful Jest + Puppeteer E2E testing framework with built-in device automation, data builders, and CLI.

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

### 1. Initialize Your Project
```bash
mkdir my-e2e-tests
cd my-e2e-tests
npm init -y
npm install jest-e2e@latest
```

### 2. Copy Example Tests (Optional)
The package includes example tests that you can copy and modify:
```bash
# Copy the example tests to your project
cp -r node_modules/jest-e2e/__tests__/ ./
```

### 3. Create Your First Test
Create `__tests__/login-e2e.js`:
```javascript
test('User can login successfully', async () => {
  const { device } = await E2ESetup();
  const { userEmail, userPassword } = getTestData();
  
  await device.navigate('https://example.com/login');
  await device.fill('#email', userEmail);
  await device.fill('#password', userPassword);
  await device.click('#login-button');
  
  await device.waitForSelector('.dashboard');
  expect(await device.getInnerText('.welcome')).toContain('Welcome');
});
```

### 4. Run Your Tests
```bash
# Run all tests (headless)
jest-e2e

# Run specific test
jest-e2e login-e2e

# Run with visible browser
jest-e2e --useLocalBrowser true

# Keep browser open for debugging
jest-e2e login-e2e --repl
```

## 🎯 CLI Usage

```bash
jest-e2e [test_name] [options]
```

### Options
- `--useLocalBrowser true` - Run with visible browser
- `--repl` - Keep browser open after test completion
- `--debug` - Enable debug mode
- `--watch` - Watch mode for development
- `--verbose` - Detailed output
- `--timeout <ms>` - Custom timeout (default: 30000)
- `--slowmo <ms>` - Add delay between actions
- `--screenshot` - Take screenshots on failure
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
Main setup function that returns device and page objects:
```javascript
const { device, page } = await E2ESetup();
```

### Device API
Built-in browser automation methods:
```javascript
// Navigation
await device.navigate(url);
await device.goBack();
await device.refresh();

// Interactions
await device.click(selector);
await device.fill(selector, value);
await device.select(selector, value);
await device.hover(selector);

// Waiting
await device.waitForSelector(selector);
await device.waitForTimeout(ms);

// Information
const text = await device.getInnerText(selector);
const value = await device.getValue(selector);
const isVisible = await device.isVisible(selector);
```

### Data Builders
Generate test data with inheritance:
```javascript
// Get test data
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
Track test progress:
```javascript
logStep('Navigating to login page');
logStep('Filling user credentials');
logStep('Submitting login form');
```

## 📁 Project Structure

```
your-project/
├── __tests__/                     # Your E2E tests (copy from examples)
│   ├── login-success-e2e.js
│   ├── user-registration-e2e.js
│   └── checkout-flow-e2e.js
├── databuilders/                  # Custom data builders
│   ├── base-data-builder.js
│   ├── user-data-builder.js
│   └── product-data-builder.js
├── jest-puppeteer.config.js       # Puppeteer configuration
└── package.json
```

**Included Example Tests:**
The package comes with example tests showing different patterns:
- `example-login-success-e2e.js` - Successful login flow with data builders
- `example-form-validation-e2e.js` - Form validation using fluent expect API  
- `example-login-invalid-e2e.js` - Error handling and invalid credential testing

## 🏗️ Custom Configuration

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

## 🧪 Writing Tests

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
import { baseDataBuilder } from 'jest-e2e';

export function userDataBuilder() {
  return {
    ...baseDataBuilder(),
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

- [GitHub Issues](https://github.com/IbrahimAni/jest_e2e/issues)
- [Documentation](https://github.com/yourusername/jest-e2e#readme)
- [CLI Reference](./CLI_README.md)
- [Example Tests Guide](./EXAMPLES.md)

---

Made with ❤️ for the testing community 