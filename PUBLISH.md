# Publishing Guide for Jest E2E Framework

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **npm CLI**: Make sure you have npm installed and are logged in:
   ```bash
   npm login
   ```

## Before Publishing

### 1. Update Package Information
Edit `package.json`:
- Update `author` field with your name and email
- Update `repository.url` with your GitHub repository
- Update `homepage` and `bugs.url` with your repository URLs
- Ensure the package name is unique (check on npmjs.com)

### 2. Version Management
```bash
# For patch updates (bug fixes)
npm version patch

# For minor updates (new features)
npm version minor

# For major updates (breaking changes)
npm version major
```

### 3. Test the Package
```bash
# Test locally
npm pack
npm install -g ./jest-e2e-1.0.0.tgz

# Test the CLI
jest-e2e --help

# Clean up
npm uninstall -g jest-e2e
rm jest-e2e-1.0.0.tgz
```

## Publishing Steps

### 1. First-time Publishing
```bash
# Check package name availability
npm search jest-e2e

# Publish (for public package)
npm publish --access public

# Or for scoped package (if name conflicts exist)
# First, update package.json name to "@yourusername/jest-e2e"
npm publish --access public
```

### 2. Publishing Updates
```bash
# Update version first
npm version patch  # or minor/major

# Then publish
npm publish
```

### 3. Publishing Pre-release Versions
```bash
# For beta versions
npm version prerelease --preid=beta
npm publish --tag beta

# For alpha versions
npm version prerelease --preid=alpha
npm publish --tag alpha
```

## After Publishing

### 1. Verify Installation
```bash
# Test global installation
npm install -g jest-e2e@latest

# Test the CLI
jest-e2e --help

# Clean up
npm uninstall -g jest-e2e
```

### 2. Create GitHub Release
1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Tag version should match your npm version (e.g., `v1.0.0`)
4. Add release notes describing changes

### 3. Update Documentation
- Update README with any changes
- Update CLI_README if CLI options changed
- Add examples and use cases

## Package Management

### Viewing Package Info
```bash
# View published package info
npm view jest-e2e

# View all versions
npm view jest-e2e versions --json

# View package downloads
npm view jest-e2e dist-tags
```

### Unpublishing (Use with Caution)
```bash
# Unpublish specific version (only within 24 hours)
npm unpublish jest-e2e@1.0.0

# Unpublish entire package (only within 24 hours)
npm unpublish jest-e2e --force
```

## CI/CD Integration

### GitHub Actions for Auto-Publishing
Create `.github/workflows/publish.yml`:
```yaml
name: Publish to NPM
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Best Practices

1. **Semantic Versioning**: Follow semver (major.minor.patch)
2. **Changelog**: Maintain a CHANGELOG.md file
3. **Testing**: Always test the package before publishing
4. **Documentation**: Keep README.md updated
5. **Security**: Never include sensitive information in the package
6. **Dependencies**: Keep dependencies minimal and up-to-date

## Package.json Template Updates

Update these fields before publishing:

```json
{
  "name": "your-unique-package-name",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-repo.git"
  },
  "homepage": "https://github.com/yourusername/your-repo#readme",
  "bugs": {
    "url": "https://github.com/yourusername/your-repo/issues"
  }
}
```

## Troubleshooting

### Common Issues

1. **Name Conflicts**: Choose a unique name or use scoped packages
2. **Permission Issues**: Make sure you're logged in with `npm login`
3. **Version Issues**: Make sure to increment version before publishing
4. **File Issues**: Check `.npmignore` and `files` array in package.json

### Getting Help
- [npm Documentation](https://docs.npmjs.com/)
- [npm Support](https://www.npmjs.com/support)
- [Semantic Versioning](https://semver.org/) 