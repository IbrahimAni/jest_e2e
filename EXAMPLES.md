# Jest E2E Example Tests

This package includes example tests that demonstrate various features and patterns of the Jest E2E framework.

## 📋 Available Examples

### 1. `example-login-success-e2e.js`
**Demonstrates:**
- Basic E2ESetup() usage with custom data builders
- Form interaction (typing, clicking)
- Content verification using expect assertions
- Successful user flow testing

**Key Features:**
```javascript
// Data builder usage
const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
});

// Device interactions
await device.type("email-input", userEmail);
await device.click("submit-button");

// Content assertions
await device.expect("body").toContain("Agent Dashboard");
```

### 2. `example-login-invalid-e2e.js`
**Demonstrates:**
- Error scenario testing
- URL-based assertions
- Hardcoded test data for specific cases
- Validation of failed authentication

**Key Features:**
```javascript
// Error testing with invalid data
await device.type("email-input", "invalid@example.com");
await device.type("password-input", "wrongpassword");

// URL verification
const currentUrl = device.url();
expect(currentUrl).toContain("/login");
```

### 3. `example-form-validation-e2e.js`
**Demonstrates:**
- Fluent expect API usage
- Element existence and visibility checking
- Negative assertions with `.not` modifier
- Form state validation

**Key Features:**
```javascript
// Element existence checks
await device.expect("email-input").toExist();
await device.expect("password-input").toBeVisible();

// Negative assertions
await device.expect(".success-message").not.toExist();
await device.expect("email-input").not.toHaveValue("wrong@email.com");
```

## 🚀 Running Examples

### Run All Examples
```bash
npx jest-e2e
```

### Run Specific Example
```bash
npx jest-e2e example-login-success
npx jest-e2e example-form-validation
npx jest-e2e example-login-invalid
```

### Run with Visible Browser
```bash
npx jest-e2e example-login-success --useLocalBrowser true
```

### Debug Mode
```bash
npx jest-e2e example-form-validation --debug --verbose
```

## 📝 Copying Examples to Your Project

After installing the package, copy the examples to your project:

```bash
# Copy all examples
cp -r node_modules/jest-e2e/__tests__/ ./examples/

# Copy specific example
cp node_modules/jest-e2e/__tests__/example-login-success-e2e.js ./__tests__/my-login-test-e2e.js
```

## 🔧 Customizing Examples

### 1. Update URLs
Change the target URL to your application:
```javascript
await device.navigate("https://your-app.com/login");
```

### 2. Update Selectors
Modify selectors to match your HTML:
```javascript
await device.type("#your-email-field", userEmail);
await device.click(".your-submit-button");
```

### 3. Create Custom Data Builders
```javascript
// your-custom-data-builder.js
export function yourCustomDataBuilder() {
  return {
    ...baseDataBuilder(),
    userEmail: 'your-test@email.com',
    userPassword: 'your-test-password',
    // ... other test data
    
    genImp() { return 'your-builder-v1'; },
    getVersion() { return '1.0.0'; }
  };
}
```

### 4. Add Your Own Assertions
```javascript
// Verify specific content
await device.expect(".welcome-message").toContain("Welcome, User!");

// Check multiple elements
await device.expect(".user-avatar").toBeVisible();
await device.expect(".logout-button").toExist();
```

## 📚 Learning Path

1. **Start with `example-login-success-e2e.js`** - Learn basic setup and interactions
2. **Study `example-form-validation-e2e.js`** - Understand the expect API
3. **Review `example-login-invalid-e2e.js`** - Learn error handling patterns
4. **Create your own tests** based on these patterns

## 🎯 Best Practices from Examples

### Test Organization
- One test per file (enforced by the framework)
- Descriptive test names with "EXAMPLE:" prefix
- Clear comments explaining each step

### Data Management
- Use data builders for test data
- Separate test data from test logic
- Use meaningful variable names

### Assertions
- Verify both positive and negative cases
- Use appropriate assertion methods
- Check multiple states when needed

### Error Handling
- Test both success and failure paths
- Verify error messages and states
- Check redirects and URL changes

## 🔍 Common Patterns

### Setup Pattern
```javascript
const { getTestData, getDevices } = E2ESetup({
  databuilder: YourDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});
```

### Interaction Pattern
```javascript
// Navigate → Fill → Submit → Verify
await device.navigate(url);
await device.type(selector, value);
await device.click(submitSelector);
await device.expect(resultSelector).toContain(expectedText);
```

### Validation Pattern
```javascript
// Check existence → Check visibility → Check values
await device.expect(selector).toExist();
await device.expect(selector).toBeVisible();
await device.expect(selector).toHaveValue(expectedValue);
```

## 🆘 Troubleshooting Examples

### Examples Don't Run
- Ensure you have the package installed: `npm install jest-e2e`
- Check that you're using the correct test names
- Verify your Node.js version (16+ required)

### Tests Fail with URL Errors
- The examples use `anilathomes.com` - update URLs to your test site
- Check network connectivity
- Verify the target site is accessible

### Selector Issues
- Update selectors to match your application's HTML
- Use browser dev tools to find correct selectors
- Test selectors in the browser console first

### Data Builder Errors
- Ensure data builders return the expected properties
- Check that `genImp()` and `getVersion()` methods are implemented
- Verify import paths are correct 