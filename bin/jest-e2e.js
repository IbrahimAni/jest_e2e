#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const DEFAULT_TEST_TIMEOUT = 30000;
const VISUAL_MODE_TEST_TIMEOUT = 120000;

const options = {
  testName: '',
  useLocalBrowser: false,
  repl: false,
  debug: false,
  watch: false,
  verbose: false,
  timeout: DEFAULT_TEST_TIMEOUT,
  slowmo: 0,
  screenshot: false,
  silent: false,
  steps: true,
  retries: 0,
  help: false,
  init: false
};

const logInitializationDetail = (message) => {
  if (options.verbose) {
    console.log(message);
  }
};

// --- Terminal styling helpers (init banner) ---
const colorEnabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR && process.env.TERM !== 'dumb';
const stripAnsi = (value) => value.replace(/\x1B\[[0-9;]*m/g, '');
const paint = (code, text) => (colorEnabled ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = (text) => paint('1', text);
const dim = (text) => paint('2', text);
const green = (text) => paint('32', text);
const cyan = (text) => paint('36', text);

// "JEST E2E" in the ANSI Shadow block font.
const WORDMARK_LINES = [
  '     ██╗███████╗███████╗████████╗   ███████╗██████╗ ███████╗',
  '     ██║██╔════╝██╔════╝╚══██╔══╝   ██╔════╝╚════██╗██╔════╝',
  '     ██║█████╗  ███████╗   ██║      █████╗   █████╔╝█████╗  ',
  '██   ██║██╔══╝  ╚════██║   ██║      ██╔══╝  ██╔═══╝ ██╔══╝  ',
  '╚█████╔╝███████╗███████║   ██║      ███████╗███████╗███████╗',
  ' ╚════╝ ╚══════╝╚══════╝   ╚═╝      ╚══════╝╚══════╝╚══════╝',
];

// Render the wordmark in plain white when color is enabled.
const gradientColorCode = () => '37';

const renderWordmark = () => {
  const width = Math.max(...WORDMARK_LINES.map((line) => line.length));
  return WORDMARK_LINES.map((line) => {
    if (!colorEnabled) return `  ${line}`;
    let painted = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === ' ') {
        painted += ch;
        continue;
      }
      painted += `\x1b[1;${gradientColorCode(i / width)}m${ch}`;
    }
    return `  ${painted}\x1b[0m`;
  }).join('\n');
};

const renderBox = (lines) => {
  const width = Math.max(...lines.map((line) => stripAnsi(line).length));
  const top = dim(`╭${'─'.repeat(width + 4)}╮`);
  const bottom = dim(`╰${'─'.repeat(width + 4)}╯`);
  const body = lines.map((line) => {
    const padding = ' '.repeat(width - stripAnsi(line).length);
    return `${dim('│')}  ${line}${padding}  ${dim('│')}`;
  });
  return [top, ...body, bottom].join('\n');
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === 'init') {
    options.init = true;
  } else if (arg === '--useLocalBrowser') {
    // Value is optional: `--useLocalBrowser` alone means true
    if (args[i + 1] === 'true' || args[i + 1] === 'false') {
      options.useLocalBrowser = args[i + 1] === 'true';
      i++; // Skip next argument
    } else {
      options.useLocalBrowser = true;
    }
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
    options.timeoutProvided = true;
    i++; // Skip next argument
  } else if (arg === '--slowmo') {
    options.slowmo = parseInt(args[i + 1]) || 0;
    i++; // Skip next argument
  } else if (arg === '--retries') {
    options.retries = parseInt(args[i + 1]) || 0;
    options.retriesProvided = true;
    i++; // Skip next argument
  } else if (arg === '--screenshot') {
    options.screenshot = true;
    options.screenshotProvided = true;
  } else if (arg === '--no-screenshot') {
    options.screenshot = false;
    options.noScreenshot = true;
    options.screenshotProvided = true;
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
  // A specific test was requested but there's no project here — almost
  // certainly the wrong directory. Never scaffold in that case.
  if (options.testName) {
    console.error(`❌ No Jest E2E project found in: ${projectRoot}`);
    console.error(`   (looked for __tests__/ or jest-puppeteer.config.js)`);
    console.error('');
    console.error('   If your tests live elsewhere, cd to that directory first.');
    console.error('   To set up a new project here, run: npx jest-e2e init');
    process.exit(1);
  }
  options.init = true;
}

// Handle init command
if (options.init) {
  const packageRoot = path.dirname(__dirname);
  const projectRoot = process.cwd();
  
  // Update package.json for ES modules and Jest configuration
  const packageJsonPath = path.join(projectRoot, 'package.json');
  let packageJson = {};
  
  if (existsSync(packageJsonPath)) {
    try {
      const packageContent = readFileSync(packageJsonPath, 'utf8');
      packageJson = JSON.parse(packageContent);
    } catch (error) {
      console.error('❌ Error reading package.json:', error.message);
      process.exit(1);
    }
  }
  
  // Configure package.json for ES modules and Jest
  packageJson.type = "module";
  
  // Add/update scripts
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "test": "NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest",
    "test:watch": "NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest --watch",
    "test:debug": "NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest --detectOpenHandles",
    "test:headless": "CI=true NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest",
    "test:visible": "CI=false NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest",
    "jest-e2e": "jest-e2e",
    "jest-e2e:watch": "jest-e2e --watch",
    "jest-e2e:visible": "jest-e2e --useLocalBrowser true"
  };
  
  // Add Jest configuration
  packageJson.jest = {
    "preset": "jest-puppeteer",
    "testEnvironment": "jest-e2e/config/repl-puppeteer-environment.cjs",
    "globalTeardown": "jest-e2e/config/repl-global-teardown.cjs",
    "testMatch": [
      "**/__tests__/**/*.test.js",
      "**/?(*.)+(spec|test).js",
      "**/*-e2e.js"
    ],
    "testPathIgnorePatterns": [
      "/node_modules/"
    ],
    "testTimeout": 30000,
    "globals": {
      "E2ESetup": "readonly",
      "logStep": "readonly",
      "createChromeE2EApi": "readonly",
      "baseDataBuilder": "readonly"
    },
    "setupFilesAfterEnv": [
      "./config/test-setup.js"
    ]
  };
  
  // Add/update dependencies
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  
  const requiredDeps = {
    "jest": "^29.7.0",
    "puppeteer": "^24.9.0", 
    "jest-puppeteer": "^11.0.0"
  };
  
  Object.assign(packageJson.devDependencies, requiredDeps);
  
  // Write updated package.json
  try {
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    logInitializationDetail('Updated package.json');
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    process.exit(1);
  }
  
  // Create directories
  const dirsToCreate = ['__tests__', 'databuilders', 'config'];
  
  dirsToCreate.forEach(dir => {
    const targetDir = path.join(projectRoot, dir);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
      logInitializationDetail(`Created directory: ${dir}/`);
    }
  });

  // Ensure screenshots folder is ignored by git
  try {
    const gitignorePath = path.join(projectRoot, '.gitignore');
    const ignoreEntries = ['__screenshots__/', '.env'];
    if (existsSync(gitignorePath)) {
      let currentGitignore = readFileSync(gitignorePath, 'utf8');
      const missingEntries = ignoreEntries.filter((entry) => !currentGitignore.includes(entry));
      if (missingEntries.length > 0) {
        const separator = currentGitignore.endsWith('\n') ? '' : '\n';
        currentGitignore = `${currentGitignore}${separator}${missingEntries.join('\n')}\n`;
        writeFileSync(gitignorePath, currentGitignore);
        logInitializationDetail('Updated .gitignore');
      }
    } else {
      writeFileSync(gitignorePath, `${ignoreEntries.join('\n')}\n`);
      logInitializationDetail('Created .gitignore');
    }
  } catch (error) {
    console.error('❌ Error updating .gitignore:', error.message);
  }
  
  // Copy files
  const exampleTests = [
    'tavola-navigation-e2e.js',
    'tavola-cart-e2e.js',
    'tavola-reserve-fill-e2e.js',
    'tavola-login-e2e.js',
    'tavola-checkout-journey-e2e.js',
  ];
  const exampleBuilders = [
    'base-data-builder.js',
    'agent-test-data-builder.js',
    'tavola-data-builder.js',
  ];
  const filesToCopy = [
    {
      source: path.join(packageRoot, 'jest-puppeteer.config.js'),
      target: path.join(projectRoot, 'jest-puppeteer.config.js'),
      kind: 'config'
    },
    ...exampleTests.map((file) => ({
      source: path.join(packageRoot, '__tests__', 'e2e', file),
      target: path.join(projectRoot, '__tests__', file),
      kind: 'test'
    })),
    ...exampleBuilders.map((file) => ({
      source: path.join(packageRoot, 'databuilders', file),
      target: path.join(projectRoot, 'databuilders', file),
      kind: 'builder'
    }))
  ];

  const copiedCounts = { config: 0, test: 0, builder: 0 };

  filesToCopy.forEach(({ source, target, kind }) => {
    try {
      if (existsSync(source)) {
        if (kind === 'test') {
          // Examples live in the package's __tests__/e2e/ but land in the
          // user's __tests__/ root, one level shallower.
          const content = readFileSync(source, 'utf8')
            .replaceAll("'../../databuilders/", "'../databuilders/");
          writeFileSync(target, content);
        } else {
          copyFileSync(source, target);
        }
        copiedCounts[kind]++;
        const relativePath = path.relative(projectRoot, target);
        logInitializationDetail(`Copied: ${relativePath}`);
      } else {
        console.warn(`⚠️  Skipped (missing from package): ${path.basename(source)}`);
      }
    } catch (error) {
      console.error(`❌ Error copying ${path.basename(target)}:`, error.message);
    }
  });
  
  // Create test-setup.js file
  const testSetupContent = `// Jest E2E Test Setup
// This file configures global variables for Jest E2E tests

import { E2ESetup, logStep, createChromeE2EApi, baseDataBuilder } from 'jest-e2e';

// Framework setup: step logging around tests, single tab, one test per file
import 'jest-e2e/config/globals.js';
import 'jest-e2e/config/single-test-enforcer.js';

// Make Jest E2E functions globally available
global.E2ESetup = E2ESetup;
global.logStep = logStep;
global.createChromeE2EApi = createChromeE2EApi;
global.baseDataBuilder = baseDataBuilder;
`;
  
  try {
    writeFileSync(path.join(projectRoot, 'config', 'test-setup.js'), testSetupContent);
    logInitializationDetail('Created: config/test-setup.js');
  } catch (error) {
    console.error('❌ Error creating test-setup.js:', error.message);
  }

  const frameworkConfigPath = path.join(projectRoot, 'jest-e2e.config.js');
  const frameworkConfigContent = `import { defineConfig } from 'jest-e2e';

// Optional .env support:
// 1. Run: npm install --save-dev dotenv
// 2. Uncomment the next line to load variables from .env before this config runs.
// import 'dotenv/config';

export default defineConfig({
  auth: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    ? {
        provider: 'vercel',
        token: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      }
    : undefined,
});
`;

  try {
    if (!existsSync(frameworkConfigPath)) {
      writeFileSync(frameworkConfigPath, frameworkConfigContent);
      logInitializationDetail('Created: jest-e2e.config.js');
    }
  } catch (error) {
    console.error('❌ Error creating jest-e2e.config.js:', error.message);
  }
  
  let frameworkVersion = '';
  try {
    frameworkVersion = JSON.parse(
      readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
    ).version || '';
  } catch {
    // Banner degrades gracefully without a version.
  }

  const summaryRows = [
    ['package.json', 'scripts, jest config, devDependencies'],
    ['__tests__/', `${copiedCounts.test} example test${copiedCounts.test === 1 ? '' : 's'}`],
    ['databuilders/', `${copiedCounts.builder} data builder${copiedCounts.builder === 1 ? '' : 's'}`],
    ['config/', 'test-setup.js'],
    ['jest-e2e.config.js', 'project-level framework config'],
    ['.gitignore', '__screenshots__/ and .env excluded'],
  ];
  const summaryLabelWidth = Math.max(...summaryRows.map(([label]) => label.length));

  const nextSteps = [
    ['npm install', 'install dependencies'],
    ['npm run jest-e2e', 'run all tests (headless)'],
    ['npm run jest-e2e:visible', 'run with a visible browser'],
  ];
  const stepLabelWidth = Math.max(...nextSteps.map(([command]) => command.length));

  console.log('');
  console.log(renderWordmark());
  console.log('');
  console.log(renderBox([
    bold(`Welcome to Jest E2E${frameworkVersion ? ` v${frameworkVersion}` : ''}`),
    dim('Browser E2E testing with Jest + Puppeteer'),
  ]));
  console.log('');
  summaryRows.forEach(([label, detail]) => {
    console.log(`  ${green('✔')} ${label.padEnd(summaryLabelWidth + 2)}${dim(detail)}`);
  });
  console.log('');
  console.log(`  ${bold('Next steps')}`);
  nextSteps.forEach(([command, detail]) => {
    console.log(`    ${cyan(command.padEnd(stepLabelWidth + 4))}${dim(detail)}`);
  });
  console.log('');
  console.log(`  ${dim('Docs')}  ${dim('https://github.com/genfixs-limited/jest_e2e#readme')}`);
  console.log('');

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
  --useLocalBrowser [true]  Run with visible browser (default: headless)
  --repl                    Keep browser open after test completion for debugging
  --debug                   Enable debug mode with additional logging
  --watch, -w               Watch mode - re-run tests when files change
  --verbose, -v             Verbose output with detailed test information
  --timeout <ms>            Per-test timeout AND device auto-wait timeout in ms
  --slowmo <ms>             Add delay between actions in milliseconds (default: 0)
  --retries <n>             Retry failed tests n times (default: 0)
  --screenshot              Take screenshots on test failures (default: on)
  --no-screenshot           Disable screenshots on test failures
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
  jest-e2e --retries 2                        # Retry failed tests up to 2 times
  jest-e2e --watch                           # Run in watch mode
  jest-e2e --silent                          # Run without step logging
  jest-e2e login-success --no-steps          # Run specific test without step logging

ENVIRONMENT:
  Tests run in headless mode by default for CI/automation.
  Use --useLocalBrowser true for local development and debugging.
  Visible mode runs with a single Jest worker to keep one browser instance.
  Step logging is enabled by default and shows real-time test progress.
  
NOTE:
  If no __tests__/ directory or jest-puppeteer.config.js is found,
  the framework will automatically initialize your project.

CONFIG:
  Optional project config: jest-e2e.config.js, .mjs, .cjs, or .json
  Example: export default { auth: { provider: 'vercel' } }
  `);
  process.exit(0);
}

const CONFIG_FILE_NAMES = [
  'jest-e2e.config.js',
  'jest-e2e.config.mjs',
  'jest-e2e.config.cjs',
  'jest-e2e.config.json',
];

const findFrameworkConfigPath = (rootDir) => {
  if (process.env.JEST_E2E_CONFIG) {
    const configuredPath = path.isAbsolute(process.env.JEST_E2E_CONFIG)
      ? process.env.JEST_E2E_CONFIG
      : path.resolve(rootDir, process.env.JEST_E2E_CONFIG);
    return existsSync(configuredPath) ? configuredPath : null;
  }

  return CONFIG_FILE_NAMES
    .map((fileName) => path.join(rootDir, fileName))
    .find((filePath) => existsSync(filePath)) || null;
};

const loadFrameworkConfig = async (rootDir) => {
  const configPath = findFrameworkConfigPath(rootDir);
  if (!configPath) {
    return {};
  }

  try {
    if (configPath.endsWith('.json')) {
      return JSON.parse(readFileSync(configPath, 'utf8'));
    }

    const importedConfig = await import(pathToFileURL(configPath).href);
    return importedConfig.default || importedConfig;
  } catch (error) {
    console.error(`❌ Error loading ${path.basename(configPath)}: ${error.message}`);
    process.exit(1);
  }
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

const applyFrameworkConfigToEnv = (config, env) => {
  if (!config || typeof config !== 'object') return;

  if (hasOwn(config, 'auth') && config.auth !== undefined && env.JEST_E2E_AUTH_CONFIG === undefined) {
    env.JEST_E2E_AUTH_CONFIG = JSON.stringify(config.auth);
  }
};

// Set up environment variables
const env = { ...process.env };
const frameworkConfig = await loadFrameworkConfig(projectRoot);
applyFrameworkConfigToEnv(frameworkConfig, env);

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
  // Slow motion is handled by the framework action layer. Puppeteer's launch
  // slowMo applies to every protocol command, including each cursor step, which
  // makes headed runs crawl and can trip Jest's timeout before the flow finishes.
  env.CI = 'false'; // Force visible browser for slowmo
}

const isVisualMode = options.useLocalBrowser || options.repl || options.slowmo > 0;
const effectiveTestTimeout = options.timeoutProvided
  ? options.timeout
  : (isVisualMode ? Math.max(DEFAULT_TEST_TIMEOUT, VISUAL_MODE_TEST_TIMEOUT) : undefined);

if (isVisualMode) {
  env.JEST_E2E_SMOOTH = 'true';
  env.JEST_E2E_DISABLE_ANIMATIONS = 'true';
  if (!env.JEST_E2E_ACTION_DELAY) {
    env.JEST_E2E_ACTION_DELAY = options.slowmo > 0 ? String(options.slowmo) : '30';
  }
}

if (options.retries > 0) {
  env.JEST_E2E_RETRIES = options.retries.toString();
}

// Configure screenshot on failure (on by default; --no-screenshot disables)
if (options.noScreenshot) {
  env.JEST_E2E_SCREENSHOT = 'false';
} else if (options.screenshot) {
  env.JEST_E2E_SCREENSHOT = 'true';
}

// Configure step logging
if (options.silent) {
  env.JEST_SILENT = 'true';
} else if (!options.steps) {
  env.JEST_NO_STEPS = 'true';
} else if (isVisualMode) {
  // Force enable steps for visible browser modes
  env.JEST_FORCE_STEPS = 'true';
}

// Set timeout only when explicitly requested: JEST_E2E_TIMEOUT feeds the
// device auto-wait default (read by E2ESetup); --testTimeout overrides
// Jest's per-test timeout.
if (options.timeoutProvided) {
  env.JEST_E2E_TIMEOUT = options.timeout.toString();
}

// Configure Jest command
const jestArgs = [];

// Add NODE_OPTIONS for ES6 modules
env.NODE_OPTIONS = '--experimental-vm-modules --no-warnings';

// Add test name pattern if specified
if (options.testName) {
  jestArgs.push(options.testName);
}

// Apply per-test timeout when explicitly requested, and give headed/smooth runs
// a larger default because visible cursor movement intentionally takes longer.
if (typeof effectiveTestTimeout === 'number') {
  jestArgs.push(`--testTimeout=${effectiveTestTimeout}`);
}

// Add Jest options
if (options.watch) {
  jestArgs.push('--watch');
}

// In visible/repl/slowmo mode, force one worker so only one browser is launched.
if (isVisualMode) {
  jestArgs.push('--runInBand');
}

if (options.verbose) {
  jestArgs.push('--verbose');
}

if (options.debug) {
  jestArgs.push('--detectOpenHandles');
  env.DEBUG = 'true';
}

// REPL intentionally leaves browser/page handles open.
if (options.repl) {
  jestArgs.push('--openHandlesTimeout=0');
}

// Always add --silent to suppress Jest's verbose output
if (!options.verbose) {
  jestArgs.push('--silent');
}

// Run Jest
const jestCommand = 'npx';
const jestCmdArgs = ['jest', ...jestArgs];

const shouldSuppressSummaryLine = (line) => {
  const plain = stripAnsi(line).trim();
  return (
    plain.startsWith('Test Suites:') ||
    plain.startsWith('Tests:') ||
    plain.startsWith('Snapshots:') ||
    plain.startsWith('Time:')
  );
};

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

const statusColors = {
  FAIL: ANSI.red,
  PASS: ANSI.green,
  SKIP: ANSI.yellow,
};

const statusLabels = {
  FAIL: 'Fail',
  PASS: 'Pass',
  SKIP: 'Skip',
};

const formatStatusLine = (line) => {
  const plain = stripAnsi(line);
  const statusMatch = plain.match(/^(\s*)(PASS|FAIL|SKIP)\s+(.+)$/);
  if (!statusMatch) return line;

  const [, indent, status, remainder] = statusMatch;
  const pathMatch = remainder.match(/^(.+\.[cm]?[jt]sx?)(.*)$/);
  const filePath = pathMatch ? pathMatch[1] : remainder.split(/\s+/)[0];
  const rest = pathMatch ? pathMatch[2] : remainder.slice(filePath.length);
  const fileName = path.basename(filePath.replace(/\\/g, '/'));

  return `${indent}${statusColors[status]}${statusLabels[status]}${ANSI.reset}: ${fileName}${rest}`;
};

const pipeWithOptionalSummaryFilter = (stream, destination, suppressSummary) => {
  if (!stream) return;
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!suppressSummary || !shouldSuppressSummaryLine(line)) {
        destination.write(formatStatusLine(line) + '\n');
      }
    }
  });

  stream.on('end', () => {
    if (buffer && (!suppressSummary || !shouldSuppressSummaryLine(buffer))) {
      destination.write(formatStatusLine(buffer));
    }
  });
};

const suppressSummary = !options.verbose;
const child = spawn(jestCommand, jestCmdArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: env,
  cwd: process.cwd()
});

pipeWithOptionalSummaryFilter(child.stdout, process.stdout, suppressSummary);
pipeWithOptionalSummaryFilter(child.stderr, process.stderr, suppressSummary);

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
