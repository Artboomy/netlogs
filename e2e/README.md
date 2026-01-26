# E2E Testing with Coverage

This directory contains end-to-end (E2E) tests for the standalone mode of NET LOGS using Playwright.

## Quick Start

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Run E2E tests
yarn test:e2e

# Run with UI mode (interactive)
yarn test:e2e:ui

# Run in headed mode (see browser)
yarn test:e2e:headed

# View last test report
yarn test:e2e:report
```

## Architecture

### Dual Coverage System

This project maintains **two separate coverage metrics**:

1. **Unit Test Coverage** (`coverage/`)
   - Tool: Vitest with V8 coverage
   - Target: Isolated business logic
   - Thresholds: 95% statements/functions/lines, 88% branches
   - Run: `yarn test:coverage`

2. **E2E Test Coverage** (`coverage-e2e/`)
   - Tool: Playwright with Istanbul/NYC
   - Target: Integration and user flows
   - Thresholds: 70% statements/functions/lines, 65% branches
   - Run: `yarn test:e2e` (after `yarn build:e2e`)

### How E2E Coverage Works

1. **Build with Instrumentation**
   ```bash
   yarn build:e2e
   ```
   - Sets `NODE_ENV=test`
   - Vite plugin Istanbul instruments source code
   - Generates `standalone/` build with `window.__coverage__`

2. **Run Tests**
   ```bash
   yarn test:e2e
   ```
   - Playwright runs tests against instrumented build
   - Tests collect coverage via `window.__coverage__`
   - Coverage saved to `coverage-e2e/.nyc_output/`

3. **Generate Reports**
   ```bash
   npx nyc report
   ```
   - NYC processes coverage data
   - Generates HTML/JSON/LCOV reports in `coverage-e2e/`

## CI/CD Integration

### GitHub Actions Workflow

On every PR, two separate jobs run:

#### 1. `lint-and-unit-tests`
- Runs ESLint
- Runs unit tests with coverage
- Posts unit coverage comment to PR

#### 2. `e2e-tests`
- Builds standalone with instrumentation
- Runs E2E tests
- Generates E2E coverage report
- Posts E2E coverage comment to PR
- Uploads artifacts (playwright-report, coverage-e2e)

### Coverage Comments on PRs

Both jobs post separate comments:

**Unit Test Coverage:**
```
✅ Unit Test Coverage
Statements: 95.2%
Branches: 88.5%
Functions: 96.1%
Lines: 95.3%
```

**E2E Test Coverage:**
```
## E2E Test Coverage Report

| Metric | Coverage | Threshold |
|--------|----------|-----------|
| Statements | 72.5% | 70% |
| Branches | 67.3% | 65% |
| Functions | 71.8% | 70% |
| Lines | 72.1% | 70% |

✅ Coverage thresholds met!
```

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from './helpers/coverage';

test.describe('Import HAR Files', () => {
  test('should import valid HAR file', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Interact with UI
    await page.click('button[title*="Import"]');

    // Upload file
    await page.setInputFiles('input[type="file"]', './fixtures/sample.har');

    // Assert results
    await expect(page.locator('text=50 requests')).toBeVisible();
  });
});
```

### Using Coverage Helper

Always import from `./helpers/coverage` instead of `@playwright/test`:

```typescript
// ✅ Correct - enables coverage collection
import { test, expect } from './helpers/coverage';

// ❌ Wrong - no coverage collected
import { test, expect } from '@playwright/test';
```

### Test Organization

```
e2e/
├── standalone/
│   ├── init.spec.ts           # App initialization
│   ├── import.spec.ts         # HAR file import
│   ├── filtering.spec.ts      # Filtering features
│   ├── search.spec.ts         # Search functionality
│   ├── export.spec.ts         # Export features
│   ├── ui.spec.ts             # UI interactions
│   ├── keyboard.spec.ts       # Keyboard shortcuts
│   ├── theme.spec.ts          # Theme switching
│   ├── request-details.spec.ts # Request inspection
│   ├── websockets.spec.ts     # WebSocket support
│   └── errors.spec.ts         # Error handling
├── fixtures/
│   ├── sample.har
│   ├── large.har
│   ├── websocket.har
│   ├── invalid.json
│   ├── empty.har
│   └── corrupted.har
└── helpers/
    └── coverage.ts            # Coverage collection helper
```

## Configuration Files

### `playwright.config.ts`
- Browser configurations (Chromium, Firefox, WebKit)
- Viewport configurations (Desktop, Mobile, Tablet)
- Retry logic for CI
- Web server setup (starts standalone server automatically)

### `.nycrc.json`
- Coverage thresholds
- Report formats
- Include/exclude patterns
- Output directories

### `vite.config.standalone.ts`
- Istanbul plugin added when `NODE_ENV=test`
- Instruments TypeScript/TSX source files
- Excludes test files from instrumentation

## Troubleshooting

### Coverage Not Collected

**Problem**: Tests run but no coverage generated

**Solution**:
1. Ensure you built with `yarn build:e2e` (not `yarn build:standalone`)
2. Check that `NODE_ENV=test` during build
3. Verify `window.__coverage__` exists in browser console
4. Confirm you're using `import { test } from './helpers/coverage'`

### Standalone Server Not Starting

**Problem**: Tests fail with connection refused

**Solution**:
1. Check if port 3000 is available
2. Verify `scripts/preview-standalone.cjs` exists
3. Run `yarn build:e2e` first
4. Check `standalone/` directory exists with files

### Coverage Below Thresholds

**Problem**: E2E coverage fails CI checks

**Solution**:
- E2E tests focus on user flows, not exhaustive code coverage
- Unit tests should cover detailed logic (95% thresholds)
- E2E tests verify integration (70% thresholds)
- Add tests for critical untested user paths
- Consider if code is reachable through UI

## Local Development

### Running Tests Locally

```bash
# Build instrumented version
yarn build:e2e

# Run all tests
yarn test:e2e

# Run specific test file
npx playwright test e2e/standalone/import.spec.ts

# Debug specific test
npx playwright test --debug e2e/standalone/import.spec.ts

# View coverage report
npx nyc report
open coverage-e2e/index.html
```

### Test Development Workflow

1. Write test in appropriate spec file
2. Run in UI mode: `yarn test:e2e:ui`
3. Use Playwright Inspector to debug
4. Once passing, check coverage impact
5. Commit test file

## Best Practices

### Do's
✅ Use data-testid attributes for stable selectors
✅ Wait for network idle before assertions
✅ Test critical user journeys thoroughly
✅ Keep tests independent (no shared state)
✅ Use fixtures for test data
✅ Test both success and error paths

### Don'ts
❌ Don't test implementation details
❌ Don't hard-code delays (use waitFor)
❌ Don't share state between tests
❌ Don't aim for 100% E2E coverage
❌ Don't duplicate unit test scenarios
❌ Don't commit commented-out tests

## References

- [Playwright Documentation](https://playwright.dev/)
- [Istanbul Coverage](https://istanbul.js.org/)
- [NYC Configuration](https://github.com/istanbuljs/nyc#configuration-files)
- [E2E Test Plan](../.plans/E2E_TEST_PLAN.md)
