#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  testName: '',
  useLocalBrowser: false,
  repl: false,
  debug: false,
  watch: false,
  verbose: false,
  timeout: 30000,
  slowmo: 0,
  screenshot: false,
  silent: false,
  steps: true,
  help: false,
  init: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === 'init') {
    options.init = true;
  } else if (arg === '--useLocalBrowser') {
    options.useLocalBrowser = args[i + 1] === 'true';
    i++; // Skip next argument
  } else if (arg === '--repl') {
    options.repl = true;
  } else if (arg === '--debug') {
    options.debug = true;
  } else if (arg === '--watch' || arg === '-w') {
    options.watch = true;
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--timeout') {
    options.timeout = parseInt(args[i + 1]) || 30000;
    i++; // Skip next argument
  } else if (arg === '--slowmo') {
    options.slowmo = parseInt(args[i + 1]) || 0;
    i++; // Skip next argument
  } else if (arg === '--screenshot') {
    options.screenshot = true;
  } else if (arg === '--silent') {
    options.silent = true;
    options.steps = false;
  } else if (arg === '--no-steps') {
    options.steps = false;
  } else if (!arg.startsWith('--') && !options.testName && !options.init) {
    options.testName = arg;
  }
}

// Auto-detect if project needs initialization
const projectRoot = process.cwd();
const hasTestsDir = existsSync(path.join(projectRoot, '__tests__'));
const hasConfig = existsSync(path.join(projectRoot, 'jest-puppeteer.config.js'));
const needsInit = !hasTestsDir && !hasConfig && !options.init && !options.help;

if (needsInit) {
  console.log('🔍 No Jest E2E configuration detected.');
  console.log('🚀 Initializing your project automatically...\n');
  options.init = true;
}

// Handle init command
if (options.init) {
  console.log('🚀 Initializing Jest E2E project...\n');
  
  const packageRoot = path.dirname(__dirname);
  const projectRoot = process.cwd();
  
  // Create directories
  const dirsToCreate = ['__tests__', 'databuilders'];
  
  dirsToCreate.forEach(dir => {
    const targetDir = path.join(projectRoot, dir);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
      console.log(`📁 Created directory: ${dir}/`);
    }
  });
  
  // Copy files
  const filesToCopy = [
    {
      source: path.join(packageRoot, 'jest-puppeteer.config.js'),
      target: path.join(projectRoot, 'jest-puppeteer.config.js')
    },
    {
      source: path.join(packageRoot, '__tests__', 'example-login-success-e2e.js'),
      target: path.join(projectRoot, '__tests__', 'example-login-success-e2e.js')
    },
    {
      source: path.join(packageRoot, '__tests__', 'example-login-invalid-e2e.js'),
      target: path.join(projectRoot, '__tests__', 'example-login-invalid-e2e.js')
    },
    {
      source: path.join(packageRoot, '__tests__', 'example-form-validation-e2e.js'),
      target: path.join(projectRoot, '__tests__', 'example-form-validation-e2e.js')
    },
    {
      source: path.join(packageRoot, 'databuilders', 'base-data-builder.js'),
      target: path.join(projectRoot, 'databuilders', 'base-data-builder.js')
    },
    {
      source: path.join(packageRoot, 'databuilders', 'agent-test-data-builder.js'),
      target: path.join(projectRoot, 'databuilders', 'agent-test-data-builder.js')
    }
  ];
  
  filesToCopy.forEach(({ source, target }) => {
    try {
      if (existsSync(source)) {
        copyFileSync(source, target);
        const relativePath = path.relative(projectRoot, target);
        console.log(`📄 Copied: ${relativePath}`);
      }
    } catch (error) {
      console.error(`❌ Error copying ${path.basename(target)}:`, error.message);
    }
  });
  
  console.log('\n✅ Jest E2E project initialized successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Test examples: jest-e2e');
  console.log('3. Edit the example tests to match your application');
  console.log('4. Create your own test files in __tests__/');
  
  process.exit(0);
}

// Show help
if (options.help) {
  console.log(`
🚀 Jest E2E Test Runner

USAGE:
  jest-e2e [command|test_name] [options]

COMMANDS:
  init                      Initialize Jest E2E project (copies example files)

ARGUMENTS:
  test_name                 Name of the test to run (optional, runs all if not specified)

OPTIONS:
  --useLocalBrowser true    Run with visible browser (default: headless)
  --repl                    Keep browser open after test completion for debugging
  --debug                   Enable debug mode with additional logging
  --watch, -w               Watch mode - re-run tests when files change
  --verbose, -v             Verbose output with detailed test information
  --timeout <ms>            Set custom timeout in milliseconds (default: 30000)
  --slowmo <ms>             Add delay between actions in milliseconds (default: 0)
  --screenshot              Take screenshots on test failures
  --silent                  Run in silent mode (no step logging)
  --no-steps                Disable step-by-step logging only
  --help, -h                Show this help message

EXAMPLES:
  jest-e2e init                               # Force initialize project with example files
  jest-e2e                                    # Run all tests (auto-initializes if needed)
  jest-e2e login-success                      # Run specific test (headless with step logging)
  jest-e2e --useLocalBrowser true             # Run all tests with visible browser
  jest-e2e login-success --repl               # Run test and keep browser open
  jest-e2e --debug --verbose                  # Run with debug and verbose output
  jest-e2e login-success --slowmo 100         # Run with 100ms delay between actions
  jest-e2e --watch                           # Run in watch mode
  jest-e2e --silent                          # Run without step logging
  jest-e2e login-success --no-steps          # Run specific test without step logging

ENVIRONMENT:
  Tests run in headless mode by default for CI/automation.
  Use --useLocalBrowser true for local development and debugging.
  Step logging is enabled by default and shows real-time test progress.
  
NOTE:
  If no __tests__/ directory or jest-puppeteer.config.js is found,
  the framework will automatically initialize your project.
  `);
  process.exit(0);
}

// Set up environment variables
const env = { ...process.env };

// Configure browser mode
if (options.useLocalBrowser) {
  env.CI = 'false';  // Visible browser
} else {
  env.CI = 'true';   // Headless browser
}

// Configure REPL mode (keep browser open)
if (options.repl) {
  env.PUPPETEER_REPL = 'true';
  env.CI = 'false'; // Force visible browser for REPL
}

// Configure slowmo
if (options.slowmo > 0) {
  env.PUPPETEER_SLOWMO = options.slowmo.toString();
  env.CI = 'false'; // Force visible browser for slowmo
}

// Configure screenshot on failure
if (options.screenshot) {
  env.JEST_E2E_SCREENSHOT = 'true';
}

// Configure step logging
if (options.silent) {
  env.JEST_SILENT = 'true';
} else if (!options.steps) {
  env.JEST_NO_STEPS = 'true';
} else if (options.useLocalBrowser || options.repl || options.slowmo > 0) {
  // Force enable steps for visible browser modes
  env.JEST_FORCE_STEPS = 'true';
}

// Set timeout
env.JEST_TIMEOUT = options.timeout.toString();

// Configure Jest command
const jestArgs = [];

// Add NODE_OPTIONS for ES6 modules
env.NODE_OPTIONS = '--experimental-vm-modules --no-warnings';

// Add test name pattern if specified
if (options.testName) {
  jestArgs.push(options.testName);
}

// Add Jest options
if (options.watch) {
  jestArgs.push('--watch');
}

if (options.verbose) {
  jestArgs.push('--verbose');
}

if (options.debug) {
  jestArgs.push('--detectOpenHandles');
  env.DEBUG = 'true';
}

// Always add --silent to suppress Jest's verbose output
if (!options.verbose) {
  jestArgs.push('--silent');
}

// Show configuration
console.log(`🧪 Jest E2E Test Runner`);
// console.log(`📁 Running from: ${process.cwd()}`);
console.log(`🎯 Running test: ${options.testName || 'all tests'}`);
console.log(`🖥️  Browser mode: ${options.useLocalBrowser ? 'visible' : 'headless'}`);
if (options.repl) console.log(`🔧 REPL mode: enabled (browser will stay open)`);
if (options.slowmo > 0) console.log(`⏱️  Slow motion: ${options.slowmo}ms`);
// console.log(`⏰ Timeout: ${options.timeout}ms`);
// console.log(`📊 Verbose: ${options.verbose ? 'enabled' : 'disabled'}`);
// console.log(`🐛 Debug: ${options.debug ? 'enabled' : 'disabled'}`);
// console.log(`📝 Step logging: ${options.steps && !options.silent ? 'enabled' : 'disabled'}`);
console.log('');

// Run Jest
const jestCommand = 'npx';
const jestCmdArgs = ['jest', ...jestArgs];
const child = spawn(jestCommand, jestCmdArgs, {
  stdio: 'inherit',
  env: env,
  cwd: process.cwd()
});

child.on('close', (code) => {
  if (options.repl && code === 0) {
    console.log('\n🎉 Tests completed successfully!');
    console.log('🔧 REPL mode: Browser window should remain open for debugging.');
    console.log('💡 Close the browser window manually when done.');
  }
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Error running Jest:', error.message);
  process.exit(1);
}); 