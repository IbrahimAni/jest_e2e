# Jest E2E - Browser Automation

A minimal Jest + Puppeteer setup for browser automation and end-to-end testing.

## Project Structure

```
jest_e2e/
├── __tests__/                    # All test files
│   ├── example.test.js          # Browser automation examples
│   └── login-e2e.js             # Login flow e2e tests
├── screenshots/                 # Auto-generated screenshots (gitignored)
│   ├── example-page.png         # Example website screenshots
│   ├── form-filled.png          # Form interaction screenshots
│   └── login-*.png              # Login flow screenshots
├── package.json                 # Dependencies and Jest config
├── jest-puppeteer.config.js     # Puppeteer browser settings
└── .gitignore                   # Excludes node_modules, screenshots, etc.
```

## Current Dependencies

- **Jest**: `^29.7.0` (Latest stable testing framework)
- **Puppeteer**: `^24.9.0` (Latest stable - released May 20, 2025)
- **Jest-Puppeteer**: `^11.0.0` (Latest stable integration package)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

## Available Scripts

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:debug` - Run tests with debugging info

## Examples Included

- Website navigation and title checking
- Screenshot capture (regular and full page) - saved to `screenshots/` folder
- Form interaction and element manipulation
- JavaScript execution in browser context
- Async operations and timing
- Login flow testing with visual verification

## Configuration

- `jest-puppeteer.config.js` - Puppeteer browser launch options
- `package.json` - Jest configuration and test patterns
- Screenshots are automatically saved to `screenshots/` folder and excluded from git

## Latest Features

With the latest versions, you get:
- **Puppeteer 24.9.0**: Latest Chrome support, improved performance, and new APIs
- **Jest 29.7.0**: Enhanced testing features and better error reporting
- **Jest-Puppeteer 11.0.0**: TypeScript support and improved reliability 