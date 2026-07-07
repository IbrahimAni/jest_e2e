# Contributing to Jest E2E

Thanks for wanting to contribute to `jest-e2e`. This project is a Jest and Puppeteer based E2E testing framework, so changes should keep the developer experience simple, reliable, and easy to debug.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies:

```bash
npm install
```

3. Run the test suite:

```bash
npm test
```

4. For framework-focused tests, run:

```bash
npm run test:framework
```

5. To try the CLI locally, run:

```bash
npm run jest-e2e -- --help
```

## Development Workflow

- Create a branch for your change.
- Keep changes focused on one bug, feature, or documentation improvement.
- Follow the existing ES module style used in the project.
- Prefer clear test names and one E2E scenario per test file.
- Update documentation when you change CLI behavior, public APIs, examples, or setup steps.

## Testing Changes

Before opening a pull request, run the checks that match your change:

```bash
npm test
npm run test:framework
npm audit
```

If you change browser behavior, also run at least one visible-browser test while developing:

```bash
npm run test:visible
```

## Pull Request Guidelines

Please include:

- A short summary of what changed.
- Why the change is needed.
- The commands you ran to test it.
- Screenshots or logs when a browser workflow changes.
- Any breaking changes or migration notes.

## Reporting Bugs

When reporting a bug, include:

- Your Node.js and npm versions.
- Your operating system.
- The `jest-e2e` version.
- The command you ran.
- The full error message or relevant logs.
- A minimal test case or reproduction steps when possible.

## Security

If you find a security issue, please do not open a public issue with exploit details. Report it privately through the repository owner or the package maintainer listed on npm.

For dependency updates, verify the result with:

```bash
npm audit
```

## Code of Conduct

Be respectful and constructive. Contributions are easier to review when discussion stays specific, kind, and focused on making the project better.
