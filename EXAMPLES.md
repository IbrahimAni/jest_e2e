# Jest E2E Example Tests

This package includes example tests that demonstrate various features and patterns of the Jest E2E framework.

## 📋 Available Examples

The examples run against **Tavola** (`https://sonic-yarrow-57gs.here.now`), a demo
restaurant app instrumented with `data-testid` attributes — ideal for the
framework's smart selectors.

### 1. `tavola-navigation-e2e.js`
**Demonstrates:**
- Basic E2ESetup() usage with a data builder
- Smart selectors (data-testid shorthand and CSS attribute selectors)
- `waitForUrl()` after clicking links
- `toHaveCount()` / `toExist()` assertions on async content

**Key Features:**
```javascript
await device.click("cta-menu");                              // [data-testid="cta-menu"]
await device.waitForUrl("/menu");
await device.expect('[data-testid^="dish-card-"]').toHaveCount(12);
```

### 2. `tavola-cart-e2e.js`
**Demonstrates:**
- Reading dynamic content with `getText()`
- Toast assertions with `toBeVisible()`
- Negated assertions that wait for removal: `.not.toExist()` / `.not.toBeVisible()`

**Key Features:**
```javascript
await device.click("cart-remove-1");
await device.expect("cart-line-1").not.toExist();   // waits until removed
await device.expect("cart-badge").not.toBeVisible();
```

### 3. `tavola-reserve-fill-e2e.js`
**Demonstrates:**
- `fill()` for date/time inputs (keyboard typing is locale-flaky there)
- `clear()` + `type()` for value replacement
- Form validation error assertions

**Key Features:**
```javascript
await device.fill("reserve-date", "2026-07-10");    // direct value + input/change events
await device.clear("reserve-name");
await device.type("reserve-name", reservationName);
```

### 4. `tavola-login-e2e.js`
**Demonstrates:**
- Error state testing (bad credentials) then recovery
- `press()` — submitting a form with the Enter key
- `getValue()` and client-side redirect handling

**Key Features:**
```javascript
await device.press("login-password", "Enter");
await device.waitForUrl("/account", { waitTimeout: 15000 });
await device.expect("account-name").toContain("Emily Johnson");
```

## 🚀 Running Examples

### Run All Examples
```bash
npx jest-e2e
```

### Run Specific Example
```bash
npx jest-e2e tavola-navigation
npx jest-e2e tavola-cart
npx jest-e2e tavola-login
```

### Run with Visible Browser
```bash
npx jest-e2e tavola-navigation --useLocalBrowser
```

### Debug Mode
```bash
npx jest-e2e tavola-cart --debug --verbose
```

## 📝 Copying Examples to Your Project

After installing the package, copy the examples to your project:

```bash
# Copy all examples
cp -r node_modules/jest-e2e/__tests__/ ./examples/

# Copy specific example
cp node_modules/jest-e2e/__tests__/tavola-login-e2e.js ./__tests__/my-login-test-e2e.js
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

1. **Start with `tavola-navigation-e2e.js`** - Learn basic setup, smart selectors, and assertions
2. **Study `tavola-cart-e2e.js`** - Understand dynamic content and negated assertions
3. **Review `tavola-reserve-fill-e2e.js`** - Learn form filling (`fill`, `clear`, `type`)
4. **Review `tavola-login-e2e.js`** - Learn error handling and keyboard interaction
5. **Create your own tests** based on these patterns

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
- The examples use the Tavola demo app (`sonic-yarrow-57gs.here.now`) — update URLs to your test site
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