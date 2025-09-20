import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages';
import { TEST_USERS, UserCredentials } from './fixtures';

test.describe('Login Success Matrix - All Roles and Organizations', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  // Generate individual test for each user combination
  TEST_USERS.forEach((user: UserCredentials) => {
    test(`Login: ${user.partnerName} - ${user.userId} (${user.role})`, async () => {
      // Perform login
      await loginPage.login(user.partner, user.userId, user.role);
      
      // Wait for login completion
      await loginPage.waitForLoginToComplete();
      
      // Verify successful navigation to dashboard
      await dashboardPage.expectToBeOnDashboard();
      
      // Verify user information is correct
      await dashboardPage.expectUserInfo(user.userId, user.role);
      
      // Log success for visibility
      console.log(`✅ Successfully logged in as ${user.role} for ${user.partnerName}`);
    });
  });
});

test.describe('Quick Smoke Tests - One User Per Role', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('Partner User login smoke test', async () => {
    const user = TEST_USERS.find((u: UserCredentials) => u.role === 'PartnerUser');
    if (!user) throw new Error('No PartnerUser found in test data');

    await loginPage.login(user.partner, user.userId, user.role);
    await loginPage.waitForLoginToComplete();
    await dashboardPage.expectToBeOnDashboard();
    await dashboardPage.expectUserInfo(user.userId, user.role);
  });

  test('Partner Admin login smoke test', async () => {
    const user = TEST_USERS.find((u: UserCredentials) => u.role === 'PartnerAdmin');
    if (!user) throw new Error('No PartnerAdmin found in test data');

    await loginPage.login(user.partner, user.userId, user.role);
    await loginPage.waitForLoginToComplete();
    await dashboardPage.expectToBeOnDashboard();
    await dashboardPage.expectUserInfo(user.userId, user.role);
  });

  test('Internal Support login smoke test', async () => {
    const user = TEST_USERS.find((u: UserCredentials) => u.role === 'InternalSupport');
    if (!user) throw new Error('No InternalSupport found in test data');

    await loginPage.login(user.partner, user.userId, user.role);
    await loginPage.waitForLoginToComplete();
    await dashboardPage.expectToBeOnDashboard();
    await dashboardPage.expectUserInfo(user.userId, user.role);
    
    // Verify Internal Support has access to audit functionality
    await dashboardPage.expectNavigationForRole(user.role);
  });
});