# 🚀 Jest E2E CLI Tool

A powerful command-line interface for running Jest E2E tests with Puppeteer.

## Installation

The CLI is already set up in the jest-e2e project. You can run it using any of these methods:

### Recommended: npm script
```bash
npx jest-e2e [options]
```

### Alternative methods:
```bash
# Direct execution
./jest-e2e [options]

# Using npm
npm run jest-e2e [options]

# Direct node command
node bin/jest-e2e.js [options]
```

## Usage

### Basic Commands

```bash
# Run all tests (headless by default)
npx jest-e2e

# Run specific test
npm run jest-e2e login-success

# Show help
npm run jest-e2e -- --help
```
*Note: Use `--` before options when using npm run*

### Browser Modes

```bash
# Run with visible browser (for debugging)
./jest-e2e --useLocalBrowser true

# Run with browser staying open after test (REPL mode)
./jest-e2e login-success --repl

# Run with slow motion (100ms delays between actions)
./jest-e2e login-success --slowmo 100 --useLocalBrowser true
```

### Development Options

```bash
# Watch mode - re-run tests when files change
npm run jest-e2e -- --watch

# Debug mode with additional logging
npm run jest-e2e -- --debug --verbose

# Custom timeout (60 seconds)
npm run jest-e2e login-success -- --timeout 60000

# Verbose output
npm run jest-e2e -- --verbose

# Silent mode (no step logging)
npm run jest-e2e -- --silent

# Disable only step logging (keep other output)
npm run jest-e2e -- --no-steps
```

## All Options

| Option | Description | Default |
|--------|-------------|---------|
| `--useLocalBrowser [true]` | Run with visible browser | `false` (headless) |
| `--repl` | Keep browser open after test completion | `false` |
| `--debug` | Enable debug mode with additional logging | `false` |
| `--watch`, `-w` | Watch mode - re-run tests when files change | `false` |
| `--verbose`, `-v` | Verbose output with detailed test information | `false` |
| `--timeout <ms>` | Per-test timeout and device auto-wait timeout | `30000` (test) / `5000` (auto-wait) |
| `--slowmo <ms>` | Add delay between actions in milliseconds | `0` |
| `--retries <n>` | Retry failed tests n times | `0` |
| `--screenshot` | Take screenshots on test failures | `true` |
| `--no-screenshot` | Disable screenshots on test failures | - |
| `--silent` | Run in silent mode (no step logging) | `false` |
| `--no-steps` | Disable step-by-step logging only | `false` |
| `--help`, `-h` | Show help message | - |

## Step Logging Feature ✨

The CLI includes **real-time step logging** that shows you exactly what's happening during test execution:

```
🧪 Starting test: should login successfully and verify Agent Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Step 1: Navigating to https://anilathomes.com/login [0.03s]
📍 Step 2: Navigation completed https://anilathomes.com/login [1.68s]
📍 Step 3: Typing "agent@anilathomes.co..." into "email-input" [1.68s]
📍 Step 4: Typing completed "agent@anilathomes.co..." into "email-input" [1.80s]
📍 Step 5: Clicking "submit-button" [1.91s]
📍 Step 6: Click completed "submit-button" [1.96s]
📍 Step 7: Verifying text content "body" contains "Agent Dashboard" [4.96s]
✅ Test completed successfully [4.97s]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step Logging Behavior:
- ✅ **Enabled by default** for local development
- ✅ **Automatically disabled** in CI/headless mode
- ✅ **Real-time updates** - each step overwrites the previous one
- ✅ **Timestamps** show elapsed time from test start
- ✅ **Detailed actions** - shows what's being clicked, typed, verified
- ✅ **Can be disabled** with `--silent` or `--no-steps`

## Environment Variables

The CLI automatically sets these environment variables:

- `CI=true` for headless mode
- `CI=false` for visible browser mode
- `PUPPETEER_REPL=true` for REPL mode
- `PUPPETEER_SLOWMO=<ms>` for slow motion
- `NODE_OPTIONS=--experimental-vm-modules` for ES6 module support

Auth-related variables are read by `E2ESetup(...)`:

- `VERCEL_AUTOMATION_BYPASS_SECRET` sends Vercel Deployment Protection bypass headers automatically
- `JEST_E2E_AUTH_HEADER_NAME` + `JEST_E2E_AUTOMATION_KEY` configure generic header auth
- `JEST_E2E_AUTH_HEADERS`, `JEST_E2E_AUTH_QUERY_PARAMS`, and `JEST_E2E_AUTH_COOKIES` accept JSON for custom auth material

## Project Config

The CLI also loads a Playwright-style project config from the root:

```javascript
// jest-e2e.config.js
import { defineConfig } from 'jest-e2e';

// Optional .env support:
// 1. Run: npm install --save-dev dotenv
// 2. Uncomment the next line.
// import 'dotenv/config';

export default defineConfig({
  auth: {
    provider: 'vercel',
    token: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  },
});
```

Supported filenames are `jest-e2e.config.js`, `.mjs`, `.cjs`, and `.json`. Set
`JEST_E2E_CONFIG=path/to/config.js` to use a custom location.

## Examples

### Development Workflow

```bash
# Start with visible browser for debugging
./jest-e2e login-success --useLocalBrowser true

# Use REPL mode to inspect after test
./jest-e2e login-success --repl

# Debug with slow motion and verbose output
./jest-e2e login-success --slowmo 200 --verbose --debug
```

### CI/Automation

```bash
# Default headless run (CI-friendly)
./jest-e2e

# All tests with screenshots on failure
./jest-e2e --screenshot

# Specific test with custom timeout
./jest-e2e login-success --timeout 45000
```

### Watch Development

```bash
# Watch mode for continuous development
./jest-e2e --watch --useLocalBrowser true

# Watch with debug info
./jest-e2e --watch --debug --verbose
```

## Tips

1. **REPL Mode**: Use `--repl` when you want to inspect the page after tests complete
2. **Slow Motion**: Use `--slowmo 100` to see actions happening step by step
3. **Debug Mode**: Combine `--debug --verbose` for maximum information
4. **Browser Mode**: Always use `--useLocalBrowser true` for local development
5. **Watch Mode**: Great for TDD - tests rerun automatically when you save files

## Troubleshooting

- If tests fail to start, ensure all dependencies are installed: `npm install`
- For permission issues, make sure the script is executable: `chmod +x jest-e2e`
- Use `--debug --verbose` for detailed error information 
