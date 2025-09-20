# Playwright E2E Tests for Trading Partner Portal

This directory contains end-to-end tests for the Trading Partner Portal login functionality using Playwright.

## Test Structure

```
tests/
├── pages/                  # Page Object Models
│   ├── login-page.ts      # Login page interactions
│   ├── dashboard-page.ts  # Dashboard page interactions
│   └── index.ts           # Page exports
├── fixtures/              # Test data and utilities
│   ├── test-data.ts       # User credentials and test data
│   ├── test-utils.ts      # Common test utilities
│   └── index.ts           # Fixture exports
├── login.spec.ts          # Comprehensive login tests
├── login-matrix.spec.ts   # Matrix tests for all role/org combinations
└── README.md              # This file
```

## Test Coverage

### Organizations Tested
- **Acme Healthcare** (`acme-healthcare`)
- **Metro Medical Group** (`metro-medical`)
- **Riverside Health System** (`riverside-health`)
- **Summit Care Partners** (`summit-care`)
- **Coastal Medical Center** (`coastal-medical`)

### User Roles Tested
- **PartnerUser** - Standard partner user access
- **PartnerAdmin** - Partner administrative access
- **InternalSupport** - Internal support with audit access

### Test Scenarios

#### `login.spec.ts` - Comprehensive Login Tests
- **UI Elements Validation**: Verifies all form elements are present and functional
- **Form Validation**: Tests empty form submission and field validation
- **Successful Login**: Tests login for each organization and role combination
- **Session Management**: Tests session persistence, protected routes, and logout
- **Navigation**: Verifies role-based navigation access

#### `login-matrix.spec.ts` - Matrix Tests
- **Complete Matrix**: Individual test for each of the 15 user combinations (5 orgs × 3 roles)
- **Smoke Tests**: Quick verification tests for one user per role

## Running Tests

### Prerequisites
1. Ensure the Angular development server is running:
   ```bash
   npm run start
   ```

2. Install Playwright browsers:
   ```bash
   npm run test:e2e:install
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run only login tests
npm run test:e2e:login

# Run matrix tests (all role/org combinations)
npm run test:e2e:matrix

# Run smoke tests only
npm run test:e2e:smoke

# Show test report
npm run test:e2e:report
```

### Browser Support
Tests run on:
- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)

## Test Data

The test data includes 15 user combinations:

| Organization | Partner User | Partner Admin | Internal Support |
|-------------|--------------|---------------|------------------|
| Acme Healthcare | john.doe | jane.admin | support.user |
| Metro Medical | mike.jones | sarah.admin | tech.support |
| Riverside Health | bob.smith | alice.manager | system.admin |
| Summit Care | david.wilson | emma.lead | ops.support |
| Coastal Medical | lisa.brown | tom.supervisor | help.desk |

## Page Object Model

### LoginPage
- `goto()` - Navigate to login page
- `login(partner, userId, role)` - Complete login flow
- `selectPartner(partner)` - Select organization
- `enterUserId(userId)` - Enter user ID
- `selectRole(role)` - Select user role
- `clickLogin()` - Submit form
- `expectErrorMessage()` - Verify error messages
- `expectFormValidationErrors()` - Check validation

### DashboardPage
- `expectToBeOnDashboard()` - Verify dashboard page
- `expectUserInfo(userId, role)` - Verify user display
- `expectNavigationForRole(role)` - Verify role-based nav
- `logout()` - Perform logout

## Configuration

The tests are configured in `playwright.config.ts`:
- **Base URL**: `http://localhost:4200`
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Enabled
- **Screenshots**: On failure
- **Video**: Retained on failure
- **Trace**: On first retry

## CI/CD Integration

The tests are designed to run in CI environments:
- Automatic browser installation
- Retry logic for flaky tests
- Comprehensive reporting
- Artifact collection (screenshots, videos, traces)

## Troubleshooting

### Common Issues

1. **App not running**: Ensure `npm run start` is running and app is accessible at `http://localhost:4200`

2. **Browser not installed**: Run `npm run test:e2e:install`

3. **Tests timing out**: Check if the Angular app is loading slowly or if there are network issues

4. **Flaky tests**: Use `--retries=3` flag or run specific tests with `--debug`

### Debug Mode
```bash
npm run test:e2e:debug
```
This opens the Playwright Inspector for step-by-step debugging.

### Test Reports
After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

## Best Practices

1. **Independent Tests**: Each test cleans up after itself
2. **Page Objects**: Reusable page interaction methods
3. **Test Data**: Centralized test data management
4. **Explicit Waits**: Proper waiting for elements and navigation
5. **Error Handling**: Comprehensive error checking and reporting
6. **Parallel Execution**: Tests designed for parallel execution