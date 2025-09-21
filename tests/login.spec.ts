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
      await expect(loginPage.loginTitle).toHaveText('Point C Health Trading Portal');
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
      // With empty form, the submit button should be disabled (good UX)
      await expect(loginPage.loginButton).toBeDisabled();
      
      // Touch all fields to trigger validation
      await loginPage.partnerSelect.click();
      await loginPage.partnerSelect.blur();
      await loginPage.userIdInput.click();
      await loginPage.userIdInput.blur();
      await loginPage.roleSelect.click();
      await loginPage.roleSelect.blur();
      
      // Should show validation errors for all empty required fields
      await expect(loginPage.page.locator('.form-error')).toHaveCount(3);
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
      // Fill other fields but leave partner empty
      await loginPage.enterUserId('test.user');
      await loginPage.selectRole('PartnerUser');
      
      // Button should be disabled when required field is missing
      await expect(loginPage.loginButton).toBeDisabled();
      
      // Touch the partner field to trigger validation
      await loginPage.partnerSelect.click();
      await loginPage.partnerSelect.blur();
      
      // Should show validation error for the empty partner field
      await expect(loginPage.page.locator('.form-error')).toContainText('Please select your organization');
    });

    test('should show error for missing user ID', async () => {
      // Fill other fields but leave user ID empty
      await loginPage.selectPartner('11111111-1111-1111-1111-111111111111');
      await loginPage.selectRole('PartnerUser');
      
      // Button should be disabled when required field is missing
      await expect(loginPage.loginButton).toBeDisabled();
      
      // Touch the user ID field to trigger validation
      await loginPage.userIdInput.click();
      await loginPage.userIdInput.blur();
      
      // Should show validation error for the empty user ID field
      await expect(loginPage.page.locator('.form-error')).toContainText('User ID is required');
    });

    test('should show error for missing role selection', async () => {
      // Fill other fields but leave role empty
      await loginPage.selectPartner('11111111-1111-1111-1111-111111111111');
      await loginPage.enterUserId('test.user');
      
      // Button should be disabled when required field is missing
      await expect(loginPage.loginButton).toBeDisabled();
      
      // Touch the role field to trigger validation
      await loginPage.roleSelect.click();
      await loginPage.roleSelect.blur();
      
      // Should show validation error for the empty role field
      await expect(loginPage.page.locator('.form-error')).toContainText('Please select your role');
    });

    test('should enable login button when all fields are filled', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.selectPartner('11111111-1111-1111-1111-111111111111');
      await loginPage.enterUserId('test.user');
      await loginPage.selectRole('PartnerUser');
      
      // Wait a bit for form validation to complete
      await page.waitForTimeout(100);
      
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