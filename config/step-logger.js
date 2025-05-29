// Step Logger - Shows current step only, overwrites previous step
class StepLogger {
  constructor() {
    this.isEnabled = this.shouldEnable();
    this.currentStep = '';
    this.stepCount = 0;
    this.startTime = null;
  }

  // Determine if step logging should be enabled
  shouldEnable() {
    // Disable if explicitly set to silent
    if (process.env.JEST_SILENT === 'true') return false;
    
    // Disable if no-steps is set
    if (process.env.JEST_NO_STEPS === 'true') return false;
    
    // Disable in CI mode unless explicitly enabled
    if (process.env.CI === 'true' && !process.env.JEST_FORCE_STEPS) return false;
    
    // Enable by default for local development
    return true;
  }

  // Initialize the logger for a test
  start(testName) {
    if (!this.isEnabled) return;
    
    this.startTime = Date.now();
    this.stepCount = 0;
    console.log(`\n🧪 Starting test: ${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Show current step (overwrites previous step)
  step(action, details = '') {
    if (!this.isEnabled) return;
    
    this.stepCount++;
    const timestamp = this.getElapsedTime();
    const stepText = `📍 ${action}${details ? ` ${details}` : ''} [${timestamp}]`;
    
    // Clear current line and write new step
    process.stdout.write('\r\x1b[K'); // \r moves to beginning, \x1b[K clears line
    process.stdout.write(stepText);
    
    this.currentStep = stepText;
  }

  // Log a successful completion
  success(message = 'Test completed successfully') {
    if (!this.isEnabled) return;
    
    const timestamp = this.getElapsedTime();
    process.stdout.write('\r\x1b[K'); // Clear current line
    console.log(`✅ ${message} [${timestamp}]`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Log an error
  error(message) {
    if (!this.isEnabled) return;
    
    const timestamp = this.getElapsedTime();
    process.stdout.write('\r\x1b[K'); // Clear current line
    console.log(`❌ ${message} [${timestamp}]`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Log info message
  info(message) {
    if (!this.isEnabled) return;
    
    process.stdout.write('\r\x1b[K'); // Clear current line
    console.log(`ℹ️  ${message}`);
    
    // Restore the current step if there was one
    if (this.currentStep) {
      process.stdout.write(this.currentStep);
    }
  }

  // Get elapsed time since start
  getElapsedTime() {
    if (!this.startTime) return '0.00s';
    const elapsed = (Date.now() - this.startTime) / 1000;
    return `${elapsed.toFixed(2)}s`;
  }

  // Enable/disable logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Check if logging is enabled
  get enabled() {
    return this.isEnabled;
  }
}

// Global step logger instance
const stepLogger = new StepLogger();

export { StepLogger, stepLogger }; 