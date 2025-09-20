import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages';
import { TEST_USERS, ORGANIZATIONS, USER_ROLES, UserCredentials } from './fixtures';

test.describe('Login Functionality', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test.describe('UI Elements and Validation', () => {
    test('should display all required form elements', async () => {
      await expect(loginPage.loginTitle).toHaveText('PointC Trading Portal');
      await expect(loginPage.partnerSelect).toBeVisible();
      await expect(loginPage.userIdInput).toBeVisible();
      await expect(loginPage.roleSelect).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
      await expect(loginPage.demoNotice).toBeVisible();
    });

    test('should have all organizations in partner dropdown', async () => {
      const options = await loginPage.getPartnerOptions();
      
      // Check that all organizations are present
      for (const org of ORGANIZATIONS) {
        expect(options).toContain(org.name);
      }
    });

    test('should have all roles in role dropdown', async () => {
      const options = await loginPage.getRoleOptions();
      
      // Check that all roles are present
      expect(options).toContain('Partner User');
      expect(options).toContain('Partner Admin');
      expect(options).toContain('Internal Support');
    });

    test('should disable login button when form is empty', async () => {
      expect(await loginPage.isLoginButtonDisabled()).toBe(true);
    });

    test('should show validation errors for empty form submission', async () => {
      await loginPage.clickLogin();
      await loginPage.expectFormValidationErrors();
    });
  });

  test.describe('Successful Login Tests - All Organizations and Roles', () => {
    // Test each organization individually
    for (const org of ORGANIZATIONS) {
      test.describe(`${org.name} Organization`, () => {
        // Test each role for this organization
        for (const role of USER_ROLES) {
          test(`should login successfully as ${role}`, async () => {
            const user = TEST_USERS.find((u: UserCredentials) => u.partner === org.value && u.role === role);
            if (!user) {
              throw new Error(`No test user found for ${org.value} with role ${role}`);
            }

            // Perform login
            await loginPage.login(user.partner, user.userId, user.role);
            
            // Wait for login to complete
            await loginPage.waitForLoginToComplete();
            
            // Verify successful redirect to dashboard
            await dashboardPage.expectToBeOnDashboard();
            
            // Verify user information is displayed correctly
            await dashboardPage.expectUserInfo(user.userId, user.role);
            
            // Verify navigation is appropriate for the role
            await dashboardPage.expectNavigationForRole(user.role);
          });
        }
      });
    }
  });

  test.describe('Comprehensive Role-based Tests', () => {
    test.describe('Partner User Role', () => {
      const partnerUsers = TEST_USERS.filter((user: UserCredentials) => user.role === 'PartnerUser');
      
      for (const user of partnerUsers) {
        test(`should login as Partner User - ${user.partnerName}`, async () => {
          await loginPage.login(user.partner, user.userId, user.role);
          await loginPage.waitForLoginToComplete();
          await dashboardPage.expectToBeOnDashboard();
          await dashboardPage.expectUserInfo(user.userId, user.role);
        });
      }
    });

    test.describe('Partner Admin Role', () => {
      const partnerAdmins = TEST_USERS.filter((user: UserCredentials) => user.role === 'PartnerAdmin');
      
      for (const user of partnerAdmins) {
        test(`should login as Partner Admin - ${user.partnerName}`, async () => {
          await loginPage.login(user.partner, user.userId, user.role);
          await loginPage.waitForLoginToComplete();
          await dashboardPage.expectToBeOnDashboard();
          await dashboardPage.expectUserInfo(user.userId, user.role);
        });
      }
    });

    test.describe('Internal Support Role', () => {
      const internalSupportUsers = TEST_USERS.filter((user: UserCredentials) => user.role === 'InternalSupport');
      
      for (const user of internalSupportUsers) {
        test(`should login as Internal Support - ${user.partnerName}`, async () => {
          await loginPage.login(user.partner, user.userId, user.role);
          await loginPage.waitForLoginToComplete();
          await dashboardPage.expectToBeOnDashboard();
          await dashboardPage.expectUserInfo(user.userId, user.role);
          
          // Internal Support should have access to audit page
          await dashboardPage.expectNavigationForRole(user.role);
        });
      }
    });
  });

  test.describe('Form Validation Tests', () => {
    test('should show error for missing partner selection', async () => {
      await loginPage.enterUserId('test.user');
      await loginPage.selectRole('PartnerUser');
      await loginPage.clickLogin();
      await loginPage.expectFormValidationErrors();
    });

    test('should show error for missing user ID', async () => {
      await loginPage.selectPartner('acme-healthcare');
      await loginPage.selectRole('PartnerUser');
      await loginPage.clickLogin();
      await loginPage.expectFormValidationErrors();
    });

    test('should show error for missing role selection', async () => {
      await loginPage.selectPartner('acme-healthcare');
      await loginPage.enterUserId('test.user');
      await loginPage.clickLogin();
      await loginPage.expectFormValidationErrors();
    });

    test('should enable login button when all fields are filled', async () => {
      await loginPage.selectPartner('acme-healthcare');
      await loginPage.enterUserId('test.user');
      await loginPage.selectRole('PartnerUser');
      
      expect(await loginPage.isLoginButtonDisabled()).toBe(false);
    });
  });

  test.describe('Navigation and Session Tests', () => {
    test('should maintain session after page refresh', async () => {
      const user = TEST_USERS[0]; // Use first test user
      
      // Login
      await loginPage.login(user.partner, user.userId, user.role);
      await loginPage.waitForLoginToComplete();
      await dashboardPage.expectToBeOnDashboard();
      
      // Refresh page
      await dashboardPage.page.reload();
      
      // Should still be on dashboard
      await dashboardPage.expectToBeOnDashboard();
      await dashboardPage.expectUserInfo(user.userId, user.role);
    });

    test('should redirect to login when accessing protected route without session', async ({ page }) => {
      // Try to access dashboard directly
      await page.goto('/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should logout successfully', async () => {
      const user = TEST_USERS[0]; // Use first test user
      
      // Login
      await loginPage.login(user.partner, user.userId, user.role);
      await loginPage.waitForLoginToComplete();
      await dashboardPage.expectToBeOnDashboard();
      
      // Logout
      await dashboardPage.logout();
      
      // Should be redirected to login
      await loginPage.expectToBeOnLoginPage();
    });
  });
});